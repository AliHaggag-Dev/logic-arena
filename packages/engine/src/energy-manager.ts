import { Robot } from './types';

// ---------------------------------------------------------------------------
// Energy costs per AliScript command (energy units per invocation/tick)
// ---------------------------------------------------------------------------
export const ENERGY_COSTS: Readonly<Record<string, number>> = {
  MOVE:        1,
  MOVE_FAST:   2,   // was 3
  BACKUP:      1,
  ROTATE:      0.5,
  FIRE:        8,   // was 15
  BURST_FIRE:  15,  // was 20  (×3 shots = 45 total; higher than FIRE's 8 is intentional)
  SCAN:        1,   // was 5
  PATHFIND:    2,
  // Free — cognitive only:
  STOP:        0,
  SET:         0,
  IF:          0,
  WHILE:       0,
  WAIT:        0,
};

// ---------------------------------------------------------------------------
// Thresholds and defaults
// ---------------------------------------------------------------------------

/** Passive energy regeneration per game tick. */
export const ENERGY_REGEN_PER_TICK = 3; // was 2 — rebalanced alongside cost reductions

/** Energy level at which a robot enters STASIS (cannot move/fire). */
export const STASIS_ENTRY_THRESHOLD = 0;

/** Energy level required to exit STASIS. */
export const STASIS_EXIT_THRESHOLD = 50;

/** Default starting / max energy for a robot. */
export const DEFAULT_MAX_ENERGY = 1000;

/**
 * Commands that are blocked during STASIS.
 * SET / IF / WHILE / WAIT / SCAN remain allowed so stateful scripts
 * continue running and can react to the IN_STASIS identifier.
 */
export const STASIS_BLOCKED_COMMANDS = new Set([
  'MOVE',
  'MOVE_FAST',
  'BACKUP',
  'FIRE',
  'BURST_FIRE',
  'PATHFIND',
]);

// ---------------------------------------------------------------------------
// EnergyManager
// Pure TypeScript — no NestJS or browser dependencies.
// ---------------------------------------------------------------------------

export class EnergyManager {
  /**
   * Initialise energy fields on a robot that may not have them set yet.
   * Safe to call multiple times — ignores already-initialised robots.
   */
  initRobot(robot: Robot): void {
    if (robot.energy === undefined)              robot.energy = DEFAULT_MAX_ENERGY;
    if (robot.maxEnergy === undefined)           robot.maxEnergy = DEFAULT_MAX_ENERGY;
    if (robot.inStasis === undefined)            robot.inStasis = false;
    if (robot.totalEnergyConsumed === undefined) robot.totalEnergyConsumed = 0;
    if (robot.totalDamageDealt === undefined)    robot.totalDamageDealt = 0;
  }

  /**
   * Apply passive energy regeneration for one tick.
   * Clears STASIS when energy reaches the exit threshold.
   */
  regen(robot: Robot): void {
    if (!robot.isAlive) return;

    const max = robot.maxEnergy ?? DEFAULT_MAX_ENERGY;
    robot.energy = Math.min(max, (robot.energy ?? 0) + ENERGY_REGEN_PER_TICK);

    // Exit stasis once energy has recovered sufficiently
    if (robot.inStasis && (robot.energy ?? 0) >= STASIS_EXIT_THRESHOLD) {
      robot.inStasis = false;
    }
  }

  /**
   * Deduct the energy cost for the given AliScript command.
   * Returns true if the command is allowed to execute, false if blocked by STASIS.
   *
   * @param robot          The robot executing the command.
   * @param command        UPPER-CASE command name (e.g. 'FIRE', 'MOVE').
   * @returns              Whether the command may proceed.
   */
  deduct(robot: Robot, command: string): boolean {
    const cmd = command.toUpperCase();

    // Block locomotion/combat during stasis
    if (robot.inStasis && STASIS_BLOCKED_COMMANDS.has(cmd)) {
      return false;
    }

    const cost = ENERGY_COSTS[cmd] ?? 0;
    if (cost > 0) {
      robot.energy = Math.max(STASIS_ENTRY_THRESHOLD, (robot.energy ?? 0) - cost);
      robot.totalEnergyConsumed = (robot.totalEnergyConsumed ?? 0) + cost;

      // Enter stasis when energy hits zero
      if ((robot.energy ?? 0) <= STASIS_ENTRY_THRESHOLD) {
        robot.inStasis = true;
      }
    }

    return true;
  }

  /**
   * Record damage dealt by a robot (called by CombatExecutor on a successful hit).
   */
  recordDamage(robot: Robot, damage: number): void {
    robot.totalDamageDealt = (robot.totalDamageDealt ?? 0) + damage;
  }

  /**
   * Compute the Efficiency Score for end-of-match display.
   * Formula: (damage_dealt / total_energy_consumed) * 100
   * Returns 0 if no energy was consumed.
   */
  getEfficiencyScore(robot: Robot): number {
    const consumed = robot.totalEnergyConsumed ?? 0;
    const dealt    = robot.totalDamageDealt ?? 0;
    if (consumed === 0) return 0;
    return Math.round((dealt / consumed) * 100 * 10) / 10; // 1 decimal place
  }
}
