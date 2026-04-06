import { WebSocketGateway, WebSocketServer, OnGatewayInit } from "@nestjs/websockets";
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
    console.log("🚀 Gateway is LIVE. Broadcasting Robots & Projectiles...");

    setInterval(() => {
      // Fetch the state of robots and projectiles from the Service
      const robots = this.gameService.getGameState();
      const projectiles = this.gameService.getGameLoop().getProjectiles();

      if (robots.length > 0 || projectiles.length > 0) {
        // we emit a single object containing both arrays to minimize the number of emissions
        server.emit("gameState", { robots, projectiles });
      }
    }, 16); // 16ms = 60fps
  }
}