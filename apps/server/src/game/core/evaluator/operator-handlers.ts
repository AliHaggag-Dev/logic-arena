import { enforceAliScriptStringLimit } from '@logic-arena/engine';

export function evaluateBinary(
  left: unknown,
  right: unknown,
  operator: string,
): unknown {
  // Logical operators — must come BEFORE the numeric type guard (operands are booleans)
  if (operator === 'AND') return Boolean(left) && Boolean(right);
  if (operator === 'OR') return Boolean(left) || Boolean(right);

  if (
    operator === '+' &&
    (typeof left === 'string' || typeof right === 'string')
  ) {
    return enforceAliScriptStringLimit(
      String(left ?? '') + String(right ?? ''),
    );
  }

  // Arithmetic operators require numbers
  if (typeof left !== 'number' || typeof right !== 'number') return undefined;
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return right !== 0 ? left / right : 0;
    case '%':
      return right !== 0 ? left % right : 0;
  }
  return undefined;
}

export function evaluateUnary(arg: unknown, operator: string): unknown {
  if (operator === 'NOT') return !arg;
  if (operator === '-') return -(arg as number);
  return undefined;
}

export function evaluateComparison(
  lv: unknown,
  rv: unknown,
  operator: string,
): boolean {
  switch (operator) {
    case '<':
      return (lv as number) < (rv as number);
    case '>':
      return (lv as number) > (rv as number);
    case '<=':
      return (lv as number) <= (rv as number);
    case '>=':
      return (lv as number) >= (rv as number);
    case '==':
      return lv === rv;
    case '!=':
      return lv !== rv;
    default:
      return false;
  }
}
