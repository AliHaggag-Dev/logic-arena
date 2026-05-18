import { SCAN_RANGE, SCAN_FOV, TWO_PI } from './constants';
import type { ArenaRobot } from '../scenes';
import type { Expression } from '@logic-arena/logic-parser';

export function wrapAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= TWO_PI;
  while (a < -Math.PI) a += TWO_PI;
  return a;
}

export function canSeeEnemy(
  vars: Record<string, unknown>,
  self: ArenaRobot,
  enemy: ArenaRobot,
): boolean {
  if (!enemy.isAlive) return false;
  const dx = enemy.x - self.x;
  const dy = enemy.y - self.y;
  const dist = Math.hypot(dx, dy);
  if (dist >= SCAN_RANGE) return false;

  if (Number(vars['_SYS_SCAN_SWEEP_DEG'] ?? 0) >= 360) return true;

  const angle = Math.atan2(dy, dx);
  const diff = wrapAngle(angle - self.angle);
  return Math.abs(diff) < SCAN_FOV;
}

export function evalExpr(
  expr: Expression,
  vars: Record<string, unknown>,
  self: ArenaRobot,
  enemy: ArenaRobot,
): unknown {
  switch (expr.type) {
    case 'Identifier': {
      const name = expr.value;
      if (name === 'MY_ENERGY') return self.energy;
      if (name === 'ENERGY_PCT') return (self.energy / self.maxEnergy) * 100;
      if (name === 'IN_STASIS') return self.energy <= 0;
      if (name === 'CAN_SEE_ENEMY' || name === 'spotted' || name === 'VISIBLE_ENEMY_COUNT') {
        return canSeeEnemy(vars, self, enemy) ? 1 : 0;
      }
      if (name === 'health') return self.health;
      if (name === 'rotation' || name === 'angle' || name === 'rot') return self.angle;
      if (name === 'fovDirection') return self.angle;
      if (name === 'lockVision') return true;
      if (name === 'POSITION_X') return self.x * 800;
      if (name === 'POSITION_Y') return self.y * 600;
      if (name === 'NEAREST_VISIBLE_X') {
        const _inRange = enemy.isAlive && Math.hypot(enemy.x - self.x, enemy.y - self.y) < SCAN_RANGE;
        return _inRange ? enemy.x * 800 : 0;
      }
      if (name === 'NEAREST_VISIBLE_Y') {
        const _inRange = enemy.isAlive && Math.hypot(enemy.x - self.x, enemy.y - self.y) < SCAN_RANGE;
        return _inRange ? enemy.y * 600 : 0;
      }
      if (name === 'distance') { const _dx = enemy.x - self.x; const _dy = enemy.y - self.y; return Math.hypot(_dx, _dy) * 800; }
      if (name in vars) return vars[name];
      return 0;
    }
    case 'NumberLiteral': return expr.value;
    case 'StringLiteral': return expr.value;
    case 'BooleanLiteral': return expr.value;
    case 'BinaryExpression': {
      const l = Number(evalExpr(expr.left, vars, self, enemy));
      const r = Number(evalExpr(expr.right, vars, self, enemy));
      switch (expr.operator) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return r !== 0 ? l / r : 0;
        case '%': return l % r;
        default: return 0;
      }
    }
    case 'UnaryExpression': {
      const a = evalExpr(expr.argument, vars, self, enemy);
      if (expr.operator === 'NOT' || expr.operator === '!') return !a;
      return expr.operator === '-' ? -Number(a) : Number(a);
    }
    case 'ComparisonExpression': {
      const l = evalExpr(expr.left, vars, self, enemy);
      const r = evalExpr(expr.right, vars, self, enemy);
      switch (expr.operator) {
        case '==': return l === r;
        case '!=': return l !== r;
        case '>': return Number(l) > Number(r);
        case '<': return Number(l) < Number(r);
        case '>=': return Number(l) >= Number(r);
        case '<=': return Number(l) <= Number(r);
        default: return false;
      }
    }
    case 'ArrayLiteral':
      return expr.elements.map((e) => evalExpr(e, vars, self, enemy));
    case 'ObjectLiteral': {
      const obj: Record<string, unknown> = {};
      for (const prop of expr.properties) {
        obj[prop.key] = evalExpr(prop.value, vars, self, enemy);
      }
      return obj;
    }
    case 'IndexExpression': {
      const obj = evalExpr(expr.object, vars, self, enemy);
      const idx = evalExpr(expr.index, vars, self, enemy);
      if (typeof obj === 'object' && obj !== null) {
        return (obj as Record<string, unknown>)[String(idx)];
      }
      return 0;
    }
    case 'MemberExpression': {
      const obj = evalExpr(expr.object, vars, self, enemy);
      if (typeof obj === 'object' && obj !== null) {
        return (obj as Record<string, unknown>)[expr.property];
      }
      return 0;
    }
    case 'FunctionCallExpression': {
      const args = expr.args.map((a) => evalExpr(a, vars, self, enemy));
      switch (expr.name) {
        case 'ABS': return Math.abs(Number(args[0]));
        case 'SQRT': return Math.sqrt(Math.max(0, Number(args[0])));
        case 'SIN': return Math.sin(Number(args[0]));
        case 'COS': return Math.cos(Number(args[0]));
        case 'ATAN2': return Math.atan2(Number(args[0]), Number(args[1]));
        case 'MIN': return Math.min(Number(args[0]), Number(args[1]));
        case 'MAX': return Math.max(Number(args[0]), Number(args[1]));
        case 'FLOOR': return Math.floor(Number(args[0]));
        case 'CEIL': return Math.ceil(Number(args[0]));
        case 'ROUND': return Math.round(Number(args[0]));
        case 'RANDOM': return Math.random();
        case 'LENGTH':
          if (Array.isArray(args[0])) return args[0].length;
          if (typeof args[0] === 'object') return Object.keys(args[0] as object).length;
          return String(args[0]).length;
        case 'GET_ALL_VISIBLE_ENEMIES': {
          const dx = enemy.x - self.x;
          const dy = enemy.y - self.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const visible = canSeeEnemy(vars, self, enemy);
          if (visible && enemy.isAlive) {
            return [[dist, enemy.x, enemy.y, enemy.health]];
          }
          return [-1];
        }
        case 'RAYCAST': {
          const dx = enemy.x - self.x;
          const dy = enemy.y - self.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const visible = canSeeEnemy(vars, self, enemy);
          if (visible && enemy.isAlive) return dist;
          return 0;
        }
        default: return 0;
      }
    }
    default: return 0;
  }
}
