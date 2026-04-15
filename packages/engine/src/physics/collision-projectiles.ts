import { Projectile, Robot, Obstacle, Vector2 } from "../types";

const ROBOT_RADIUS = 15;

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
): Projectile[] {
  const solidObstacles = obstacles.filter(o => o.type === 'SOLID');

  return projectiles.filter(p => {
    p.position.x += p.velocity.x * (1 / 60);
    p.position.y += p.velocity.y * (1 / 60);

    // 1. Robot hit check
    for (const robot of robots) {
      if (robot.id !== p.ownerId && robot.isAlive) {
        const dx = p.position.x - robot.position.x;
        const dy = p.position.y - robot.position.y;
        if (dx * dx + dy * dy < ROBOT_RADIUS * ROBOT_RADIUS) {
          robot.health = Math.max(0, robot.health - 10);
          if (robot.health === 0) robot.isAlive = false;
          return false; // destroy projectile
        }
      }
    }

    // 2. SOLID obstacle hit check
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

    // 3. Arena boundary cull
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
  targetPos: Vector2
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
  };
}