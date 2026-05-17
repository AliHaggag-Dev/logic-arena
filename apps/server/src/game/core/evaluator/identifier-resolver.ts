import { Robot } from '@logic-arena/engine';
import {
  Identifier,
  NumberLiteral,
  StringLiteral,
  NodeType,
} from '../../../../../../packages/logic-parser/src';

/**
 * Reserved built-in identifier names that always resolve from live robot state.
 * These must never be shadowed by a user's SET assignment in memory.
 */
const RESERVED_IDENTIFIERS = new Set([
  'MY_ENERGY',
  'ENERGY_PCT',
  'IN_STASIS',
  'CAN_SEE_ENEMY',
  'VISIBLE_ENEMY_COUNT',
  'FOV_ANGLE',
  'POSITION_X',
  'POSITION_Y',
  'NEAREST_VISIBLE_X',
  'NEAREST_VISIBLE_Y',
  'CAN_SEE_OBSTACLE',
  'NEAREST_OBSTACLE_TYPE',
  'NEAREST_OBSTACLE_DISTANCE',
  'distance',
  'health',
  'rotation',
  'target_vx',
  'target_vy',
  'bullet_speed',
  'spotted',
]);

export function resolveIdentifier(
  robot: Robot,
  node: Identifier | NumberLiteral | StringLiteral,
  memory: Record<string, unknown>,
): unknown {
  if (
    node.type === NodeType.NumberLiteral ||
    node.type === NodeType.StringLiteral
  ) {
    return node.value;
  }

  const name = node.value;

  // 1. Built-in read-only identifiers always resolve from live robot state.
  //    These are checked BEFORE memory so that a user's SET assignment cannot
  //    shadow and permanently freeze a live sensor value.
  const maxEnergy = robot.maxEnergy ?? 1000;
  const energy = robot.energy ?? maxEnergy;

  // --- Energy / Stasis identifiers ---
  switch (name) {
    case 'MY_ENERGY':
      return energy;
    case 'ENERGY_PCT':
      return Math.round((energy / maxEnergy) * 100);
    case 'IN_STASIS':
      return robot.inStasis ?? false;
  }

  // --- FOV / Visibility identifiers ---
  const visibleRobots = getVisibleRobotsForIdentifier(robot, memory);

  switch (name) {
    case 'CAN_SEE_ENEMY':
      return visibleRobots.length > 0;
    case 'VISIBLE_ENEMY_COUNT':
      return visibleRobots.length;
    case 'FOV_ANGLE':
      return robot.fov?.angle ?? 120;
    case 'POSITION_X':
      return robot.position.x;
    case 'POSITION_Y':
      return robot.position.y;

    case 'NEAREST_VISIBLE_X':
    case 'NEAREST_VISIBLE_Y': {
      if (visibleRobots.length === 0) {
        return name === 'NEAREST_VISIBLE_X'
          ? robot.position.x
          : robot.position.y;
      }
      let nearest = visibleRobots[0];
      let nearestDst = Infinity;
      for (const candidate of visibleRobots) {
        const dx = candidate.position.x - robot.position.x;
        const dy = candidate.position.y - robot.position.y;
        const dst = dx * dx + dy * dy;
        if (dst < nearestDst) {
          nearestDst = dst;
          nearest = candidate;
        }
      }
      return name === 'NEAREST_VISIBLE_X'
        ? nearest.position.x
        : nearest.position.y;
    }
  }

  // 2. User-defined variable (SET x = ...) — only for non-reserved names.
  if (!RESERVED_IDENTIFIERS.has(name) && name in memory) return memory[name];

  // 3. Legacy / physics-derived identifiers.
  const nearestVisible = getNearestVisible(robot);
  const nearestObstacle = getNearestVisibleObstacle(robot);

  switch (name) {
    case 'CAN_SEE_OBSTACLE':
      return nearestObstacle !== null;
    case 'NEAREST_OBSTACLE_TYPE':
      return nearestObstacle ? nearestObstacle.type : 'NONE';
    case 'NEAREST_OBSTACLE_DISTANCE': {
      if (!nearestObstacle) return Infinity;
      const dx = robot.position.x - nearestObstacle.position.x;
      const dy = robot.position.y - nearestObstacle.position.y;
      return Math.hypot(dx, dy);
    }
    case 'distance': {
      if (!nearestVisible) return Infinity;
      const dx = robot.position.x - nearestVisible.position.x;
      const dy = robot.position.y - nearestVisible.position.y;
      return Math.hypot(dx, dy);
    }
    case 'health':
      return robot.health;
    case 'rotation':
      return robot.rotation;
    case 'target_vx':
      return nearestVisible?.velocity.x ?? 0;
    case 'target_vy':
      return nearestVisible?.velocity.y ?? 0;
    case 'bullet_speed':
      return 400;
    case 'spotted':
      return nearestVisible !== null;

    default:
      return undefined;
  }
}

function getNearestVisible(robot: Robot): Robot | null {
  const visible = robot.visibleEntities?.robots ?? [];
  if (visible.length === 0) return null;

  let nearest = visible[0];
  let nearestDst = Infinity;
  for (const candidate of visible) {
    const dx = candidate.position.x - robot.position.x;
    const dy = candidate.position.y - robot.position.y;
    const dst = dx * dx + dy * dy;
    if (dst < nearestDst) {
      nearestDst = dst;
      nearest = candidate;
    }
  }
  return nearest;
}

function getVisibleRobotsForIdentifier(
  robot: Robot,
  memory: Record<string, unknown>,
): Robot[] {
  const visible = robot.visibleEntities?.robots ?? [];
  if (Number(memory['_SYS_SCAN_SWEEP_DEG'] ?? 0) < 360) return visible;

  const range = robot.fov?.range ?? 300;
  return visible.filter((candidate) => {
    const dx = candidate.position.x - robot.position.x;
    const dy = candidate.position.y - robot.position.y;
    return Math.hypot(dx, dy) <= range;
  });
}

function getNearestVisibleObstacle(robot: Robot) {
  const visible = robot.visibleEntities?.obstacles ?? [];
  if (visible.length === 0) return null;

  let nearest = visible[0];
  let nearestDst = Infinity;
  for (const candidate of visible) {
    const dx = candidate.position.x - robot.position.x;
    const dy = candidate.position.y - robot.position.y;
    const dst = dx * dx + dy * dy;
    if (dst < nearestDst) {
      nearestDst = dst;
      nearest = candidate;
    }
  }
  return nearest;
}
