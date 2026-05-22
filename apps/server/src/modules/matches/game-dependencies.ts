import { GameLoop, EnergyManager } from '@logic-arena/engine';
import { Socket } from 'socket.io';
import { ActionExecutor } from '../../game/core/executor/action-executor';
import { Pathfinder } from '../../game/core/pathfinder/index';
import { LogicEvaluator } from '../../game/core/evaluator/logic-facade';

export interface GameDependencies {
  pathfinder: Pathfinder;
  actionExecutor: ActionExecutor;
  logicEvaluator: LogicEvaluator;
  energyManager: EnergyManager;
}

export function createGameDependencies(
  gameLoop: GameLoop,
  onEvent?: (event: string, payload: Record<string, unknown>) => void,
): GameDependencies {
  // Reuse the EnergyManager that lives on the GameLoop instance,
  // so both the physics tick and the action executor share the same state.
  const energyManager = gameLoop.energyManager;
  const pathfinder = new Pathfinder(gameLoop);
  const actionExecutor = new ActionExecutor(
    gameLoop,
    onEvent,
    pathfinder,
    energyManager,
  );
  const logicEvaluator = new LogicEvaluator(gameLoop, actionExecutor);

  return { pathfinder, actionExecutor, logicEvaluator, energyManager };
}
