import { GameLoop, EnergyManager } from '@logic-arena/engine';
import { Socket } from 'socket.io';
import {
  ActionExpression,
  NodeType,
  ScanStatement,
} from '../../../../../../packages/logic-parser/src';
import { Pathfinder } from '../pathfinder/index';
import { CooldownManager } from './cooldown-manager';
import { MovementExecutor } from './movement-executor';
import { CombatExecutor } from './combat-executor';
import { ScanExecutor } from './scan-executor';

export class ActionExecutor {
  private cooldowns = new CooldownManager();
  private movementExecutor: MovementExecutor;
  private combatExecutor: CombatExecutor;
  private scanExecutor: ScanExecutor;

  /** Per-tick ordered action buffer: robotId → commands in execution order. */
  private tickActionBuffer: Map<string, string[]> = new Map();

  constructor(
    private gameLoop: GameLoop,
    private onEvent: ((event: string, payload: any) => void) | undefined,
    private pathfinder: Pathfinder,
    private energyManager: EnergyManager,
  ) {
    this.movementExecutor = new MovementExecutor(gameLoop, pathfinder);
    this.combatExecutor = new CombatExecutor(
      gameLoop,
      this.cooldowns,
      energyManager,
    );
    this.scanExecutor = new ScanExecutor(gameLoop);
  }

  isBareActionOffCooldown(robotId: string, actionCommand: string): boolean {
    return this.cooldowns.isOffCooldown(robotId, actionCommand);
  }

  markBareActionExecuted(robotId: string, actionCommand: string): void {
    this.cooldowns.markExecuted(robotId, actionCommand);
  }

  emitQuery(robotId: string, queryName: string, result: string | number): void {
    if (!this.cooldowns.shouldEmitQuery(robotId, queryName)) {
      return;
    }

    const QUERY_LABELS: Record<string, string> = {
      GET_HEALTH: 'health',
      GET_ENERGY: 'energy',
      GET_ENERGY_PCT: 'energy%',
      GET_DISTANCE: 'distance',
      GET_POSITION: 'position',
      GET_ROTATION: 'rotation',
      GET_FOV_DIR: 'fov_dir',
      GET_VISIBLE_COUNT: 'visible',
    };

    const friendlyName = QUERY_LABELS[queryName] ?? queryName.toLowerCase();
    const label = `${friendlyName} = ${result}`;

    if (this.onEvent) {
      this.onEvent('queryResult', {
        robotId,
        query: queryName,
        result,
        label,
        message: `[QUERY] ${label}`,
      });
    }

    this.cooldowns.markQueryEmitted(robotId, queryName);
  }

  emitError(robotId: string, message: string): void {
    if (this.onEvent) {
      this.onEvent('queryResult', {
        robotId,
        query: 'ERROR',
        result: 'FATAL',
        label: message,
        message: message,
      });
    }
  }

  executeAction(
    robotId: string,
    action: ActionExpression | ScanStatement,
    memory: Record<string, unknown>,
  ): void {
    const actionCommand =
      action.type === 'ScanStatement' ? 'SCAN' : action.command.toUpperCase();

    // --- Energy gate ---
    // FIRE / BURST_FIRE skip this gate — CombatExecutor handles their own
    // visibility check first, then deducts energy only if a valid target exists.
    // All other commands go through the upfront gate as normal.
    const robot = this.gameLoop.getRobots().find((r) => r.id === robotId);
    if (!robot) return;

    const isCombatCommand =
      actionCommand === 'FIRE' || actionCommand === 'BURST_FIRE';

    if (!isCombatCommand) {
      const allowed = this.energyManager.deduct(robot, actionCommand);
      if (!allowed) {
        return;
      }
    }

    // Mark that the robot performed an active command (blocks regen for this tick)
    if (actionCommand !== 'STOP') {
      robot.executedCommandThisTick = true;
    }

    // --- Buffer action for emit at end of tick ---
    const buffer = this.tickActionBuffer.get(robotId);
    if (buffer) {
      buffer.push(actionCommand);
    } else {
      this.tickActionBuffer.set(robotId, [actionCommand]);
    }

    // --- Dispatch ---
    switch (actionCommand) {
      case 'FIRE':
      case 'BURST_FIRE':
        this.combatExecutor.execute(robotId, actionCommand);
        break;
      case 'PATHFIND':
      case 'STOP':
      case 'MOVE':
      case 'MOVE_FAST':
      case 'BACKUP': {
        const movementAction = action as ActionExpression;
        const dirArg = movementAction.args?.[0];
        const direction =
          dirArg?.type === NodeType.Identifier
            ? (dirArg as { value: string }).value.toUpperCase() as 'FORWARD' | 'LEFT' | 'RIGHT'
            : 'FORWARD';
        this.movementExecutor.execute(robotId, actionCommand, memory, direction);
        break;
      }
      case 'SCAN':
        this.scanExecutor.execute(robotId, memory);
        break;
      default:
        console.warn(`[ActionExecutor] Unknown command: ${actionCommand}`);
    }
  }

  /**
   * Called once per tick per robot (from MatchEngine.tick()).
   * Processes the buffered actions for this tick and emits `logicExecuted`
   * for the **last continuous command** (the robot's settled state) plus
   * each **unique non-continuous command**.
   *
   * This prevents alternating spam when a robot's script evaluates both a
   * non-continuous command (e.g. PATHFIND) and a continuous one (e.g. STOP)
   * in the same tick — only the settled continuous command is tracked,
   * and non-continuous ones have independent per-command timers.
   */
  flushEmits(robotId: string): void {
    const buffer = this.tickActionBuffer.get(robotId);
    if (!buffer || buffer.length === 0) {
      this.tickActionBuffer.delete(robotId);
      return;
    }
    this.tickActionBuffer.delete(robotId);

    const CONTINUOUS = CooldownManager.CONTINUOUS_COMMANDS;

    // Scan from the end to find the LAST continuous command (the "settled state")
    let lastContinuous: string | undefined;
    for (let i = buffer.length - 1; i >= 0; i--) {
      if (CONTINUOUS.has(buffer[i])) {
        lastContinuous = buffer[i];
        break;
      }
    }

    // Collect unique non-continuous commands executed this tick
    const nonContinuous = new Set<string>();
    for (const cmd of buffer) {
      if (!CONTINUOUS.has(cmd)) {
        nonContinuous.add(cmd);
      }
    }

    // Emit the continuous command if it changed (it won't be re-emitted
    // until another continuous command replaces it — no alternating spam)
    if (lastContinuous) {
      if (this.cooldowns.shouldEmitAction(robotId, lastContinuous)) {
        this.internalEmit(robotId, lastContinuous);
        this.cooldowns.markEmitted(robotId, lastContinuous);
      }
    }

    // Emit each non-continuous command (gated by per-command 1s cooldown)
    for (const cmd of nonContinuous) {
      if (this.cooldowns.shouldEmitAction(robotId, cmd)) {
        this.internalEmit(robotId, cmd);
        this.cooldowns.markEmitted(robotId, cmd);
      }
    }
  }

  private internalEmit(robotId: string, actionCommand: string): void {
    if (this.onEvent) {
      this.onEvent('logicExecuted', {
        robotId,
        action: actionCommand,
        message: `Logic Triggered: ${actionCommand}`,
      });
    }
  }

  clearState(robotId: string, fullReset: boolean = true): void {
    this.cooldowns.clearState(robotId, fullReset);
  }

  /** Enable headless simulation mode — cooldowns use virtual time instead of Date.now(). */
  setVirtualTime(ms: number): void {
    this.cooldowns.setVirtualTime(ms);
  }
}
