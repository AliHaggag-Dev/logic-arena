import { Robot, Vector2, Projectile } from "./types";
import { performance } from "node:perf_hooks";

const requestAnimationFrame = (callback: FrameRequestCallback) => (setTimeout(() => callback(performance.now()), 1000 / 60) as unknown) as number;
const cancelAnimationFrame = (id: number) => clearTimeout(id);

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const ROBOT_RADIUS = 15;

export class GameLoop {
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private robots: Robot[] = [];
  private projectiles: Projectile[] = [];
  private readonly ARENA = { width: ARENA_WIDTH, height: ARENA_HEIGHT };

  constructor() { }

  addRobot(robot: Robot): void {
    this.robots.push({ ...robot, health: 100 });
  }

  getRobots(): Robot[] {
    return this.robots;
  }

  getProjectiles(): Projectile[] {
    return this.projectiles;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    this.update(deltaTime);
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public update(deltaTime: number): void {
    // 1. Update Projectiles & Check Robot Hits
    this.projectiles = this.projectiles.filter(p => {
      p.position.x += p.velocity.x * deltaTime;
      p.position.y += p.velocity.y * deltaTime;

      let hasHit = false;

      // Check collision with each robot
      for (const robot of this.robots) {
        // Only hit if the robot is alive and not the owner of the bullet
        if (robot.id !== p.ownerId && robot.health > 0) {
          const dx = p.position.x - robot.position.x;
          const dy = p.position.y - robot.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < ROBOT_RADIUS) {
            robot.health = Math.max(0, robot.health - 10); // Damage: 10 HP per hit
            hasHit = true;
            break; // Stop checking other robots for this projectile
          }
        }
      }

      // Remove projectile if it hits something or goes out of bounds
      const isOutOfBounds =
        p.position.x < 0 || p.position.x > this.ARENA.width ||
        p.position.y < 0 || p.position.y > this.ARENA.height;

      return !hasHit && !isOutOfBounds;
    });

    // 2. Update Robots & Wall Collisions (Only for alive robots)
    this.robots.forEach(robot => {
      if (robot.health <= 0) return; // Dead robots don't move

      robot.position.x += robot.velocity.x * deltaTime;
      robot.position.y += robot.velocity.y * deltaTime;

      // Boundary Collisions
      if (robot.position.x < ROBOT_RADIUS) {
        robot.position.x = ROBOT_RADIUS;
        robot.velocity.x *= -1;
      } else if (robot.position.x > this.ARENA.width - ROBOT_RADIUS) {
        robot.position.x = this.ARENA.width - ROBOT_RADIUS;
        robot.velocity.x *= -1;
      }

      if (robot.position.y < ROBOT_RADIUS) {
        robot.position.y = ROBOT_RADIUS;
        robot.velocity.y *= -1;
      } else if (robot.position.y > this.ARENA.height - ROBOT_RADIUS) {
        robot.position.y = this.ARENA.height - ROBOT_RADIUS;
        robot.velocity.y *= -1;
      }
    });

    // 3. Robot vs Robot Collision (Elastic)
    for (let i = 0; i < this.robots.length; i++) {
      for (let j = i + 1; j < this.robots.length; j++) {
        const r1 = this.robots[i];
        const r2 = this.robots[j];

        // Skip if either is dead
        if (r1.health <= 0 || r2.health <= 0) continue;

        const dx = r2.position.x - r1.position.x;
        const dy = r2.position.y - r1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ROBOT_RADIUS * 2) {
          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);

          // Simple Elastic Bounce (Swap Velocities)
          const tempVx = r1.velocity.x;
          const tempVy = r1.velocity.y;
          r1.velocity.x = r2.velocity.x;
          r1.velocity.y = r2.velocity.y;
          r2.velocity.x = tempVx;
          r2.velocity.y = tempVy;

          // Resolve Overlap
          const overlap = ROBOT_RADIUS * 2 - distance + 1;
          r1.position.x -= overlap * cos * 0.5;
          r1.position.y -= overlap * sin * 0.5;
          r2.position.x += overlap * cos * 0.5;
          r2.position.y += overlap * sin * 0.5;
        }
      }
    }
  }

  spawnProjectile(ownerId: string, pos: Vector2, targetPos: Vector2): void {
    const angle = Math.atan2(targetPos.y - pos.y, targetPos.x - pos.x);
    const speed = 400;

    // Spawn the projectile slightly outside the robot's radius to prevent immediate self-collision
    const spawnDistance = ROBOT_RADIUS + 5;

    this.projectiles.push({
      id: Math.random().toString(36).substr(2, 9),
      ownerId,
      position: {
        x: pos.x + Math.cos(angle) * spawnDistance,
        y: pos.y + Math.sin(angle) * spawnDistance
      },
      velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      color: "#FFFFFF"
    });
  }
}

export type { Robot, Projectile };