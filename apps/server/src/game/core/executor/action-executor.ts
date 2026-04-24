import { GameLoop, EnergyManager } from '@logic-arena/engine';
import { Socket } from 'socket.io';
import { ActionExpression, ScanStatement } from '../../../../../../packages/logic-parser/src';
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
    private connectedClients: Map<string, Socket>,
    private pathfinder: Pathfinder,
    private energyManager: EnergyManager,
  ) {
    this.movementExecutor = new MovementExecutor(gameLoop, pathfinder);
    this.combatExecutor   = new CombatExecutor(gameLoop, this.cooldowns, energyManager);
    this.scanExecutor     = new ScanExecutor(gameLoop);
  }

  isBareActionOffCooldown(robotId: string, actionCommand: string): boolean {
    return this.cooldowns.isOffCooldown(robotId, actionCommand);
  }

  markBareActionExecuted(robotId: string, actionCommand: string): void {
    this.cooldowns.markExecuted(robotId, actionCommand);
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
    // deduct() returns false if the robot is in STASIS and the command is blocked.
    // It still deducts cost for allowed commands (SCAN costs energy even in stasis).
    const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
    if (!robot) return;

    const allowed = this.energyManager.deduct(robot, actionCommand);
    if (!allowed) {
      // Robot is in stasis and this command is blocked — emit STASIS hint once
      if (this.cooldowns.shouldEmitAction(robotId, 'STASIS')) {
        this.connectedClients.forEach(client =>
          client.emit('logicExecuted', {
            robotId,
            action: 'STASIS',
            message: `[STASIS] ${robotId} is recharging...`,
          }),
        );
        this.cooldowns.markEmitted(robotId, 'STASIS');
      }
      return;
    }

    // --- Emit logicExecuted to clients (rate-limited by cooldown) ---
    if (this.cooldowns.shouldEmitAction(robotId, actionCommand)) {
      this.connectedClients.forEach(client =>
        client.emit('logicExecuted', {
          robotId,
          action: actionCommand,
          message: `Logic Triggered: ${actionCommand}`,
        }),
      );
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