import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { GameLoop, Robot } from "@logic-arena/engine";

@Injectable()
export class GameService {
  private connectedClients: Map<string, Socket> = new Map();
  private gameLoop: GameLoop;

  constructor() {
    this.gameLoop = new GameLoop();

    // Initializing Robots with full Health and distinct positions
    this.gameLoop.addRobot({
      id: "bot-1",
      position: { x: 100, y: 100 },
      velocity: { x: 150, y: 120 },
      color: "#00FFFF", // Neon Cyan
      health: 100
    } as Robot);

    this.gameLoop.addRobot({
      id: "bot-2",
      position: { x: 600, y: 400 },
      velocity: { x: -120, y: 150 },
      color: "#FF00FF", // Neon Pink
      health: 100
    } as Robot);

    this.gameLoop.start();

    // The Action Loop: Robots firing at each other every 1.5 seconds
    setInterval(() => {
      const robots = this.gameLoop.getRobots();
      if (robots.length >= 2) {
        const r1 = robots[0];
        const r2 = robots[1];

        // Only fire if both are alive
        if (r1.health > 0 && r2.health > 0) {
          // Bot 1 targets Bot 2
          this.fire(r1.id, r2.position.x, r2.position.y);
          // Bot 2 targets Bot 1
          this.fire(r2.id, r1.position.x, r1.position.y);
        }
      }
    }, 1500);
  }

  getGameLoop(): GameLoop {
    return this.gameLoop;
  }

  getGameState(): Robot[] {
    return this.gameLoop.getRobots();
  }

  // Core Fire Logic: Spawns a projectile in the engine towards a target
  fire(robotId: string, targetX: number, targetY: number): void {
    const robots = this.gameLoop.getRobots();
    const robot = robots.find(r => r.id === robotId);

    if (robot && robot.health > 0) {
      // Accessing the engine's spawnProjectile method
      this.gameLoop.spawnProjectile(
        robotId,
        { ...robot.position },
        { x: targetX, y: targetY }
      );
    }
  }

  joinGame(client: Socket, userId: string): void {
    this.connectedClients.set(userId, client);
    console.log(`Client ${userId} connected to Logic Arena.`);

    client.on("disconnect", () => {
      this.connectedClients.delete(userId);
    });
  }
}