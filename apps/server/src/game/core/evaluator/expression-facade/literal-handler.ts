import {
  assertAliScriptCollectionSize,
  createAliScriptDictionary,
  safeSetAliScriptProperty,
} from '@logic-arena/engine';
import {
  ArrayLiteral,
  Expression,
  NodeType,
  ObjectLiteral,
} from '../../../../../../../packages/logic-parser/src';

export function evaluateLiteral(
  expression: Expression,
  evaluateExpr: (expr: Expression) => unknown,
): unknown {
  if (expression.type === NodeType.ArrayLiteral) {
    return evaluateArrayLiteral(expression, evaluateExpr);
  }
  if (expression.type === NodeType.ObjectLiteral) {
    return evaluateObjectLiteral(expression, evaluateExpr);
  }
  return undefined;
}

function evaluateArrayLiteral(
  arrLit: ArrayLiteral,
  evaluateExpr: (expr: Expression) => unknown,
): unknown[] {
  assertAliScriptCollectionSize(arrLit.elements.length);
  return arrLit.elements.map((el) => evaluateExpr(el));
}

function evaluateObjectLiteral(
  objLit: ObjectLiteral,
  evaluateExpr: (expr: Expression) => unknown,
): Record<string, unknown> {
  assertAliScriptCollectionSize(objLit.properties.length);
  const result: Record<string, unknown> = createAliScriptDictionary();
  for (const prop of objLit.properties) {
    safeSetAliScriptProperty(result, prop.key, evaluateExpr(prop.value));
  }
  return result;
}
