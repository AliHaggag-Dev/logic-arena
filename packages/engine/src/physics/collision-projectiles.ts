import { Projectile, Robot, Obstacle, Vector2 } from "../types";

const ROBOT_RADIUS = 15;
const PROJECTILE_DAMAGE = 10;

/**
 * Advances all projectiles one frame and resolves hits.
 *
 * Hit priority (first match destroys projectile):
 *  1. Enemy robot within ROBOT_RADIUS — deals 10 HP damage.
 *  2. SOLID obstacle — projectile is absorbed by the wall.
 *  3. Arena boundary — projectile is culled.
 *
 * TRAP and LAVA obstacles are ignored: projectiles phase through them.
 */
export function updateProjectiles(
  projectiles: Projectile[],
  robots: Robot[],
  arenaWidth: number,
  arenaHeight: number,
  obstacles: Obstacle[] = [],
  deltaTime: number = 1 / 60,
): Projectile[] {
  const solidObstacles = obstacles.filter(o => o.type === 'SOLID');

  return projectiles.filter(p => {
    // Step distance this tick using the ACTUAL elapsed deltaTime, not a
    // hardcoded 1/60. When the physics loop runs at 100ms ticks the bullet
    // was previously jumping 6× too far, tunnelling through robots.
    const stepX = p.velocity.x * deltaTime;
    const stepY = p.velocity.y * deltaTime;
    const stepDist = Math.hypot(stepX, stepY);

    // --- Swept-segment hit detection ---
    // Sub-step along the path so a fast bullet can never jump over a robot
    // in a single tick, no matter how large deltaTime is.
    const SUB_STEPS = Math.max(1, Math.ceil(stepDist / (ROBOT_RADIUS * 0.5)));
    const subStepX = stepX / SUB_STEPS;
    const subStepY = stepY / SUB_STEPS;

    for (let s = 0; s < SUB_STEPS; s++) {
      p.position.x += subStepX;
      p.position.y += subStepY;

      // 1. Robot hit check (every sub-step)
      for (const robot of robots) {
        if (robot.id !== p.ownerId && robot.isAlive) {
          const dx = p.position.x - robot.position.x;
          const dy = p.position.y - robot.position.y;
          if (dx * dx + dy * dy < ROBOT_RADIUS * ROBOT_RADIUS) {
            if (robot.isShielded) {
              robot.shieldHitTimestamp = Date.now();
              return false;
            }

            robot.health = Math.max(0, robot.health - PROJECTILE_DAMAGE);
            if (robot.health === 0) robot.isAlive = false;
            return false; // destroy projectile immediately on first hit
          }
        }
      }

      // 2. SOLID obstacle hit check (every sub-step)
      for (const obs of solidObstacles) {
        const halfW = obs.width / 2;
        const halfH = obs.height / 2;
        if (
          p.position.x >= obs.position.x - halfW &&
          p.position.x <= obs.position.x + halfW &&
          p.position.y >= obs.position.y - halfH &&
          p.position.y <= obs.position.y + halfH
        ) {
          return false; // wall absorbed the projectile
        }
      }
    }

    // 3. Arena boundary cull (after full step)
    const isOutOfBounds =
      p.position.x < 0 || p.position.x > arenaWidth ||
      p.position.y < 0 || p.position.y > arenaHeight;

    return !isOutOfBounds;
  });
}

export function spawnProjectile(
  ownerId: string,
  team: 'A' | 'B',
  pos: Vector2,
  targetPos: Vector2,
  color?: string
): Projectile {
  const angle = Math.atan2(targetPos.y - pos.y, targetPos.x - pos.x);
  const speed = 400;
  const spawnDistance = ROBOT_RADIUS + 5;

  return {
    id: Math.random().toString(36).substr(2, 9),
    ownerId,
    team,
    position: {
      x: pos.x + Math.cos(angle) * spawnDistance,
      y: pos.y + Math.sin(angle) * spawnDistance,
    },
    velocity: {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    },
    color,
  };
}
