import { Robot } from '@logic-arena/engine';
import {
  Expression, NodeType, Identifier, NumberLiteral, StringLiteral,
  FunctionCallExpression, ArrayLiteral, IndexExpression,
} from '../../../../../../packages/logic-parser/src';
import { resolveIdentifier } from './identifier-resolver';
import { evaluateBinary, evaluateUnary, evaluateComparison } from './operator-handlers';

/** Maximum depth for recursive expression evaluation to prevent stack overflow. */
const MAX_EVAL_DEPTH = 64;

export class ExpressionEvaluator {
  evaluateCondition(
    robot: Robot,
    expression: Expression,
    memory: Record<string, unknown>,
    getRobots: () => Robot[],
  ): boolean {
    const value = this.evaluateExpression(robot, expression, memory, getRobots);
    return typeof value === 'boolean' ? value : Boolean(value);
  }

  evaluateExpression(
    robot: Robot,
    expression: Expression,
    memory: Record<string, unknown>,
    getRobots: () => Robot[],
    depth: number = 0,
  ): unknown {
    if (depth > MAX_EVAL_DEPTH) return undefined;

    switch (expression.type) {
      case NodeType.NumberLiteral:
      case NodeType.StringLiteral:
      case NodeType.BooleanLiteral:
        return expression.value;

      case NodeType.Identifier:
        return resolveIdentifier(robot, expression as Identifier | NumberLiteral | StringLiteral, memory);

      case NodeType.BinaryExpression: {
        const left = this.evaluateExpression(robot, expression.left, memory, getRobots, depth + 1);
        const right = this.evaluateExpression(robot, expression.right, memory, getRobots, depth + 1);
        return evaluateBinary(left, right, expression.operator);
      }

      case NodeType.UnaryExpression: {
        const arg = this.evaluateExpression(robot, expression.argument, memory, getRobots, depth + 1);
        return evaluateUnary(arg, expression.operator);
      }

      case NodeType.ComparisonExpression: {
        const lv = this.evaluateExpression(robot, expression.left, memory, getRobots, depth + 1);
        const rv = this.evaluateExpression(robot, expression.right, memory, getRobots, depth + 1);
        return evaluateComparison(lv, rv, expression.operator);
      }

      // ── Built-in function calls: ABS(x), SQRT(x), ATAN2(y, x), etc. ────
      case NodeType.FunctionCallExpression: {
        const fnCall = expression as FunctionCallExpression;
        const evaluatedArgs = fnCall.args.map(
          a => this.evaluateExpression(robot, a, memory, getRobots, depth + 1),
        );
        return this.evaluateBuiltinFunction(fnCall.name, evaluatedArgs, memory);
      }

      // ── Array literal: [1, 2, 3] ──────────────────────────────────────────
      case NodeType.ArrayLiteral: {
        const arrLit = expression as ArrayLiteral;
        return arrLit.elements.map(
          el => this.evaluateExpression(robot, el, memory, getRobots, depth + 1),
        );
      }

      // ── Index access: arr[0] ──────────────────────────────────────────────
      case NodeType.IndexExpression: {
        const idxExpr = expression as IndexExpression;
        const obj = this.evaluateExpression(robot, idxExpr.object, memory, getRobots, depth + 1);
        const idx = this.evaluateExpression(robot, idxExpr.index, memory, getRobots, depth + 1);
        if (Array.isArray(obj) && typeof idx === 'number') {
          const i = Math.floor(idx);
          if (i >= 0 && i < obj.length) return obj[i];
          return undefined;
        }
        return undefined;
      }

      default:
        return undefined;
    }
  }

  // ── Built-in math & utility function dispatcher ──────────────────────────
  private evaluateBuiltinFunction(
    name: string,
    args: unknown[],
    memory: Record<string, unknown>,
  ): unknown {
    const a = args[0] as number;
    const b = args[1] as number;

    switch (name) {
      // ── Single-arg math ────────────────────────────────────────────────
      case 'ABS':    return typeof a === 'number' ? Math.abs(a) : 0;
      case 'SQRT':   return typeof a === 'number' ? Math.sqrt(Math.max(0, a)) : 0;
      case 'SIN':    return typeof a === 'number' ? Math.sin(a) : 0;
      case 'COS':    return typeof a === 'number' ? Math.cos(a) : 0;
      case 'TAN':    return typeof a === 'number' ? Math.tan(a) : 0;
      case 'FLOOR':  return typeof a === 'number' ? Math.floor(a) : 0;
      case 'CEIL':   return typeof a === 'number' ? Math.ceil(a) : 0;
      case 'ROUND':  return typeof a === 'number' ? Math.round(a) : 0;
      case 'LOG':    return typeof a === 'number' && a > 0 ? Math.log(a) : 0;

      // ── Two-arg math ───────────────────────────────────────────────────
      case 'POW':    return typeof a === 'number' && typeof b === 'number' ? Math.pow(a, b) : 0;
      case 'ATAN2':  return typeof a === 'number' && typeof b === 'number' ? Math.atan2(a, b) : 0;
      case 'MIN':    return typeof a === 'number' && typeof b === 'number' ? Math.min(a, b) : 0;
      case 'MAX':    return typeof a === 'number' && typeof b === 'number' ? Math.max(a, b) : 0;

      // ── Zero-arg ───────────────────────────────────────────────────────
      case 'RANDOM': return Math.random();

      // ── Array operations ───────────────────────────────────────────────
      case 'LENGTH': {
        if (Array.isArray(a)) return a.length;
        const strCheck: unknown = a;
        if (typeof strCheck === 'string') return strCheck.length;
        return 0;
      }

      case 'PUSH': {
        // PUSH(arrayName, value) — first arg must be a string referencing the array variable name
        // But in expression context we receive evaluated values.
        // We handle PUSH/POP as side-effect functions in block-executor instead.
        // For expression-level, PUSH returns the new length.
        if (Array.isArray(a)) {
          a.push(b);
          return a.length;
        }
        return 0;
      }

      case 'POP': {
        if (Array.isArray(a) && a.length > 0) {
          return a.pop();
        }
        return undefined;
      }

      default:
        return undefined;
    }
  }
}
