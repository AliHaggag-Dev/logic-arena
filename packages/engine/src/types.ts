export interface Vector2 {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// FOV (Field of View) configuration
// ---------------------------------------------------------------------------
export interface FovConfig {
  /** Full cone angle in degrees (e.g. 120 means ±60° from facing dir). */
  angle: number;
  /** Maximum detection range in arena units (e.g. 300px). */
  range: number;
}

// ---------------------------------------------------------------------------
// Entities visible to a robot within its FOV cone (computed per tick).
// This is intentionally a lightweight snapshot — IDs + positions only.
// ---------------------------------------------------------------------------
export interface VisibleEntities {
  robots: Robot[];
  projectiles: Projectile[];
  obstacles: Obstacle[];
}

// ---------------------------------------------------------------------------
// Robot
// ---------------------------------------------------------------------------
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
  memory: Record<string, unknown>;

  /** Color hex string used for rendering (e.g. '#00ffff'). */
  color?: string;

  /** Color hex string for the robot's projectiles (e.g. '#ff0000'). */
  tracerColor?: string;

  /** The 3D model file ID for rendering (e.g. 'unit-01' or 'unit-02'). */
  model?: string;

  /** Timestamp tracking the exact tick elapsed when a robot slams into a SOLID structure. */
  hitWallTimestamp?: number;

  /** Number of physics ticks remaining where normal steering is disabled due to a wall impact. */
  collisionCooldown?: number;

  /** Flag raised by the AliScript Evaluator when a user explicitly uses `SET rotation = X`. */
  isManualRotation?: boolean;

  /**
   * Last known forward-facing direction (in radians), updated every tick when not in STASIS.
   * Used by BACKUP to always reverse the original facing direction, not the physics-computed one.
   */
  facingDirection?: number;

  /** True while BACKUP is the active movement command. */
  isBackingUp?: boolean;

  /**
   * If set to true by AliScript (`SET lockVision = TRUE`),
   * the fovDirection will automatically match robot.rotation every physics tick,
   * effectively locking the scanner to where the robot is physically facing.
   */
  lockVision?: boolean;

  // --- Zone flags (per-tick transient, reset at start of each tick) ---
  /**
   * Set to true by collision-obstacles when the robot is inside a LAVA zone.
   * Consumed by the game loop for continuous HP deduction (5 HP/sec).
   */
  insideLava?: boolean;
  /**
   * Speed modifier set by the collision system.
   * 1.0 = full speed, 0.4 = 60% velocity reduction (TRAP zone).
   * Reset to 1.0 at the start of each robot's update.
   */
  speedMultiplier?: number;

  // --- Energy / Battery (Feature 2) ---
  /**
   * Current energy level. Depletes on every AliScript command.
   * Regenerates passively (+3/tick). Default: 100.
   */
  energy?: number;
  /** Maximum energy capacity. Default: 100. */
  maxEnergy?: number;
  /**
   * True when energy <= 0. Robot cannot move or fire in stasis.
   * Cleared automatically when energy regenerates to >= 20.
   */
  inStasis?: boolean;
  /**
   * Accumulates total energy ever consumed for this robot (for efficiency score).
   * Never reset during the match.
   */
  totalEnergyConsumed?: number;
  /**
   * Accumulates total damage dealt by this robot (for efficiency score).
   * Never reset during the match.
   */
  totalDamageDealt?: number;
  /** Tracks if an active command was executed this tick, disabling regen. */
  executedCommandThisTick?: boolean;
  /** Internal NPC flag: commands execute without energy deduction or STASIS. */
  ignoreEnergyCost?: boolean;

  // --- Field of View (Feature 1) ---
  /**
   * FOV cone configuration. Defaults to { angle: 120, range: 300 }.
   * angle is the full cone width in degrees.
   */
  fov?: FovConfig;
  /**
   * The direction (in radians) the FOV cone currently faces.
   * Defaults to robot.rotation when not explicitly set.
   * Updated by the SCAN command (+15°/call).
   */
  fovDirection?: number;
  /**
   * Entities visible within the robot's FOV cone, computed per game tick.
   * ONLY populated on the server — never sent to client in full.
   * Used by the AliScript evaluator to enforce FOV blindness.
   */
  visibleEntities?: VisibleEntities;
}

// ---------------------------------------------------------------------------
// Projectile
// ---------------------------------------------------------------------------
export interface Projectile {
  id: string;
  ownerId: string;
  position: Vector2;
  velocity: Vector2;
  team: 'A' | 'B';
  color?: string;
}

// ---------------------------------------------------------------------------
// Obstacles — The 3 Pillars
// ---------------------------------------------------------------------------
/**
 *  SOLID — Impassable wall. Infinite friction. Destroys projectiles.
 *  TRAP  — Slowdown zone. Reduces robot velocity by 60% while inside.
 *  LAVA  — Damage zone. Deducts 5 HP/sec while robot is inside.
 */
export type ObstacleType = 'SOLID' | 'TRAP' | 'LAVA' | 'FINISH_LINE';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  position: Vector2;   // center position in arena units
  width: number;    // collision width
  height: number;    // collision height
  rotation: number;    // rotation in radians for visual variety
  health?: number;    // optional — destructible obstacles
}

// ---------------------------------------------------------------------------
// Game State
// ---------------------------------------------------------------------------
export interface GameState {
  robots: Robot[];
  projectiles: Projectile[];
  obstacles: Obstacle[];
}

// ---------------------------------------------------------------------------
// Game Config
// ---------------------------------------------------------------------------
export type GameMode = 'COMBAT' | 'RACING' | 'TRAINING_SOLO';

export interface GameConfig {
  mode?: GameMode;
  disableProjectiles?: boolean;
  obstacles?: Obstacle[];
}
