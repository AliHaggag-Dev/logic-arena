export interface Vector2 {
  x: number;
  y: number;
}

export interface Robot {
  id: string;
  team: 'A' | 'B';
  position: Vector2;
  rotation: number;
  velocity: Vector2;
  health: number;
  lastActionTime: number;
  isAlive: boolean;
  code: string;
  memory: Record<string, any>;
  /**
   * Per-tick flag: set to true by collision-obstacles when the robot
   * center is inside a LAVA zone. Consumed by the game loop for
   * continuous HP deduction (5 HP/sec). Reset at the start of each tick.
   */
  insideLava?: boolean;
  /**
   * Per-tick speed modifier set by the collision system.
   * 1.0 = full speed, 0.4 = 60% velocity reduction (TRAP zone).
   * Reset to 1.0 at the start of each robot's update.
   */
  speedMultiplier?: number;
  color?: string;
}

export interface Projectile {
  id: string;
  ownerId: string;
  position: Vector2;
  velocity: Vector2;
  team: 'A' | 'B';
}

/**
 * The 3 Obstacle Pillars:
 *  SOLID — Impassable wall. Infinite friction. Destroys projectiles.
 *  TRAP  — Slowdown zone. Reduces robot velocity by 60% while inside.
 *  LAVA  — Damage zone. Deducts 5 HP/sec while robot is inside.
 */
export type ObstacleType = 'SOLID' | 'TRAP' | 'LAVA';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  position: Vector2;      // center position in arena units
  width: number;          // collision width
  height: number;         // collision height
  rotation: number;       // rotation in radians for visual variety
  health?: number;        // optional — destructible obstacles
}

export interface GameState {
  robots: Robot[];
  projectiles: Projectile[];
  obstacles: Obstacle[];
}

export type GameMode = 'COMBAT' | 'RACING' | 'TRAINING_SOLO';

export interface GameConfig {
  mode: GameMode;
  disableProjectiles?: boolean;
}