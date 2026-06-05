import {
  Obstacle,
  Robot,
  isForbiddenAliScriptPropertyKey,
  safeGetAliScriptProperty,
} from '@logic-arena/engine';
import {
  Expression,
  NodeType,
  IndexExpression,
  MemberExpression,
  Identifier,
} from '../../../../../../../packages/logic-parser/src';
import { resolveIdentifier } from '../identifier-resolver';

export function evaluateAccess(
  robot: Robot,
  expression: Expression,
  evaluateExpr: (expr: Expression) => unknown,
  memory: Record<string, unknown>,
  getRobots: () => Robot[],
  getObstacles: () => Obstacle[],
): unknown {
  switch (expression.type) {
    case NodeType.Identifier:
      return resolveIdentifier(robot, expression, memory);

    case NodeType.IndexExpression:
      return evaluateIndexExpression(
        robot,
        expression,
        evaluateExpr,
        memory,
        getRobots,
        getObstacles,
      );

    case NodeType.MemberExpression:
      return evaluateMemberExpression(
        robot,
        expression,
        evaluateExpr,
        memory,
        getRobots,
        getObstacles,
      );

    default:
      return undefined;
  }
}

function evaluateIndexExpression(
  robot: Robot,
  idxExpr: IndexExpression,
  evaluateExpr: (expr: Expression) => unknown,
  memory: Record<string, unknown>,
  getRobots: () => Robot[],
  getObstacles: () => Obstacle[],
): unknown {
  const obj = evaluateExpr(idxExpr.object);
  const idx = evaluateExpr(idxExpr.index);

  if (Array.isArray(obj) && typeof idx === 'number') {
    const i = Math.floor(idx);
    if (i >= 0 && i < obj.length) return obj[i];
    return undefined;
  }
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    const key = String(idx);
    if (isForbiddenAliScriptPropertyKey(key)) return undefined;
    return safeGetAliScriptProperty(obj as Record<string, unknown>, key);
  }
  return undefined;
}

function evaluateMemberExpression(
  robot: Robot,
  memExpr: MemberExpression,
  evaluateExpr: (expr: Expression) => unknown,
  memory: Record<string, unknown>,
  getRobots: () => Robot[],
  getObstacles: () => Obstacle[],
): unknown {
  const target = evaluateExpr(memExpr.object);
  if (target !== null && typeof target === 'object' && !Array.isArray(target)) {
    if (isForbiddenAliScriptPropertyKey(memExpr.property)) return undefined;
    return safeGetAliScriptProperty(
      target as Record<string, unknown>,
      memExpr.property,
    );
  }
  return undefined;
}
