import { Vector2, Robot, Obstacle } from '../types';
import { ARENA_WIDTH, ARENA_HEIGHT, ROBOT_RADIUS } from '../constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Step size in arena units per DDA iteration. Must be smaller than ROBOT_RADIUS
 *  (15px) so no enemy robot can be skipped between two consecutive steps. */
const RAY_STEP = 4;

/** Maximum number of DDA steps before giving up. Derived from the engine's
 *  maximum FOV range so we never march beyond sensor visibility. */
const MAX_STEPS = Math.ceil(300 / RAY_STEP); // 300 = DEFAULT_FOV.range

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fire an invisible physics ray from `origin` in the absolute direction
 * `directionRad` (radians) and return the distance to the first hit.
 *
 * Hit targets (in priority order):
 *  1. Arena boundary walls
 *  2. SOLID obstacles (AABB check)
 *  3. Any alive robot other than the caster (circle check)
 *
 * TRAP and LAVA obstacles are intentionally transparent — they are zones,
 * not physical barriers, and a bullet flies through them unimpeded.
 *
 * @param origin        Ray origin (robot position).
 * @param directionRad  Absolute direction in radians.
 * @param obstacles     All obstacles in the current game state.
 * @param robots        All robots in the current game state.
 * @param selfId        ID of the casting robot — excluded from hit checks.
 * @returns             Distance in arena units to the first solid hit,
 *                      or `maxRange` if nothing is hit within sensor range.
 */
export function performRaycast(
  origin: Vector2,
  directionRad: number,
  obstacles: Obstacle[],
  robots: Robot[],
  selfId: string,
  maxRange: number = 300,
): number {
  const steps = Math.ceil(maxRange / RAY_STEP);
  const capSteps = Math.min(steps, MAX_STEPS);

  const dx = Math.cos(directionRad);
  const dy = Math.sin(directionRad);

  // Pre-filter: only SOLID obstacles block rays.
  const solidObstacles = obstacles.filter(o => o.type === 'SOLID');

  // Pre-filter: only alive robots other than the caster are physical hits.
  const hitRobots = robots.filter(r => r.id !== selfId && r.isAlive);

  for (let step = 1; step <= capSteps; step++) {
    const dist = step * RAY_STEP;
    const px = origin.x + dx * dist;
    const py = origin.y + dy * dist;

    // ── 1. Arena wall bounds ─────────────────────────────────────────────────
    if (px < 0 || px > ARENA_WIDTH || py < 0 || py > ARENA_HEIGHT) {
      return dist;
    }

    // ── 2. SOLID obstacle AABB check ─────────────────────────────────────────
    // Obstacles use axis-aligned bounding boxes (rotation is visual only).
    for (const obs of solidObstacles) {
      const halfW = obs.width / 2;
      const halfH = obs.height / 2;
      if (
        px >= obs.position.x - halfW &&
        px <= obs.position.x + halfW &&
        py >= obs.position.y - halfH &&
        py <= obs.position.y + halfH
      ) {
        return dist;
      }
    }

    // ── 3. Robot circle check ────────────────────────────────────────────────
    for (const robot of hitRobots) {
      const rdx = px - robot.position.x;
      const rdy = py - robot.position.y;
      // Compare squared distances to avoid sqrt per step
      if (rdx * rdx + rdy * rdy <= ROBOT_RADIUS * ROBOT_RADIUS) {
        return dist;
      }
    }
  }

  return maxRange;
}
