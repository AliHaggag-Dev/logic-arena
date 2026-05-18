import { Statement, NodeType, ActionStatement } from '../types';
import { SemanticWarning } from './types';
import { CANCELS_MOVEMENT, MOVEMENT_EVENT, MOVEMENT_STATE } from './constants';

export function detectContradictoryCommands(
  statements: Statement[],
  warnings: SemanticWarning[],
): void {
  const pendingMovements: Array<{
    command: string;
    index: number;
    statement: ActionStatement;
  }> = [];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];

    if (stmt.type !== NodeType.ActionStatement) continue;

    const actionStmt = stmt as ActionStatement;
    const cmd = actionStmt.consequence.command;

    if (MOVEMENT_EVENT.has(cmd) || MOVEMENT_STATE.has(cmd)) {
      if (CANCELS_MOVEMENT.has(cmd) && pendingMovements.length > 0) {
        for (const pending of pendingMovements) {
          warnings.push({
            code: 'contradictory-command',
            message: `${pending.command} is immediately cancelled by ${cmd}`,
            severity: 'warning',
          });
        }
        pendingMovements.length = 0;
      }

      pendingMovements.push({ command: cmd, index: i, statement: actionStmt });
    }
  }
}
