import { WebSocketGateway, WebSocketServer, OnGatewayInit, SubscribeMessage } from "@nestjs/websockets";
import { Server } from "socket.io";
import { GameService } from "./game.service";

@WebSocketGateway({
  cors: { origin: "http://localhost:3000" },
})
export class GameGateway implements OnGatewayInit {
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

  @SubscribeMessage("resetGame")
  handleReset() {
    console.log("💉 [Gateway] Revive command received! Respawning robots...");
    this.gameService.resetGame();
  }

  @SubscribeMessage("manualCommand")
  handleManualCommand(client: any, payload: { command: string, robotId: string }) {
    console.log(`[Gateway] Manual command received from ${client.id}: ${payload.command} for robot ${payload.robotId}`);
    if (payload.command === "FIRE") {
      this.gameService.fireProjectile(payload.robotId);
    }
  }
}