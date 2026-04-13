import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MatchEngine } from "./match.engine";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../common/prisma.service";

type AuthenticatedSocket = Socket & {
  userId?: string;
  matchId?: string;
};

@WebSocketGateway({
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private matches: Map<string, MatchEngine> = new Map();
  private lastStateJson: Map<string, string> = new Map();
  private lobbyMatches: Map<string, { hostId: string; hostName: string; matchId: string; createdAt: number }> = new Map();
  private matchStartTime: Map<string, number> = new Map();

  constructor(private prisma: PrismaService) { }

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization;

    if (!token) {
      client.emit("error", { message: "Unauthorized: No token provided" });
      client.disconnect(true);
      return;
    }

    try {
      const cleanToken = token.replace('Bearer ', '');
      const decoded: any = jwt.verify(cleanToken, process.env.JWT_SECRET as string);

      client.userId = decoded.sub;
      client.emit("authenticated", { userId: client.userId });
    } catch (err) {
      client.emit("error", { message: "Unauthorized: Invalid token" });
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    // Do nothing on disconnect - player will rejoin on reconnect
    // This prevents the robot from being removed on page refresh
  }

  @SubscribeMessage("joinMatch")
  async handleJoinMatch(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { matchId: string; scriptId: string }) {
    if (!client.userId) {
      client.emit("error", { message: "Unauthorized: User not authenticated." });
      return;
    }

    if (!data.scriptId) {
      client.emit("error", { message: "Invalid scriptId provided." });
      return;
    }

    const script = await this.prisma.robotScript.findUnique({
      where: { id: data.scriptId, userId: client.userId },
    });

    if (!script) {
      client.emit("error", { message: "Script not found or unauthorized." });
      return;
    }

    let match = this.matches.get(data.matchId);

    if (!match) {
      match = new MatchEngine(data.matchId, [
        { id: client.userId, script: script.content },
        { id: "bot-2", script: "" }
      ]);
      this.matches.set(data.matchId, match);
      this.matchStartTime.set(data.matchId, Date.now());
      match.start();
    } else {
      if (this.lobbyMatches.has(data.matchId)) {
        match.removePlayer("bot-2");
        match.addPlayer({ id: client.userId!, script: script.content });
        this.lobbyMatches.delete(data.matchId);
        this.server.emit("lobbyUpdated", Array.from(this.lobbyMatches.values()));
      } else {
        match.removePlayer(client.userId!);
        match.addPlayer({ id: client.userId!, script: script.content });
        match.updateInitialPlayer(client.userId!, script.content);
      }
    }

    client.matchId = data.matchId;
    client.join(data.matchId);
    this.broadcastMatchState(data.matchId, match.getState());
  }

  @SubscribeMessage("createMatch")
  async handleCreateMatch(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { scriptId: string }) {
    if (!client.userId) return;
    const user = await this.prisma.user.findUnique({ where: { id: client.userId } });
    const matchId = crypto.randomUUID();
    this.lobbyMatches.set(matchId, {
      hostId: client.userId,
      hostName: user?.username || "Unknown Hacker",
      matchId,
      createdAt: Date.now(),
    });
    client.emit("matchCreated", { matchId });
    this.server.emit("lobbyUpdated", Array.from(this.lobbyMatches.values()));
  }

  @SubscribeMessage("getLobby")
  handleGetLobby(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit("lobbyList", Array.from(this.lobbyMatches.values()));
  }

  private broadcastMatchState(matchId: string, state: any) {
    this.server.to(matchId).emit("gameState", state);
  }

  onModuleInit() {
    setInterval(async () => {
      for (const [matchId, match] of this.matches.entries()) {
        const state = match.getState();

        const allRobots = state.robots.filter((r: any) => r.health > 0);

        if (state.robots.length > 0 && allRobots.length <= 1) {
          const winner = state.robots.find((r: any) => r.health > 0) || null;
          this.server.to(matchId).emit("matchOver", {
            winner: winner ? { id: winner.id, color: winner.color } : null,
            draw: allRobots.length === 0
          });

          // Save Match Result
          const playerIds = state.robots.map((r: any) => r.id).filter((id: string) => id !== "bot-2");
          const startTime = this.matchStartTime.get(matchId) || Date.now();

          if (playerIds.length > 0) {
            await this.prisma.match.create({
              data: {
                type: "Friendly",
                winnerId: winner && winner.id !== "bot-2" ? winner.id : null,
                duration: Math.floor((Date.now() - startTime) / 1000),
                participants: {
                  connect: playerIds.map((id: string) => ({ id }))
                }
              }
            });

            if (winner && winner.id !== "bot-2") {
              await this.prisma.user.update({
                where: { id: winner.id },
                data: { rank: { increment: 10 } }
              });
            }
          }

          match.stop();
          this.matches.delete(matchId);
          this.lastStateJson.delete(matchId);
          this.matchStartTime.delete(matchId);
          continue;
        }

        const json = JSON.stringify(state);
        if (this.lastStateJson.get(matchId) !== json) {
          this.lastStateJson.set(matchId, json);
          this.broadcastMatchState(matchId, state);
        }
      }
    }, 50);
  }

  @SubscribeMessage("resetGame")
  handleResetGame(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { matchId: string }) {
    if (client.matchId && this.matches.has(client.matchId)) {
      const match = this.matches.get(client.matchId);
      match?.reset();
      this.broadcastMatchState(client.matchId, match?.getState());
    }
  }

  @SubscribeMessage("updateLogic")
  handleUpdateLogic(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { robotId: string, scriptContent: string }) {
    if (client.matchId && this.matches.has(client.matchId)) {
      const match = this.matches.get(client.matchId);
      match?.updateRobotScript(data.robotId, data.scriptContent);
      client.emit("logicExecuted", { robotId: data.robotId, action: "SCRIPT_DEPLOYED", message: "Neural payload active." });
    }
  }

  @SubscribeMessage("manualCommand")
  handleManualCommand(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { command: string }) {
    if (client.matchId && this.matches.has(client.matchId)) {
      const match = this.matches.get(client.matchId);
      match?.receiveManualCommand(client.userId!, data.command);
      client.emit("logicExecuted", { robotId: client.userId, action: data.command, message: "Manual command executed." });
    }
  }
}