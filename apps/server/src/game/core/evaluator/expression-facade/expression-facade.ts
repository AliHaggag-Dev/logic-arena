import {
  Obstacle,
  Robot,
  enforceAliScriptStringLimit,
} from '@logic-arena/engine';
import {
  Expression,
  NodeType,
  StringLiteral,
} from '../../../../../../../packages/logic-parser/src';
import {
  evaluateBinary,
  evaluateUnary,
  evaluateComparison,
} from '../operator-handlers';
import { evaluateLiteral } from './literal-handler';
import { evaluateAccess } from './access-handler';
import { evaluateCall } from './call-handler';

const MAX_EVAL_DEPTH = 64;

export class ExpressionEvaluator {
  evaluateCondition(
    robot: Robot,
    expression: Expression,
    memory: Record<string, unknown>,
    getRobots: () => Robot[],
    getObstacles: () => Obstacle[],
  ): boolean {
    const value = this.evaluateExpression(
      robot,
      expression,
      memory,
      getRobots,
      getObstacles,
    );
    return typeof value === 'boolean' ? value : Boolean(value);
  }

  evaluateExpression(
    robot: Robot,
    expression: Expression,
    memory: Record<string, unknown>,
    getRobots: () => Robot[],
    getObstacles: () => Obstacle[],
    depth: number = 0,
  ): unknown {
    if (depth > MAX_EVAL_DEPTH) return undefined;

    const evaluateExpr = (expr: Expression) =>
      this.evaluateExpression(
        robot,
        expr,
        memory,
        getRobots,
        getObstacles,
        depth + 1,
      );

    switch (expression.type) {
      case NodeType.NumberLiteral:
      case NodeType.BooleanLiteral:
        return expression.value;

      case NodeType.StringLiteral:
        return enforceAliScriptStringLimit(String(expression.value));

      case NodeType.ArrayLiteral:
      case NodeType.ObjectLiteral:
        return evaluateLiteral(expression, evaluateExpr);

      case NodeType.Identifier:
      case NodeType.IndexExpression:
      case NodeType.MemberExpression:
        return evaluateAccess(
          robot,
          expression,
          evaluateExpr,
          memory,
          getRobots,
          getObstacles,
        );

      case NodeType.BinaryExpression: {
        const left = evaluateExpr(expression.left);
        const right = evaluateExpr(expression.right);
        return evaluateBinary(left, right, expression.operator);
      }

      case NodeType.UnaryExpression: {
        const arg = evaluateExpr(expression.argument);
        return evaluateUnary(arg, expression.operator);
      }

      case NodeType.ComparisonExpression: {
        const lv = evaluateExpr(expression.left);
        const rv = evaluateExpr(expression.right);
        return evaluateComparison(lv, rv, expression.operator);
      }

      case NodeType.FunctionCallExpression:
        return evaluateCall(
          robot,
          expression,
          evaluateExpr,
          memory,
          getRobots,
          getObstacles,
        );

      default:
        return undefined;
    }
  }
}
