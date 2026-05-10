import { ActionExpression, ScanStatement } from '@logic-arena/logic-parser';

export interface BufferedAction {
  cmd: string;
  action: ActionExpression | ScanStatement;
  memory: Record<string, unknown>;
}

/**
 * Optimizes a per-tick buffer of actions from a single robot's script
 * evaluation. Removes commands that are semantically cancelled by later
 * commands in the same tick (e.g. PATHFIND immediately followed by STOP).
 *
 * Rules:
 * 1. If a MOVEMENT_EVENT (PATHFIND) has a MOVEMENT_STATE command after it,
 *    remove the PATHFIND — it will be cancelled before it takes effect.
 * 2. If multiple MOVEMENT_STATE commands are queued (e.g. MOVE then STOP),
 *    keep only the LAST one — earlier states are overwritten.
 */
export class ActionOptimizer {
  private static readonly MOVEMENT_STATE = new Set([
    'STOP', 'MOVE', 'MOVE_FAST', 'BACKUP',
  ]);

  private static readonly MOVEMENT_EVENT = new Set(['PATHFIND']);

  static optimize(actions: BufferedAction[]): BufferedAction[] {
    if (actions.length <= 1) return actions;

    // Find the last MOVEMENT_STATE command index (the "settled state")
    let lastMovementStateIndex = -1;
    for (let i = actions.length - 1; i >= 0; i--) {
      if (ActionOptimizer.MOVEMENT_STATE.has(actions[i].cmd)) {
        lastMovementStateIndex = i;
        break;
      }
    }

    const result: BufferedAction[] = [];

    for (let i = 0; i < actions.length; i++) {
      const { cmd } = actions[i];

      // Remove PATHFIND if a MOVEMENT_STATE appears after it in the buffer
      // (the pathfind result would be overwritten before any movement happens)
      if (ActionOptimizer.MOVEMENT_EVENT.has(cmd)) {
        let hasLaterMovementState = false;
        for (let j = i + 1; j < actions.length; j++) {
          if (ActionOptimizer.MOVEMENT_STATE.has(actions[j].cmd)) {
            hasLaterMovementState = true;
            break;
          }
        }
        if (hasLaterMovementState) continue;
      }

      // Remove MOVEMENT_STATE commands that are NOT the final one
      if (ActionOptimizer.MOVEMENT_STATE.has(cmd) && i !== lastMovementStateIndex) {
        continue;
      }

      result.push(actions[i]);
    }

    return result;
  }
}
