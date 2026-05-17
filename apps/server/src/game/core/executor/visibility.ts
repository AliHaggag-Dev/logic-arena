import type {
  Obstacle,
  Projectile,
  Robot,
  Vector2,
  VisibleEntities,
} from '@logic-arena/engine';

const DEG_TO_RAD = Math.PI / 180;

export function computeImmediateVisibility(
  robot: Robot,
  allRobots: Robot[],
  allProjectiles: Projectile[],
  allObstacles: Obstacle[],
): VisibleEntities {
  const fov = robot.fov ?? { angle: 120, range: 300 };
  const halfAngleRad = (fov.angle / 2) * DEG_TO_RAD;
  const cosHalf = Math.cos(halfAngleRad);
  const rangeSquared = fov.range * fov.range;
  const fovDirection = robot.fovDirection ?? robot.rotation;
  const fx = Math.cos(fovDirection);
  const fy = Math.sin(fovDirection);

  return {
    robots: allRobots.filter((candidate: Robot): boolean => (
      candidate.id !== robot.id &&
      candidate.isAlive &&
      isInCone(robot.position, candidate.position, fx, fy, cosHalf, rangeSquared)
    )),
    projectiles: allProjectiles.filter((projectile: Projectile): boolean => (
      isInCone(robot.position, projectile.position, fx, fy, cosHalf, rangeSquared)
    )),
    obstacles: allObstacles.filter((obstacle: Obstacle): boolean => (
      isInCone(robot.position, obstacle.position, fx, fy, cosHalf, rangeSquared)
    )),
  };
}

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
  const distSquared = dx * dx + dy * dy;
  if (distSquared === 0) return true;
  if (distSquared > rangeSquared) return false;

  const dist = Math.sqrt(distSquared);
  const dot = (fx * dx + fy * dy) / dist;
  return dot >= cosHalf;
}
