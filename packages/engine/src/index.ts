import { Robot, GameState, Obstacle, Vector2, Projectile, GameConfig, GameMode } from './types';
import { updateProjectiles, spawnProjectile } from './physics/collision-projectiles';
import { checkRobotRobotCollision } from './physics/collision-robots';
import { checkObstacleCollision } from './physics/collision-obstacles';
import { checkWallBounds } from './physics/wall-bounds';
import { SpatialGrid } from './physics/spatial-grid';
import { performance } from 'node:perf_hooks';

const requestAnimationFrame = (callback: FrameRequestCallback) =>
  (setTimeout(() => callback(performance.now()), 1000 / 60) as unknown) as number;
const cancelAnimationFrame = (id: number) => clearTimeout(id);

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const ROBOT_RADIUS = 15;

/**
 * Default obstacle layout — The 3 Pillars:
 *  SOLID : Impassable walls (center cross formation)
 *  TRAP  : Slowdown zones — 60% velocity reduction while inside
 *  LAVA  : Damage zones — 5 HP/sec while inside
 */
const DEFAULT_OBSTACLES: Obstacle[] = [
  // Center cross — SOLID walls
  { id: 'solid-1', type: 'SOLID', position: { x: 400, y: 200 }, width: 80, height: 25, rotation: 0 },
  { id: 'solid-2', type: 'SOLID', position: { x: 400, y: 400 }, width: 80, height: 25, rotation: 0 },
  { id: 'solid-3', type: 'SOLID', position: { x: 250, y: 300 }, width: 25, height: 80, rotation: 0 },
  { id: 'solid-4', type: 'SOLID', position: { x: 550, y: 300 }, width: 25, height: 80, rotation: 0 },

  // LAVA zones — continuous 5 HP/sec damage
  { id: 'lava-1', type: 'LAVA', position: { x: 200, y: 150 }, width: 60, height: 60, rotation: 0.3 },
  { id: 'lava-2', type: 'LAVA', position: { x: 600, y: 450 }, width: 60, height: 60, rotation: -0.3 },

  // TRAP zones — 60% velocity reduction while inside
  { id: 'trap-1', type: 'TRAP', position: { x: 150, y: 400 }, width: 60, height: 35, rotation: 0.15 },
  { id: 'trap-2', type: 'TRAP', position: { x: 650, y: 200 }, width: 60, height: 35, rotation: -0.15 },
];

const RACING_OBSTACLES: Obstacle[] = [
  // Outer walls
  { id: 'race-wall-1', type: 'SOLID', position: { x: 400, y: 50 }, width: 700, height: 20, rotation: 0 },
  { id: 'race-wall-2', type: 'SOLID', position: { x: 400, y: 550 }, width: 700, height: 20, rotation: 0 },
  { id: 'race-wall-3', type: 'SOLID', position: { x: 50, y: 300 }, width: 20, height: 500, rotation: 0 },
  { id: 'race-wall-4', type: 'SOLID', position: { x: 750, y: 300 }, width: 20, height: 500, rotation: 0 },
  // Inner track walls to form an oval-ish track
  { id: 'race-inner-1', type: 'SOLID', position: { x: 400, y: 200 }, width: 400, height: 20, rotation: 0 },
  { id: 'race-inner-2', type: 'SOLID', position: { x: 400, y: 400 }, width: 400, height: 20, rotation: 0 },
  { id: 'race-inner-3', type: 'SOLID', position: { x: 200, y: 300 }, width: 20, height: 200, rotation: 0 },
  { id: 'race-inner-4', type: 'SOLID', position: { x: 600, y: 300 }, width: 20, height: 200, rotation: 0 }
];


const LAVA_DPS = 5; // HP per second deducted while inside a LAVA zone

export class GameLoop {
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private robots: Robot[] = [];
  private projectiles: Projectile[] = [];
  private obstacles: Obstacle[] = [];
  private readonly ARENA = { width: ARENA_WIDTH, height: ARENA_HEIGHT };

