import { Robot, GameState, Obstacle, Vector2, Projectile } from './types';
import { updateProjectiles, spawnProjectile } from './physics/collision-projectiles';
import { checkRobotRobotCollision } from './physics/collision-robots';
import { checkObstacleCollision } from './physics/collision-obstacles';
import { checkWallBounds } from './physics/wall-bounds';
import { performance } from 'node:perf_hooks';

const requestAnimationFrame = (callback: FrameRequestCallback) =>
  (setTimeout(() => callback(performance.now()), 1000 / 60) as unknown) as number;
const cancelAnimationFrame = (id: number) => clearTimeout(id);

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const ROBOT_RADIUS = 15;

const DEFAULT_OBSTACLES: Obstacle[] = [
  // Center cross walls
  { id: 'wall-1', type: 'WALL', position: { x: 400, y: 200 }, width: 80, height: 25, rotation: 0 },
  { id: 'wall-2', type: 'WALL', position: { x: 400, y: 400 }, width: 80, height: 25, rotation: 0 },
  { id: 'wall-3', type: 'WALL', position: { x: 250, y: 300 }, width: 25, height: 80, rotation: 0 },
  { id: 'wall-4', type: 'WALL', position: { x: 550, y: 300 }, width: 25, height: 80, rotation: 0 },

  // Traps near center
  { id: 'trap-1', type: 'TRAP', position: { x: 200, y: 150 }, width: 40, height: 40, rotation: 0.3 },
  { id: 'trap-2', type: 'TRAP', position: { x: 600, y: 450 }, width: 40, height: 40, rotation: -0.3 },

  // Slow zones at corridors
  { id: 'slow-1', type: 'SLOW', position: { x: 150, y: 400 }, width: 60, height: 35, rotation: 0.15 },
  { id: 'slow-2', type: 'SLOW', position: { x: 650, y: 200 }, width: 60, height: 35, rotation: -0.15 },

  // Bouncers in corners
  { id: 'bounce-1', type: 'BOUNCER', position: { x: 120, y: 120 }, width: 35, height: 35, rotation: 0.785 },
  { id: 'bounce-2', type: 'BOUNCER', position: { x: 680, y: 480 }, width: 35, height: 35, rotation: 0.785 },
];

export class GameLoop {
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private robots: Robot[] = [];
  private projectiles: Projectile[] = [];
  private obstacles: Obstacle[] = [];
  private readonly ARENA = { width: ARENA_WIDTH, height: ARENA_HEIGHT };

  constructor() {
    this.obstacles = DEFAULT_OBSTACLES;
  }

  addRobot(robot: Robot): void {
    this.robots.push(robot);
  }

  getRobots(): Robot[] {
    return this.robots;
  }

  getProjectiles(): Projectile[] {
    return this.projectiles;
  }

  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  getGameState(): GameState {
    return {
      robots: this.robots,
      projectiles: this.projectiles,
      obstacles: this.obstacles,
    };
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
    const now = Date.now();

    // 1. Update Projectiles & Check Robot Hits
    this.projectiles = updateProjectiles(this.projectiles, this.robots, this.ARENA.width, this.ARENA.height);

    // 2. Update Robots
    this.robots.forEach(robot => {
      if (!robot.isAlive) {
        robot.velocity = { x: 0, y: 0 };
        return;
      }

      // Handle status effects
      if (robot.trappedUntil && now < robot.trappedUntil) {
        robot.velocity = { x: 0, y: 0 };
        return; // Skip movement
      } else if (robot.trappedUntil) {
        robot.trappedUntil = undefined;
      }

      let speedMultiplier = 1.0;
      if (robot.slowedUntil && now < robot.slowedUntil) {
        speedMultiplier = robot.speedMultiplier ?? 0.4;
      } else if (robot.slowedUntil) {
        robot.slowedUntil = undefined;
        robot.speedMultiplier = undefined;
      }

      // Update position
      robot.position.x += robot.velocity.x * speedMultiplier * deltaTime;
      robot.position.y += robot.velocity.y * speedMultiplier * deltaTime;

      // Boundary Collisions
      checkWallBounds(robot, this.ARENA.width, this.ARENA.height);

      // Obstacle Collisions
      for (const obstacle of this.obstacles) {
        checkObstacleCollision(robot, obstacle);
      }

      const speed = Math.hypot(robot.velocity.x, robot.velocity.y);
      if (speed > 0.001) {
        robot.rotation = Math.atan2(robot.velocity.y, robot.velocity.x);
      }
    });

    // 3. Robot vs Robot Collision
    for (let i = 0; i < this.robots.length; i++) {
      for (let j = i + 1; j < this.robots.length; j++) {
        checkRobotRobotCollision(this.robots[i], this.robots[j]);
      }
    }
  }

  spawnProjectile(ownerId: string, pos: Vector2, targetPos: Vector2): void {
    const robot = this.robots.find(r => r.id === ownerId);
    if (!robot) return;
    this.projectiles.push(spawnProjectile(ownerId, robot.team, pos, targetPos));
  }
}

export type { Robot, Projectile, Obstacle, GameState, Vector2 };