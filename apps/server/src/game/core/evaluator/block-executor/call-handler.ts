import { GameLoop, Robot } from '@logic-arena/engine';
import { CallStatement, FunctionDeclaration } from '@logic-arena/logic-parser';
import { ExpressionEvaluator } from '../expression-facade';
import { RETURN_SIGNAL } from './control-flow';
import { OpsCounter } from '../types';
import { ExecuteBlockFn } from './if-handler';

export function executeCallStatement(
  executeBlock: ExecuteBlockFn,
  expressionEvaluator: ExpressionEvaluator,
  robotId: string,
  robot: Robot,
  callStmt: CallStatement,
  memory: Record<string, unknown>,
  opsCounter: OpsCounter,
  dispatchedActions: Set<string>,
  gameLoop: GameLoop,
  functions: Map<string, Map<string, FunctionDeclaration>>,
): void {
  const funcName = callStmt.functionName.value;
  const funcMap = functions.get(robotId);
  if (!funcMap) return;
  const func = funcMap.get(funcName);
  if (!func) return;

  const scopedMemory = { ...memory };

  if (func.params && callStmt.args) {
    for (let i = 0; i < func.params.length; i++) {
      const paramName = func.params[i].value;
      const argValue =
        i < callStmt.args.length
          ? expressionEvaluator.evaluateExpression(
              robot,
              callStmt.args[i],
              memory,
              () => gameLoop.getRobots(),
              () => gameLoop.getGameState().obstacles,
            )
          : undefined;
      scopedMemory[paramName] = argValue;
    }
  }

  const result = executeBlock(
    robotId,
    robot,
    func.body,
    scopedMemory,
    opsCounter,
    dispatchedActions,
  );

  const paramNames = new Set(func.params?.map((p) => p.value) ?? []);
  for (const key of Object.keys(scopedMemory)) {
    if (!paramNames.has(key)) {
      memory[key] = scopedMemory[key];
    }
  }

  if (result.signal === RETURN_SIGNAL) {
    memory['__return'] = result.returnValue;
  }
}
