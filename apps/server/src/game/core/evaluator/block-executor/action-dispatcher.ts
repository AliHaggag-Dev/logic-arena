import { ActionExpression } from '@logic-arena/logic-parser';
import { ActionExecutor } from '../../executor';

const CONTINUOUS_MOVEMENT_COMMANDS = ['MOVE', 'MOVE_FAST', 'BACKUP', 'STOP'];

export function executeActionIfOffCooldown(
  actionExecutor: ActionExecutor,
  robotId: string,
  action: ActionExpression,
  memory: Record<string, unknown>,
): void {
  const cmd = action.command.toUpperCase();
  if (CONTINUOUS_MOVEMENT_COMMANDS.includes(cmd)) {
    // Movement is continuous — no cooldown gate needed
    if (actionExecutor.executeAction(robotId, action, memory)) {
      actionExecutor.markBareActionExecuted(robotId, cmd);
    }
  } else if (actionExecutor.isBareActionOffCooldown(robotId, cmd)) {
    if (actionExecutor.executeAction(robotId, action, memory)) {
      actionExecutor.markBareActionExecuted(robotId, cmd);
    }
  }
}