  private config?: GameConfig;

  /**
   * Spatial grid for O(1) robot neighbor lookup.
   * Cell size 100 gives an 8×6 grid for the 800×600 arena.
   * The grid is scalable — pass a larger cellSize for bigger arenas.
   */
  private readonly spatialGrid = new SpatialGrid<Robot>(
    ARENA_WIDTH,
    ARENA_HEIGHT,
    100,
  );

  constructor(config?: GameConfig) {
    this.config = config;
    if (this.config?.mode === 'RACING') {
      this.obstacles = RACING_OBSTACLES;
    } else if (this.config?.mode === 'TRAINING_SOLO' || this.config?.mode === 'SANDBOX' as any) {
      this.obstacles = [];
    } else {
      this.obstacles = DEFAULT_OBSTACLES;
    }
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
    // 1. Update Projectiles — pass obstacles for SOLID wall destruction
    if (!this.config?.disableProjectiles) {
      this.projectiles = updateProjectiles(
        this.projectiles,
        this.robots,
        this.ARENA.width,
        this.ARENA.height,
        this.obstacles,
      );
    }

    // 2. Update Robots
    this.robots.forEach(robot => {
      if (!robot.isAlive) {
        robot.velocity = { x: 0, y: 0 };
        return;
      }

      // --- Reset per-tick transient flags ---
      // TRAP/LAVA collision handlers set these each tick inside obstacle loops.
      // Resetting here ensures they're only "on" while the robot is actively inside a zone.
      robot.insideLava = false;
      robot.speedMultiplier = 1.0;

      // Boundary + Obstacle Collisions
      // (These may set insideLava/speedMultiplier back to active values)
      checkWallBounds(robot, this.ARENA.width, this.ARENA.height);
      for (const obstacle of this.obstacles) {
        checkObstacleCollision(robot, obstacle);
      }

      // LAVA damage — 5 HP per second, accumulated via deltaTime
      if (robot.insideLava) {
        robot.health = Math.max(0, robot.health - LAVA_DPS * deltaTime);
        if (robot.health === 0) robot.isAlive = false;
      }

      // Apply velocity with TRAP slow multiplier
      const speed = robot.speedMultiplier ?? 1.0;
      robot.position.x += robot.velocity.x * speed * deltaTime;
      robot.position.y += robot.velocity.y * speed * deltaTime;

      // Update facing rotation from velocity direction
      const vMag = Math.hypot(robot.velocity.x, robot.velocity.y);
      if (vMag > 0.001) {
        robot.rotation = Math.atan2(robot.velocity.y, robot.velocity.x);
      }
    });

    // 3. Robot-vs-Robot Collision — Spatial Grid accelerated
    // Rebuild the grid each tick with alive robots only
    this.spatialGrid.clear();
    for (const robot of this.robots) {
      if (robot.isAlive) this.spatialGrid.insert(robot);
    }

    // For each robot, only check against nearby robots from the spatial grid
    const checked = new Set<string>();
    for (const robot of this.robots) {
      if (!robot.isAlive) continue;
      const neighbors = this.spatialGrid.query(robot.position.x, robot.position.y);
      for (const neighbor of neighbors) {
        if (neighbor.id === robot.id) continue;
        // Build a canonical pair key to avoid checking the same pair twice
        const pairKey = robot.id < neighbor.id
          ? `${robot.id}|${neighbor.id}`
          : `${neighbor.id}|${robot.id}`;
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);
        checkRobotRobotCollision(robot, neighbor);
      }
    }
  }

  spawnProjectile(ownerId: string, pos: Vector2, targetPos: Vector2): void {
    const robot = this.robots.find(r => r.id === ownerId);
    if (!robot) return;
    this.projectiles.push(spawnProjectile(ownerId, robot.team, pos, targetPos));
  }

  removeRobot(id: string): void {
    this.robots = this.robots.filter(r => r.id !== id);
  }
}

export type { Robot, Projectile, Obstacle, GameState, Vector2, GameConfig, GameMode };
