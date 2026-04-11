import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WsException, WebSocketServer } from "@nestjs/websockets";
import { Server, WebSocket } from "ws";
import { MatchEngine } from "./match.engine";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../common/prisma.service";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  matchId?: string;
  handshake?: any;
}

@WebSocketGateway({ cors: { origin: "." } })
export class MatchGateway {
  @WebSocketServer()
  server!: Server;

  private matches: Map<string, MatchEngine> = new Map();
  private connectedClients: Map<string, AuthenticatedWebSocket> = new Map();

  constructor(private prisma: PrismaService) { }

  async handleConnection(@ConnectedSocket() client: AuthenticatedWebSocket) {
    const token = (client as any).handshake?.auth?.token as string;
    if (!token) {
      (client as any).send(JSON.stringify({ event: "error", message: "Unauthorized: No token provided" }));
      (client as any).close(1008, "Unauthorized: No token provided");
      return;
    }
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      if (decoded.sub) {
        client.userId = decoded.sub;
        this.connectedClients.set(client.userId as string, client);
      }
      console.log(`Client connected and authenticated: ${client.userId}`);
      (client as any).send(JSON.stringify({ event: "authenticated", userId: client.userId }));
    } catch (err) {
      (client as any).send(JSON.stringify({ event: "error", message: "Unauthorized: Invalid token" }));
      (client as any).close(1008, "Unauthorized: Invalid token");
    }
  }

  handleDisconnect(@ConnectedSocket() client: AuthenticatedWebSocket) {
    console.log(`Client disconnected: ${client.userId}`);
    if (client.userId) {
      this.connectedClients.delete(client.userId);
      this.matches.forEach((match, matchId) => {
        match.removePlayer(client.userId!); // Assuming MatchEngine has a removePlayer method
        if (match.getState().players.length === 0) {
          match.stop();
          this.matches.delete(matchId);
          console.log(`Match ${matchId} ended due to no players.`);
        }
      });
    }
  }

  @SubscribeMessage("joinMatch")
  async handleJoinMatch(@ConnectedSocket() client: AuthenticatedWebSocket, @MessageBody() data: { matchId: string; scriptId: string }) {
    if (!client.userId) {
      (client as any).send(JSON.stringify({ event: "error", message: "Unauthorized: User not authenticated for WebSocket." }));
      return;
    }

    console.log(`Client ${client.userId} joining match ${data.matchId} with script ${data.scriptId}`);

    let match = this.matches.get(data.matchId);
    const script = await this.prisma.robotScript.findUnique({
      where: { id: data.scriptId, userId: client.userId },
    });

    if (!script) {
      (client as any).send(JSON.stringify({ event: "error", message: "Script not found or unauthorized." }));
      return;
    }

    if (!match) {
      match = new MatchEngine(data.matchId, [{ id: client.userId, script: script.content }]);
      this.matches.set(data.matchId, match);
      match.start();
      client.matchId = data.matchId; // Associate client with this match
      this.broadcastMatchState(data.matchId, match.getState());
    } else {
      const playerExists = match.getState().players.some(p => p.id === client.userId);
      if (!playerExists) {
        match.addPlayer({ id: client.userId, script: script.content }); // Assuming MatchEngine has an addPlayer method
        client.matchId = data.matchId;
        this.broadcastMatchState(data.matchId, match.getState());
      }
    }
  }

  private broadcastMatchState(matchId: string, state: any) {
    this.server.clients.forEach(client => {
      const authClient = client as AuthenticatedWebSocket;
      if (authClient.matchId === matchId && (authClient as any).readyState === WebSocket.OPEN) {
        (authClient as any).send(JSON.stringify({ event: "matchState", data: state }));
      }
    });
  }
} 