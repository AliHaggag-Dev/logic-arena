import { Projectile, Robot, Vector2 } from "../types";

const ROBOT_RADIUS = 15;

export function updateProjectiles(projectiles: Projectile[], robots: Robot[], arenaWidth: number, arenaHeight: number): Projectile[] {
  return projectiles.filter(p => {
    p.position.x += p.velocity.x * (1 / 60); // Assuming 60 FPS for simplicity in physics updates
    p.position.y += p.velocity.y * (1 / 60);

    let hasHit = false;

    for (const robot of robots) {
      if (robot.id !== p.ownerId && robot.isAlive) {
        const dx = p.position.x - robot.position.x;
        const dy = p.position.y - robot.position.y;
        const distance = Math.hypot(dx, dy);

        if (distance < ROBOT_RADIUS) {
          robot.health = Math.max(0, robot.health - 10);
          if (robot.health === 0) robot.isAlive = false;
          hasHit = true;
          break;
        }
      }
    }

    const isOutOfBounds =
      p.position.x < 0 || p.position.x > arenaWidth || p.position.y < 0 || p.position.y > arenaHeight;

    return !hasHit && !isOutOfBounds;
  });
}

export function spawnProjectile(ownerId: string, team: 'A' | 'B', pos: Vector2, targetPos: Vector2): Projectile {
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
    velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
  };
}