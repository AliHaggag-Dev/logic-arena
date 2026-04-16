import { GameLoop, EnergyManager } from '@logic-arena/engine';
import { Socket } from 'socket.io';
import { ActionExecutor } from '../../game/core/executor/action-executor';
import { Pathfinder } from '../../game/core/pathfinder';
import { LogicEvaluator } from '../../game/core/evaluator/logic-evaluator';

export interface GameDependencies {
  pathfinder:     Pathfinder;
  actionExecutor: ActionExecutor;
  logicEvaluator: LogicEvaluator;
  energyManager:  EnergyManager;
}

export function createGameDependencies(
  gameLoop: GameLoop,
  connectedClients: Map<string, Socket> = new Map(),
): GameDependencies {
  // Reuse the EnergyManager that lives on the GameLoop instance,
  // so both the physics tick and the action executor share the same state.
  const energyManager  = gameLoop.energyManager;
  const pathfinder     = new Pathfinder(gameLoop);
  const actionExecutor = new ActionExecutor(gameLoop, connectedClients, pathfinder, energyManager);
  const logicEvaluator = new LogicEvaluator(gameLoop, actionExecutor);

  return { pathfinder, actionExecutor, logicEvaluator, energyManager };
}