import { GameLoop, Robot } from '@logic-arena/engine';
import { WhileStatement, ForStatement } from '@logic-arena/logic-parser';
import { ExpressionEvaluator } from '../expression-facade';
import { BREAK_SIGNAL, RETURN_SIGNAL, BlockResult } from './control-flow';
import { CONSTANTS, OpsCounter } from '../types';
import { ExecuteBlockFn } from './if-handler';

export function executeWhileStatement(
  executeBlock: ExecuteBlockFn,
  expressionEvaluator: ExpressionEvaluator,
  robotId: string,
  robot: Robot,
  whileStmt: WhileStatement,
  memory: Record<string, unknown>,
  opsCounter: OpsCounter,
  dispatchedActions: Set<string>,
  gameLoop: GameLoop,
): BlockResult | null {
  let iters = 0;
  while (iters < CONSTANTS.MAX_WHILE_ITERS) {
    const cond = expressionEvaluator.evaluateCondition(
      robot,
      whileStmt.condition,
      memory,
      () => gameLoop.getRobots(),
      () => gameLoop.getGameState().obstacles,
    );
    if (!cond) break;
    const result = executeBlock(
      robotId,
      robot,
      whileStmt.body,
      memory,
      opsCounter,
      dispatchedActions,
    );
    if (result.signal === BREAK_SIGNAL) break;
    if (result.signal === RETURN_SIGNAL) return result;
    iters++;
  }
  return null;
}

export function executeForStatement(
  executeBlock: ExecuteBlockFn,
  expressionEvaluator: ExpressionEvaluator,
  robotId: string,
  robot: Robot,
  forStmt: ForStatement,
  memory: Record<string, unknown>,
  opsCounter: OpsCounter,
  dispatchedActions: Set<string>,
  gameLoop: GameLoop,
): BlockResult | null {
  const startVal = expressionEvaluator.evaluateExpression(
    robot,
    forStmt.start,
    memory,
    () => gameLoop.getRobots(),
    () => gameLoop.getGameState().obstacles,
  );
  const endVal = expressionEvaluator.evaluateExpression(
    robot,
    forStmt.end,
    memory,
    () => gameLoop.getRobots(),
    () => gameLoop.getGameState().obstacles,
  );

  if (typeof startVal !== 'number' || typeof endVal !== 'number') return null;

  const varName = forStmt.variable.value;
  const maxIter = Math.min(
    Math.abs(endVal - startVal),
    CONSTANTS.MAX_WHILE_ITERS * 10,
  );
  let iterCount = 0;

  if (startVal <= endVal) {
    for (
      let i = startVal;
      i <= endVal && iterCount < maxIter;
      i++, iterCount++
    ) {
      memory[varName] = i;
      const result = executeBlock(
        robotId,
        robot,
        forStmt.body,
        memory,
        opsCounter,
        dispatchedActions,
      );
      if (result.signal === BREAK_SIGNAL) break;
      if (result.signal === RETURN_SIGNAL) return result;
    }
  } else {
    for (
      let i = startVal;
      i >= endVal && iterCount < maxIter;
      i--, iterCount++
    ) {
      memory[varName] = i;
      const result = executeBlock(
        robotId,
        robot,
        forStmt.body,
        memory,
        opsCounter,
        dispatchedActions,
      );
      if (result.signal === BREAK_SIGNAL) break;
      if (result.signal === RETURN_SIGNAL) return result;
    }
  }
  return null;
}
