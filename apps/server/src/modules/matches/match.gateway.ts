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
    if (client.userId) {
      this.matches.forEach((match, matchId) => {
        match.removePlayer(client.userId!);
        if (match.getState().robots.length === 0) {
          match.stop();
          this.matches.delete(matchId);
        }
      });
    }
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
      match = new MatchEngine(data.matchId, [{ id: client.userId, script: script.content }]);
      this.matches.set(data.matchId, match);
      match.start();
      client.matchId = data.matchId;
      client.join(data.matchId);
      this.broadcastMatchState(data.matchId, match.getState());
    } else {
      const playerExists = match.getState().robots.some((p: any) => p.id === client.userId);
      if (!playerExists) {
        match.addPlayer({ id: client.userId, script: script.content });
        client.matchId = data.matchId;
        client.join(data.matchId);
        this.broadcastMatchState(data.matchId, match.getState());
      }
    }
  }

  private broadcastMatchState(matchId: string, state: any) {
    this.server.to(matchId).emit("gameState", state);
  }

  onModuleInit() {
    setInterval(() => {
      this.matches.forEach((match, matchId) => {
        this.broadcastMatchState(matchId, match.getState());
      });
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
    }
  }

  @SubscribeMessage("manualCommand")
  handleManualCommand(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { command: string }) {
    if (client.matchId && this.matches.has(client.matchId)) {
      const match = this.matches.get(client.matchId);
      match?.receiveManualCommand(client.userId!, data.command);
    }
  }
}