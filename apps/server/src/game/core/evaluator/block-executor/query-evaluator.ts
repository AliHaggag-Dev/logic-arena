import { Robot } from '@logic-arena/engine';
import { QueryStatement } from '@logic-arena/logic-parser';
import { ActionExecutor } from '../../executor';

type QueryResult = string | number;

export function executeQueryStatement(
  actionExecutor: ActionExecutor,
  robotId: string,
  robot: Robot,
  queryStmt: QueryStatement,
): void {
  const query = queryStmt.query;
  const result = evaluateQuery(robotId, robot, query);
  actionExecutor.emitQuery(robotId, query, result);
}

function evaluateQuery(
  robotId: string,
  robot: Robot,
  query: string,
): QueryResult {
  switch (query) {
    case 'GET_HEALTH':
      return robot.health;
    case 'GET_ENERGY':
      return Math.round(robot.energy ?? 0);
    case 'GET_ENERGY_PCT':
      return Math.round(((robot.energy ?? 0) / (robot.maxEnergy ?? 100)) * 100);
    case 'GET_DISTANCE':
      return getNearestVisibleEnemyDistance(robotId, robot);
    case 'GET_POSITION':
      return `{x:${Math.round(robot.position.x)},y:${Math.round(robot.position.y)}}`;
    case 'GET_ROTATION':
      return Number(robot.rotation.toFixed(2));
    case 'GET_FOV_DIR':
      return Number((robot.fovDirection ?? robot.rotation).toFixed(2));
    case 'GET_VISIBLE_COUNT':
      return (
        robot.visibleEntities?.robots.filter(
          (r) => r.health > 0 && r.id !== robotId,
        ).length ?? 0
      );
    case 'GET_OBSTACLE_TYPE':
      return getNearestVisibleObstacleType(robot);
    case 'GET_OBSTACLE_DISTANCE':
      return getNearestVisibleObstacleDistance(robot);
    default:
      return 0;
  }
}

function getNearestVisibleEnemyDistance(
  robotId: string,
  robot: Robot,
): QueryResult {
  const visibleEnemies =
    robot.visibleEntities?.robots.filter(
      (r) => r.health > 0 && r.id !== robotId,
    ) || [];
  if (visibleEnemies.length === 0) return 'Infinity';

  let minDist = Infinity;
  for (const enemy of visibleEnemies) {
    const dx = enemy.position.x - robot.position.x;
    const dy = enemy.position.y - robot.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) minDist = dist;
  }
  return Math.round(minDist);
}

function getNearestVisibleObstacleType(robot: Robot): QueryResult {
  const obstacles = robot.visibleEntities?.obstacles || [];
  if (obstacles.length === 0) return 'NONE';

  let nearest = obstacles[0];
  let minDist = Infinity;
  for (const obs of obstacles) {
    const dx = obs.position.x - robot.position.x;
    const dy = obs.position.y - robot.position.y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      nearest = obs;
    }
  }
  return nearest.type;
}

function getNearestVisibleObstacleDistance(robot: Robot): QueryResult {
  const obstacles = robot.visibleEntities?.obstacles || [];
  if (obstacles.length === 0) return 'Infinity';

  let minDist = Infinity;
  for (const obs of obstacles) {
    const dx = obs.position.x - robot.position.x;
    const dy = obs.position.y - robot.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) minDist = dist;
  }
  return Math.round(minDist);
}
