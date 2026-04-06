import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { GameLoop, Robot } from "@logic-arena/engine";

@Injectable()
export class GameService {
  private connectedClients: Map<string, Socket> = new Map();
  private gameLoop: GameLoop;

  constructor() {
    this.gameLoop = new GameLoop();

    // Initializing Robots with Health
    this.gameLoop.addRobot({
      id: "bot-1",
      position: { x: 100, y: 100 },
      velocity: { x: 150, y: 100 }, // Scaled for deltaTime
      color: "#00FFFF",
      health: 100
    } as Robot);

    this.gameLoop.addRobot({
      id: "bot-2",
      position: { x: 400, y: 300 },
      velocity: { x: -100, y: 150 },
      color: "#FF00FF",
      health: 100
    } as Robot);

    this.gameLoop.start();
  }

  // Gateway needs this to pull projectiles
  getGameLoop(): GameLoop {
    return this.gameLoop;
  }

  getGameState(): Robot[] {
    return this.gameLoop.getRobots();
  }

  // Method to trigger a shot (We'll use this in AliScript later)
  fire(robotId: string, targetX: number, targetY: number): void {
    const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
    if (robot && robot.health > 0) {
      this.gameLoop.spawnProjectile(robotId, robot.position, { x: targetX, y: targetY });
    }
  }

  joinGame(client: Socket, userId: string): void {
    this.connectedClients.set(userId, client);
    console.log(`Client ${userId} connected.`);

    client.on("disconnect", () => {
      this.connectedClients.delete(userId);
    });
  }
}