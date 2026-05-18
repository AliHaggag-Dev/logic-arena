import { Statement, NodeType } from '../types';
import { SemanticWarning } from './types';
import { EARLY_EXIT_TYPES } from './constants';

function getExitName(type: NodeType): string {
  switch (type) {
    case NodeType.ReturnStatement:
      return 'RETURN';
    case NodeType.BreakStatement:
      return 'BREAK';
    case NodeType.WaitStatement:
      return 'WAIT';
    default:
      return type;
  }
}

export function detectDeadCode(
  statements: Statement[],
  warnings: SemanticWarning[],
): void {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];

    if (EARLY_EXIT_TYPES.has(stmt.type) && i < statements.length - 1) {
      const exitName = getExitName(stmt.type);
      warnings.push({
        code: 'unreachable-code',
        message: `Unreachable code after ${exitName}`,
        severity: 'warning',
      });
      break;
    }
  }
}
