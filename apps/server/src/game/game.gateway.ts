import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";

@WebSocketGateway({
  cors: { origin: "http://localhost:3000" },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly gameService: GameService) { }

  afterInit(server: Server) {
    this.server = server;
    console.log("🚀 Gateway is LIVE. Starting Real-time Broadcast...");

    setInterval(() => {
      const robots = this.gameService.getGameState();
      const projectiles = this.gameService.getGameLoop().getProjectiles();
      this.server.emit("gameState", { robots, projectiles });
    }, 16);
  }

  handleConnection(client: Socket) {
    console.log(`[Gateway] Client connected: ${client.id}`);
    this.gameService.joinGame(client, client.id);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Gateway] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("resetGame")
  handleReset() {
    console.log("💉 [Gateway] Revive command received! Respawning robots...");
    this.gameService.resetGame();
  }

  @SubscribeMessage("manualCommand")
  handleManualCommand(client: Socket, payload: { command: string, robotId: string }) {
    console.log(`[Gateway] Manual command received from ${client.id}: ${payload.command} for robot ${payload.robotId}`);
    if (payload.command === "FIRE") {
      this.gameService.fireProjectile(payload.robotId);
    }
  }

  @SubscribeMessage("updateLogic")
  handleUpdateLogic(client: Socket, payload: { robotId: string, script: string }) {
    console.log(`[Gateway] Logic update received from ${client.id} for robot ${payload.robotId}`);
    this.gameService.updateRobotLogic(payload.robotId, payload.script);
  }
}