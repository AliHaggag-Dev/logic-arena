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
  private lastStateMap: Map<string, any> = new Map();
  private lobbyMatches: Map<string, { hostId: string; hostName: string; matchId: string; createdAt: number }> = new Map();
  private matchStartTime: Map<string, number> = new Map();
  private replaySnapshots: Map<string, any[]> = new Map();
  private tickCount: Map<string, number> = new Map();
  private savingMatches: Set<string> = new Set();
  private matchModes: Map<string, string> = new Map();

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
  async handleJoinMatch(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { matchId: string; scriptId: string; mode?: 'COMBAT' | 'RACING' | 'TRAINING_SOLO' }) {
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
    let currentMode = this.matchModes.get(data.matchId);
    const mode = data.mode || 'COMBAT';

    if (match && currentMode && currentMode !== mode) {
       match.stop();
       this.matches.delete(data.matchId);
       this.lastStateMap.delete(data.matchId);
       this.matchStartTime.delete(data.matchId);
       this.matchModes.delete(data.matchId);
       this.replaySnapshots.delete(data.matchId);
       this.tickCount.delete(data.matchId);
       this.savingMatches.delete(data.matchId);
       match = undefined;
    }

    if (!match) {
      const initialPlayers = (mode === 'RACING' || mode === 'TRAINING_SOLO')
        ? [{ id: client.userId, script: script.content }]
        : [{ id: client.userId, script: script.content }, { id: "bot-2", script: "" }];

      match = new MatchEngine(data.matchId, initialPlayers, {
        mode,
        disableProjectiles: mode === 'RACING' || mode === 'TRAINING_SOLO'
      });
      this.matches.set(data.matchId, match);
      this.matchModes.set(data.matchId, mode);
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
    client.emit("matchJoinedInfo", { mode });
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

        // --- Replay snapshot recording ---
        const tick = (this.tickCount.get(matchId) || 0) + 1;
        this.tickCount.set(matchId, tick);
        if (tick % 10 === 0) {
          const snapshots = this.replaySnapshots.get(matchId) || [];
          snapshots.push({ 
            t: tick, 
            robots: state.robots.map((r: any) => ({
              id: r.id,
              position: { x: r.position.x, y: r.position.y },
              health: r.health,
              color: r.color,
              rotation: r.rotation,
              isAlive: r.isAlive
            })),
            projectiles: state.projectiles.map((p: any) => ({
              id: p.id,
              position: { x: p.position.x, y: p.position.y },
              velocity: p.velocity,
              ownerId: p.ownerId
            }))
          });
          this.replaySnapshots.set(matchId, snapshots);
        }

        const allRobots = state.robots.filter((r: any) => r.health > 0);
        const mode = this.matchModes.get(matchId) || 'COMBAT';
        let matchIsOver = false;
        let winner: any = null;

        if (mode === 'RACING') {
          const TARGET_X = 700;
          const TARGET_Y = 300;
          winner = state.robots.find((r: any) => Math.hypot(r.position.x - TARGET_X, r.position.y - TARGET_Y) < 50);
          if (winner) matchIsOver = true;
        } else if (mode === 'TRAINING_SOLO') {
          // Training mode never ends automatically
          matchIsOver = false;
        } else if (state.robots.length > 0 && allRobots.length <= 1) {
          matchIsOver = true;
          winner = allRobots.length === 1 ? allRobots[0] : null;
        }

        if (matchIsOver) {
          // Guard against duplicate saves while async DB write is in-flight
          if (this.savingMatches.has(matchId)) continue;
          this.savingMatches.add(matchId);

          this.server.to(matchId).emit("matchOver", {
            winner: winner ? { id: winner.id, color: winner.color } : null,
            draw: !winner && mode !== 'RACING'
          });

          // Save Match Result
          const playerIds = state.robots.map((r: any) => r.id).filter((id: string) => id !== "bot-2");
          const startTime = this.matchStartTime.get(matchId) || Date.now();

          if (playerIds.length > 0) {
            const snapshots = this.replaySnapshots.get(matchId) || [];
            await this.prisma.match.create({
              data: {
                type: "Friendly",
                winnerId: winner && winner.id !== "bot-2" ? winner.id : null,
                duration: Math.floor((Date.now() - startTime) / 1000),
                replayData: snapshots,
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
          this.lastStateMap.delete(matchId);
          this.matchStartTime.delete(matchId);
          this.matchModes.delete(matchId);
          this.replaySnapshots.delete(matchId);
          this.tickCount.delete(matchId);
          this.savingMatches.delete(matchId);
          continue;
        }

        const prevState = this.lastStateMap.get(matchId);
        let delta: any = { type: 'full', state };

        if (prevState) {
          const robotsDiff = state.robots.map((r: any) => {
             const prevR = prevState.robots.find((pr: any) => pr.id === r.id);
             if (!prevR) return r;
             let rd: any = { id: r.id };
             let changed = false;
             ['position', 'velocity', 'health', 'rotation', 'isAlive', 'color', 'maxHealth', 'slowedUntil', 'speedMultiplier', 'trappedUntil', 'shields'].forEach(prop => {
                 if (JSON.stringify(r[prop]) !== JSON.stringify(prevR[prop])) {
                     rd[prop] = r[prop];
                     changed = true;
                 }
             });
             return changed ? rd : null;
          }).filter(Boolean);

          delta = { 
            type: 'delta', 
            diff: { 
               robots: robotsDiff, 
               projectiles: state.projectiles
            } 
          };
        }

        const deltaChanged = delta.type === 'full' || 
          (delta.diff && (delta.diff.robots.length > 0 || delta.diff.projectiles.length > 0));

        if (deltaChanged) {
          this.lastStateMap.set(matchId, JSON.parse(JSON.stringify(state)));
          this.broadcastMatchState(matchId, delta);
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