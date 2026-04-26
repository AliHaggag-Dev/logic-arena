import { GameLoop, EnergyManager } from '@logic-arena/engine';
import { Socket } from 'socket.io';
import {
  ActionExpression,
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
      GET_HEALTH:        'health',
      GET_ENERGY:        'energy',
      GET_ENERGY_PCT:    'energy%',
      GET_DISTANCE:      'distance',
      GET_POSITION:      'position',
      GET_ROTATION:      'rotation',
      GET_FOV_DIR:       'fov_dir',
      GET_VISIBLE_COUNT: 'visible',
    };

    const friendlyName = QUERY_LABELS[queryName] ?? queryName.toLowerCase();
    const label = `${friendlyName} = ${result}`;

    if (this.onEvent) {
      this.onEvent('queryResult', {
        robotId,
        query:   queryName,
        result,
        label,
        message: `[QUERY] ${label}`,
      });
    }

    this.cooldowns.markQueryEmitted(robotId, queryName);
  }

  executeAction(
    robotId: string,
    action: ActionExpression | ScanStatement,
    memory: Record<string, unknown>,
  ): void {
    const actionCommand =
      action.type === 'ScanStatement'
        ? 'SCAN'
        : (action as ActionExpression).command.toUpperCase();

    // --- Energy gate ---
    // FIRE / BURST_FIRE skip this gate — CombatExecutor handles their own
    // visibility check first, then deducts energy only if a valid target exists.
    // All other commands go through the upfront gate as normal.
    const robot = this.gameLoop.getRobots().find((r) => r.id === robotId);
    if (!robot) return;

    const isCombatCommand = actionCommand === 'FIRE' || actionCommand === 'BURST_FIRE';

    if (!isCombatCommand) {
      const allowed = this.energyManager.deduct(robot, actionCommand);
      if (!allowed) {
        // Robot is in stasis and this command is blocked — emit STASIS hint once
        if (this.cooldowns.shouldEmitAction(robotId, 'STASIS')) {
          if (this.onEvent) {
            this.onEvent('logicExecuted', {
              robotId,
              action: 'STASIS',
              message: `[STASIS] ${robotId} is recharging...`,
            });
          }
          this.cooldowns.markEmitted(robotId, 'STASIS');
        }
        return;
      }
    }

    // Mark that the robot performed an active command (blocks regen for this tick)
    if (actionCommand !== 'STOP') {
      robot.executedCommandThisTick = true;
    }

    // --- Emit logicExecuted to clients (rate-limited by cooldown) ---
    if (this.cooldowns.shouldEmitAction(robotId, actionCommand)) {
      if (this.onEvent) {
        this.onEvent('logicExecuted', {
          robotId,
          action: actionCommand,
          message: `Logic Triggered: ${actionCommand}`,
        });
      }
      this.cooldowns.markEmitted(robotId, actionCommand);
      console.log(`[ActionExecutor] ${robotId} → ${actionCommand}`);
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
      case 'BACKUP':
        this.movementExecutor.execute(robotId, actionCommand, memory);
        break;
      case 'SCAN':
        this.scanExecutor.execute(robotId, memory);
        break;
      default:
        console.warn(`[ActionExecutor] Unknown command: ${actionCommand}`);
    }
  }

  clearState(robotId: string): void {
    this.cooldowns.clearState(robotId);
  }
}
