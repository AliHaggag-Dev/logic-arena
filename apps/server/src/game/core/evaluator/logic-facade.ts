import { GameLoop } from '@logic-arena/engine';
import { Program } from '../../../../../../packages/logic-parser/src';
import { ActionExecutor } from '../executor';
import { ExpressionEvaluator } from './expression-facade';
import { LogicRegistry } from './logic-registry';
import { BlockExecutor } from './block-executor';
import {
  syncRotationToMemory,
  syncFovToMemory,
  syncEnergyToMemory,
} from './memory-sync';
import { OpsCounter } from './types';

export class LogicEvaluator {
  private registry: LogicRegistry;
  private blockExecutor: BlockExecutor;
  /** Tracks which robots were in STASIS last tick to detect exit transitions. */
  private wasInStasis = new Map<string, boolean>();

  constructor(
    private gameLoop: GameLoop,
    private actionExecutor: ActionExecutor,
  ) {
    this.registry = new LogicRegistry(actionExecutor);
    const expressionEvaluator = new ExpressionEvaluator();
    this.blockExecutor = new BlockExecutor(
      gameLoop,
      actionExecutor,
      expressionEvaluator,
      this.registry.functions,
    );
  }

  setLogic(robotId: string, ast: Program): void {
    this.registry.setLogic(robotId, ast);
  }

  clearAllLogic(): void {
    this.registry.clearAllLogic();
  }

  clearLogicForRobot(robotId: string): void {
    this.registry.clearLogicForRobot(robotId);
    this.wasInStasis.delete(robotId);
  }

  evaluate(robotId: string): void {
    const program = this.registry.robotLogic.get(robotId);
    const robot = this.gameLoop.getRobots().find((r) => r.id === robotId);
    if (!program || !robot || robot.health <= 0) return;

    // --- STASIS exit detection: reset runtime state for a clean restart ---
    // When the robot transitions from inStasis=true to inStasis=false,
    // wipe memory and cooldowns so the script restarts from the top.
    const wasStasis = this.wasInStasis.get(robotId) ?? false;
    const isStasis = robot.inStasis ?? false;
    if (wasStasis && !isStasis) {
      this.registry.resetRuntimeState(robotId);
    }
    this.wasInStasis.set(robotId, isStasis);

    // If still in STASIS, nothing to evaluate (block-executor also guards this)
    if (isStasis) return;

    const memory = this.registry.memories.getMemory(robotId);

    // Honour WAIT ticks
    const waitTicks = (memory['___waitTicks'] as number) ?? 0;
    if (waitTicks > 0) {
      memory['___waitTicks'] = waitTicks - 1;
      return;
    }

    syncRotationToMemory(robot, memory);
    syncFovToMemory(robot, memory);
    syncEnergyToMemory(robot, memory);

    const opsCounter: OpsCounter = { count: 0 };
    this.blockExecutor.executeBlock(
      robotId,
      robot,
      program.body,
      memory,
      opsCounter,
    );

    // Flush and optimize any buffered movement actions.
    // Must happen before tick() returns so executedCommandThisTick
    // is set before the 60fps physics loop checks it.
    this.blockExecutor.flushOptimizedActions(robotId);
  }
}
