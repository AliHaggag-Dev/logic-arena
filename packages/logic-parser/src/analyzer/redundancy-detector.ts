import {
  Statement,
  NodeType,
  AssignmentStatement,
  Expression,
  CallStatement,
  ReturnStatement,
  ActionStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
} from '../types';
import { SemanticWarning } from './types';

function collectReads(expr: Expression, unread: Map<string, number>): void {
  switch (expr.type) {
    case NodeType.Identifier:
      unread.delete(expr.value);
      break;
    case NodeType.BinaryExpression:
    case NodeType.ComparisonExpression:
      collectReads(expr.left, unread);
      collectReads(expr.right, unread);
      break;
    case NodeType.UnaryExpression:
      collectReads(expr.argument, unread);
      break;
    case NodeType.FunctionCallExpression:
      for (const arg of expr.args) {
        collectReads(arg, unread);
      }
      break;
    case NodeType.IndexExpression:
      collectReads(expr.object, unread);
      collectReads(expr.index, unread);
      break;
    case NodeType.MemberExpression:
      collectReads(expr.object, unread);
      break;
    case NodeType.ArrayLiteral:
      for (const el of expr.elements) {
        collectReads(el, unread);
      }
      break;
    case NodeType.ObjectLiteral:
      for (const prop of expr.properties) {
        collectReads(prop.value, unread);
      }
      break;
    case NodeType.ActionExpression:
      if (expr.args) {
        for (const arg of expr.args) {
          collectReads(arg, unread);
        }
      }
      break;
    default:
      break;
  }
}

function collectReadsFromControlFlow(
  stmt: Statement,
  unread: Map<string, number>,
): void {
  switch (stmt.type) {
    case NodeType.IfStatement: {
      collectReads((stmt as IfStatement).condition, unread);
      break;
    }
    case NodeType.WhileStatement: {
      collectReads((stmt as WhileStatement).condition, unread);
      break;
    }
    case NodeType.ForStatement: {
      collectReads((stmt as ForStatement).start, unread);
      collectReads((stmt as ForStatement).end, unread);
      break;
    }
    default:
      break;
  }
}

function collectReadsFromStatement(
  stmt: Statement,
  unread: Map<string, number>,
): void {
  switch (stmt.type) {
    case NodeType.ActionStatement: {
      const action = (stmt as ActionStatement).consequence;
      if (action.args) {
        for (const arg of action.args) {
          collectReads(arg, unread);
        }
      }
      break;
    }
    case NodeType.CallStatement: {
      const call = stmt as CallStatement;
      if (call.args) {
        for (const arg of call.args) {
          collectReads(arg, unread);
        }
      }
      break;
    }
    case NodeType.ReturnStatement: {
      const ret = stmt as ReturnStatement;
      if (ret.value) {
        collectReads(ret.value, unread);
      }
      break;
    }
    case NodeType.IfStatement:
    case NodeType.WhileStatement:
    case NodeType.ForStatement:
    case NodeType.FunctionDeclaration:
      collectReadsFromControlFlow(stmt, unread);
      break;
    case NodeType.QueryStatement:
      break;
    default:
      break;
  }
}

export function detectRedundantAssignments(
  statements: Statement[],
  warnings: SemanticWarning[],
): void {
  const lastUnreadAssignment = new Map<string, number>();

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];

    if (stmt.type === NodeType.AssignmentStatement) {
      const assignStmt = stmt as AssignmentStatement;
      const varName = assignStmt.name.value;

      if (assignStmt.index !== undefined || assignStmt.property !== undefined) {
        lastUnreadAssignment.delete(varName);
        continue;
      }

      collectReads(assignStmt.value, lastUnreadAssignment);

      if (lastUnreadAssignment.has(varName)) {
        warnings.push({
          code: 'redundant-assignment',
          message: `${varName} assigned but never read before reassignment`,
          severity: 'warning',
        });
      }

      lastUnreadAssignment.set(varName, i);
    } else {
      collectReadsFromStatement(stmt, lastUnreadAssignment);
    }
  }
}
