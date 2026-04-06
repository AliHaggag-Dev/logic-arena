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
    this.server = server;
    console.log("🚀 Gateway is LIVE...");

    setInterval(() => {
      const robots = this.gameService.getGameState();
      const projectiles = this.gameService.getGameLoop().getProjectiles();

      this.server.emit("gameState", { robots, projectiles });
    }, 16);
  }
}