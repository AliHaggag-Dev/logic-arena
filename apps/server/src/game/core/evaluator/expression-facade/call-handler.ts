import { Obstacle, Robot } from '@logic-arena/engine';
import {
  Expression,
  FunctionCallExpression,
  NodeType,
} from '../../../../../../../packages/logic-parser/src';
import { evaluateMathFunction } from '../builtins/math';
import { evaluateArrayFunction } from '../builtins/array';
import { evaluateSensoryFunction } from '../builtins/sensory';
import { evaluateCommunicationFunction } from '../builtins/communication';
import { UNHANDLED } from '../builtins/internal';

export function evaluateCall(
  robot: Robot,
  expression: Expression,
  evaluateExpr: (expr: Expression) => unknown,
  memory: Record<string, unknown>,
  getRobots: () => Robot[],
  getObstacles: () => Obstacle[],
): unknown {
  if (expression.type !== NodeType.FunctionCallExpression) return undefined;

  const fnCall = expression;
  const evaluatedArgs = fnCall.args.map((a) => evaluateExpr(a));
  return evaluateBuiltinFunction(
    fnCall.name,
    evaluatedArgs,
    memory,
    robot,
    getRobots,
    getObstacles,
  );
}

function evaluateBuiltinFunction(
  name: string,
  args: unknown[],
  memory: Record<string, unknown>,
  robot: Robot,
  getRobots: () => Robot[],
  getObstacles: () => Obstacle[],
): unknown {
  let result = evaluateMathFunction(name, args);
  if (result !== UNHANDLED) return result;

  result = evaluateArrayFunction(name, args);
  if (result !== UNHANDLED) return result;

  result = evaluateSensoryFunction(name, args, robot, getRobots, getObstacles);
  if (result !== UNHANDLED) return result;

  return evaluateCommunicationFunction(name, args, memory, robot, getRobots);
}
