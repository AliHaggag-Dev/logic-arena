import { Robot, Projectile, Obstacle, VisibleEntities, Vector2 } from './types';
import { SpatialGrid } from './physics/spatial-grid';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TWO_PI = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;

// ---------------------------------------------------------------------------
// FovCalculator
// Pure TypeScript — no NestJS or browser dependencies.
// ---------------------------------------------------------------------------

/**
 * Computes which entities (robots, projectiles, obstacles) fall within a
 * robot's Field of View cone using:
 *  1. SpatialGrid pre-filter for O(1) candidate narrowing (range check).
 *  2. Vector dot-product angle check for the cone test.
 *
 * Performance target: < 0.5ms per tick at 10 robots.
 */
export class FovCalculator {
  constructor(private readonly spatialGrid: SpatialGrid<Robot>) {}

  /**
   * Compute the set of entities visible to `robot` given its current
   * fov config and fovDirection.
   *
   * @param robot          The robot whose FOV we are computing.
   * @param allRobots      All robots currently in the game.
   * @param allProjectiles All active projectiles.
   * @param allObstacles   All obstacles (static — checked once).
   * @returns              VisibleEntities snapshot for this tick.
   */
  compute(
    robot: Robot,
    allRobots: Robot[],
    allProjectiles: Projectile[],
    allObstacles: Obstacle[],
  ): VisibleEntities {
    const fov = robot.fov ?? { angle: 120, range: 300 };
    const halfAngleRad = (fov.angle / 2) * DEG_TO_RAD;
    const cosHalf = Math.cos(halfAngleRad);
    const rangeSquared = fov.range * fov.range;

    // The direction the FOV cone faces (default: robot's facing direction)
    const fovDir = robot.fovDirection ?? robot.rotation;
    const fx = Math.cos(fovDir);
    const fy = Math.sin(fovDir);

    // ----- Robots -------------------------------------------------------
    // Use SpatialGrid for cheap candidate narrowing (nearby robots only)
    const candidateRobots = this.spatialGrid.query(
      robot.position.x,
      robot.position.y,
    );

    const visibleRobots: Robot[] = [];
    for (const candidate of candidateRobots) {
      if (candidate.id === robot.id) continue;
      if (!candidate.isAlive) continue;
      if (!isInCone(robot.position, candidate.position, fx, fy, cosHalf, rangeSquared)) {
        continue;
      }
      visibleRobots.push(candidate);
    }

    // ----- Projectiles --------------------------------------------------
    const visibleProjectiles: Projectile[] = [];
    for (const proj of allProjectiles) {
      if (!isInCone(robot.position, proj.position, fx, fy, cosHalf, rangeSquared)) {
        continue;
      }
      visibleProjectiles.push(proj);
    }

    // ----- Obstacles ----------------------------------------------------
    // Obstacles are large; check their center point for simplicity.
    const visibleObstacles: Obstacle[] = [];
    for (const obs of allObstacles) {
      if (!isInCone(robot.position, obs.position, fx, fy, cosHalf, rangeSquared)) {
        continue;
      }
      visibleObstacles.push(obs);
    }

    return {
      robots:      visibleRobots,
      projectiles: visibleProjectiles,
      obstacles:   visibleObstacles,
    };
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if `target` falls within the FOV cone defined by:
 * - `origin`      — robot position
 * - `fx, fy`      — normalised facing direction
 * - `cosHalf`     — cosine of the half-angle (dot-product threshold)
 * - `rangeSquared`— squared max range (avoids sqrt)
 */
function isInCone(
  origin: Vector2,
  target: Vector2,
  fx: number,
  fy: number,
  cosHalf: number,
  rangeSquared: number,
): boolean {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;

  const distSq = dx * dx + dy * dy;
  if (distSq === 0) return true;   // same position → always visible
  if (distSq > rangeSquared) return false; // outside range

  const dist = Math.sqrt(distSq);
  // Normalised dot product: dot(fovDir, toTarget)
  const dot = (fx * dx + fy * dy) / dist;
  return dot >= cosHalf;
}
