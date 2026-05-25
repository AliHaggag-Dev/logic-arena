import { Robot, GameState, Obstacle, Vector2, Projectile, GameConfig, GameMode, ModeData, MapTheme } from '../types';
import { spawnProjectile, updateProjectiles } from '../physics/collision-projectiles';
import { checkRobotRobotCollision } from '../physics/collision-robots';
import { SpatialGrid } from '../physics/spatial-grid';
import { FovCalculator } from '../fov-calculator';
import { EnergyManager } from '../energy-manager';
import { performance } from 'node:perf_hooks';
import { cancelAnimationFrame, requestAnimationFrame } from '../utils/animation-loop';
import { ARENA_WIDTH, ARENA_HEIGHT, DEFAULT_FOV, DEFAULT_OBSTACLES, RACING_OBSTACLES } from '../constants';
import { updateRobotPhysics } from './robot-updater';

export class GameLoop {
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private robots: Robot[] = [];
  private projectiles: Projectile[] = [];
  private obstacles: Obstacle[] = [];
  private readonly ARENA = { width: ARENA_WIDTH, height: ARENA_HEIGHT };
  private config?: GameConfig;
  private modeData?: ModeData;
  private readonly mapTheme: MapTheme;

  /**
   * Spatial grid for O(1) robot neighbour lookup.
   * Cell size 100 → 8×6 grid for the 800×600 arena.
   */
  private readonly spatialGrid = new SpatialGrid<Robot>(
    ARENA_WIDTH,
    ARENA_HEIGHT,
    100,
  );

  /** FOV calculator — reuses the same spatial grid. */
  private readonly fovCalculator: FovCalculator;

  /** Energy manager — handles regen, deduction, stasis. */
  readonly energyManager = new EnergyManager();

  constructor(config?: GameConfig) {
    this.config = config;
    this.mapTheme = config?.mapTheme ?? 'CYBER';
    this.fovCalculator = new FovCalculator(this.spatialGrid);

    if (this.config?.obstacles) {
      this.obstacles = this.config.obstacles.map((obstacle) => ({
        ...obstacle,
        position: { ...obstacle.position },
      }));
    } else if (this.config?.mode === 'RACING') {
      this.obstacles = RACING_OBSTACLES.map((obstacle) => ({
        ...obstacle,
        position: { ...obstacle.position },
      }));
    } else if (this.config?.mode === 'TRAINING_SOLO' || this.config?.mode === ('SANDBOX' as GameMode)) {
      this.obstacles = [];
    } else {
      this.obstacles = DEFAULT_OBSTACLES.map((obstacle) => ({
        ...obstacle,
        position: { ...obstacle.position },
      }));
    }
  }

  // -------------------------------------------------------------------------
  // Robot management
  // -------------------------------------------------------------------------

  addRobot(robot: Robot): void {
    // Ensure energy/FOV fields are initialised with safe defaults
    this.energyManager.initRobot(robot);
    if (!robot.fov) robot.fov = { ...DEFAULT_FOV };
    if (robot.fovDirection === undefined) robot.fovDirection = robot.rotation;
    if (!robot.visibleEntities) {
      robot.visibleEntities = { robots: [], projectiles: [], obstacles: [] };
    }
    this.robots.push(robot);
  }

  getRobots(): Robot[] { return this.robots; }

  getProjectiles(): Projectile[] { return this.projectiles; }

  getObstacles(): Obstacle[] { return this.obstacles; }

  getSpatialGrid(): SpatialGrid<Robot> { return this.spatialGrid; }

  getGameState(): GameState {
    return {
      robots: this.robots,
      projectiles: this.projectiles,
      obstacles: this.obstacles,
      mapTheme: this.mapTheme,
      modeData: this.modeData,
    };
  }

  getModeData(): ModeData | undefined {
    return this.modeData;
  }

  setModeData(data: ModeData | undefined): void {
    this.modeData = data;
  }

  // -------------------------------------------------------------------------
  // Loop control
  // -------------------------------------------------------------------------

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);
  }

  stop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    this.update(deltaTime);
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // -------------------------------------------------------------------------
  // Core tick
  // -------------------------------------------------------------------------

  public update(deltaTime: number): void {
    // 1. Update Projectiles — pass obstacles for SOLID wall destruction
    if (!this.config?.disableProjectiles) {
      this.projectiles = updateProjectiles(
        this.projectiles,
        this.robots,
        this.ARENA.width,
        this.ARENA.height,
        this.obstacles,
        deltaTime,
      );
    }

    // 2. Update Robots
    this.robots.forEach(robot => {
      updateRobotPhysics(
        robot,
        this.obstacles,
        this.ARENA.width,
        this.ARENA.height,
        this.energyManager,
        deltaTime
      );
    });
    this.obstacles = this.obstacles.filter((obstacle) => !obstacle.triggered);

    // 3. Robot-vs-Robot Collision — Spatial Grid accelerated
    this.spatialGrid.clear();
    for (const robot of this.robots) {
      if (robot.isAlive) this.spatialGrid.insert(robot);
    }

    const checked = new Set<string>();
    for (const robot of this.robots) {
      if (!robot.isAlive) continue;
      const neighbors = this.spatialGrid.query(robot.position.x, robot.position.y);
      for (const neighbor of neighbors) {
        if (neighbor.id === robot.id) continue;
        const pairKey = robot.id < neighbor.id
          ? `${robot.id}|${neighbor.id}`
          : `${neighbor.id}|${robot.id}`;
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);
        checkRobotRobotCollision(robot, neighbor);
      }
    }

    // 4. FOV Computation — runs AFTER spatial grid is populated for this tick
    const allFlags = this.modeData?.type === 'CTF' ? this.modeData.flags : [];
    for (const robot of this.robots) {
      if (!robot.isAlive) {
        robot.visibleEntities = { robots: [], projectiles: [], obstacles: [], flags: [] };
        continue;
      }
      robot.visibleEntities = this.fovCalculator.compute(
        robot,
        this.robots,
        this.projectiles,
        this.obstacles,
        allFlags
      );
    }
  }

  // -------------------------------------------------------------------------
  // Spawning / removal
  // -------------------------------------------------------------------------

  spawnProjectile(ownerId: string, pos: Vector2, targetPos: Vector2, color?: string): void {
    const robot = this.robots.find(r => r.id === ownerId);
    if (!robot) return;
    this.projectiles.push(spawnProjectile(ownerId, robot.team, pos, targetPos, color || robot.tracerColor));
  }

  removeRobot(id: string): void {
    this.robots = this.robots.filter(r => r.id !== id);
  }
}
