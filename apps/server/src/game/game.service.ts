import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { GameLoop, Robot } from "@logic-arena/engine";

@Injectable()
export class GameService {
  private connectedClients: Map<string, Socket> = new Map();
  private lastFireTime: Map<string, number> = new Map(); // Cooldown mechanism
  private readonly FIRE_COOLDOWN_MS = 500; // 500ms cooldown
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

  fire(robotId: string, targetX: number, targetY: number): void {
    const robots = this.gameLoop.getRobots();
    const robot = robots.find(r => r.id === robotId);

    if (robot && robot.health > 0) {
      this.gameLoop.spawnProjectile(
        robotId,
        { ...robot.position },
        { x: targetX, y: targetY }
      );
    }
  }

  fireProjectile(robotId: string): void {
    const now = Date.now();
    const lastFire = this.lastFireTime.get(robotId) || 0;

    if (now - lastFire < this.FIRE_COOLDOWN_MS) {
      console.log(`Robot ${robotId} is on cooldown. Cannot fire.`);
      return;
    }

    const robots = this.gameLoop.getRobots();
    const robot = robots.find(r => r.id === robotId);
    const targetRobot = robots.find(r => r.id !== robotId && r.health > 0); // Target another alive robot

    if (robot && robot.health > 0 && targetRobot) {
      this.fire(robotId, targetRobot.position.x, targetRobot.position.y);
      this.lastFireTime.set(robotId, now);
      console.log(`Robot ${robotId} manually fired at ${targetRobot.id}`);
    } else {
      console.log(`Robot ${robotId} cannot fire. No valid target or robot is dead.`);
    }
  }

  joinGame(client: Socket, userId: string): void {
    this.connectedClients.set(userId, client);
    console.log(`Client ${userId} connected to Logic Arena.`);

    client.on("disconnect", () => {
      this.connectedClients.delete(userId);
    });
  }

  resetGame(): void {
    this.gameLoop.getRobots().forEach(robot => {
      robot.health = 100;
    });
  }
}