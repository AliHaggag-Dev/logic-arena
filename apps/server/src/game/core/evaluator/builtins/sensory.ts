import { Robot, Obstacle, performRaycast } from '@logic-arena/engine';
import { UNHANDLED } from './internal';

type EnemySnapshot = [number, number, number, number];
type Point = { x: number; y: number };
type Velocity = { x: number; y: number };
type NumericRecord = Record<string, unknown>;

const PROJECTILE_SPEED = 400;
const TICK_SECONDS = 1 / 60;

export function evaluateSensoryFunction(
  name: string,
  args: unknown[],
  robot: Robot,
  getRobots: () => Robot[],
  getObstacles: () => Obstacle[],
): unknown {
  switch (name) {
    case 'MY_HEALTH':
      return Math.round(robot.health);

    case 'ENEMY_HEALTH': {
      const enemy = getNearestVisibleEnemy(robot);
      return enemy ? Math.round(enemy.health) : 0;
    }

    case 'ENEMY_VELOCITY': {
      const enemy = getNearestVisibleEnemy(robot);
      return {
        vx: enemy?.velocity.x ?? 0,
        vy: enemy?.velocity.y ?? 0,
      };
    }

    case 'PREDICT_POSITION': {
      const enemy = getNearestVisibleEnemy(robot);
      const ticks = typeof args[1] === 'number' ? args[1] : args[0];
      const tickCount = typeof ticks === 'number' ? ticks : 0;
      if (!enemy) return { x: robot.position.x, y: robot.position.y };
      return {
        x: enemy.position.x + enemy.velocity.x * tickCount * TICK_SECONDS,
        y: enemy.position.y + enemy.velocity.y * tickCount * TICK_SECONDS,
      };
    }

    case 'CALCULATE_LEAD': {
      const myPos = readPoint(args[0]) ?? robot.position;
      const nearestEnemy = getNearestVisibleEnemy(robot);
      const enemyPos = readPoint(args[1]) ?? nearestEnemy?.position;
      const enemyVel = readVelocity(args[2]) ?? nearestEnemy?.velocity;
      const projectileSpeed =
        typeof args[3] === 'number' && args[3] > 0
          ? args[3]
          : PROJECTILE_SPEED;
      if (!enemyPos || !enemyVel) return { x: myPos.x, y: myPos.y };
      const distance = Math.hypot(enemyPos.x - myPos.x, enemyPos.y - myPos.y);
      const travelTime = distance / projectileSpeed;
      return {
        x: enemyPos.x + enemyVel.x * travelTime,
        y: enemyPos.y + enemyVel.y * travelTime,
      };
    }

    case 'GET_ALL_VISIBLE_ENEMIES': {
      const visibleEnemies = robot.visibleEntities?.robots ?? [];
      const snapshots: EnemySnapshot[] = [];

      for (const enemy of visibleEnemies) {
        if (!enemy.isAlive) continue;
        const edx = enemy.position.x - robot.position.x;
        const edy = enemy.position.y - robot.position.y;
        const distance = Math.round(Math.hypot(edx, edy));
        snapshots.push([
          distance,
          Math.round(enemy.position.x),
          Math.round(enemy.position.y),
          Math.round(enemy.health),
        ]);
      }

      return snapshots;
    }

    case 'RAYCAST': {
      const a = args[0] as number;
      const relativeAngle = typeof a === 'number' ? a : 0;
      const absoluteDirection = robot.rotation + relativeAngle;
      const fovRange = robot.fov?.range ?? 300;

      return Math.round(
        performRaycast(
          robot.position,
          absoluteDirection,
          getObstacles(),
          getRobots(),
          robot.id,
          fovRange,
        ),
      );
    }

    default:
      return UNHANDLED;
  }
}

function getNearestVisibleEnemy(robot: Robot): Robot | null {
  const visibleEnemies = (robot.visibleEntities?.robots ?? []).filter(
    (enemy) => enemy.id !== robot.id && enemy.isAlive,
  );
  if (visibleEnemies.length === 0) return null;

  let nearest = visibleEnemies[0];
  let nearestDistance = Infinity;
  for (const enemy of visibleEnemies) {
    const dx = enemy.position.x - robot.position.x;
    const dy = enemy.position.y - robot.position.y;
    const distance = dx * dx + dy * dy;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = enemy;
    }
  }
  return nearest;
}

function readPoint(value: unknown): Point | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as NumericRecord;
  if (typeof candidate.x === 'number' && typeof candidate.y === 'number') {
    return { x: candidate.x, y: candidate.y };
  }
  return null;
}

function readVelocity(value: unknown): Velocity | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as NumericRecord;
  if (typeof candidate.vx === 'number' && typeof candidate.vy === 'number') {
    return { x: candidate.vx, y: candidate.vy };
  }
  if (typeof candidate.x === 'number' && typeof candidate.y === 'number') {
    return { x: candidate.x, y: candidate.y };
  }
  return null;
}
