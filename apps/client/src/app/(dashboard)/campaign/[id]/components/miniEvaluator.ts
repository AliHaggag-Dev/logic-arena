// ─────────────────────────────────────────────────────────────────────────────
// Mini Evaluator — browser-based AliScript AST interpreter.
//
// Walks the output of @logic-arena/logic-parser to execute script commands
// on ArenaRobot instances in the 2D preview canvas. Designed to be called
// once per tick from the render loop.
//
// Limitations vs the real server evaluator:
//   • Simplified SCAN (distance + angle check, no FOV cone)
//   • No PATHFIND or CALL/BROADCAST/RECEIVE
//   • Max 20 ops/tick guard
// ─────────────────────────────────────────────────────────────────────────────
import { Parser } from '@logic-arena/logic-parser';
import type {
  Program,
  Statement,
  Expression,
  IfStatement,
  WhileStatement,
  ForStatement,
  AssignmentStatement,
  ActionStatement,
  WaitStatement,
  ScanStatement,
  BreakStatement,
  ContinueStatement,
} from '@logic-arena/logic-parser';
import type { ArenaRobot, ArenaProjectile } from './arenaScenes';

// ── Constants ───────────────────────────────────────────────────────────────

const ENERGY_COST: Record<string, number> = {
  FIRE: 8,
  MOVE: 2,
  MOVE_FAST: 4,
  BACKUP: 2,
  SCAN: 3,
  STOP: 0,
  BURST_FIRE: 18,
};

const SCAN_RANGE = 0.55;
const SCAN_FOV = 1.8;
const MAX_OPS_PER_TICK = 20;
const TWO_PI = Math.PI * 2;

function wrapAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= TWO_PI;
  while (a < -Math.PI) a += TWO_PI;
  return a;
}

function canSeeEnemy(
  vars: Record<string, unknown>,
  self: ArenaRobot,
  enemy: ArenaRobot,
): boolean {
  if (!enemy.isAlive) return false;
  const dx = enemy.x - self.x;
  const dy = enemy.y - self.y;
  const dist = Math.hypot(dx, dy);
  if (dist >= SCAN_RANGE) return false;

  // Internal campaign scripts can request a 360° system scan. This is not a
  // user-facing command; it lets mission robots scan around a graph node while
  // still using normal AliScript control flow.
  if (Number(vars['_SYS_SCAN_SWEEP_DEG'] ?? 0) >= 360) return true;

  const angle = Math.atan2(dy, dx);
  const diff = wrapAngle(angle - self.angle);
  return Math.abs(diff) < SCAN_FOV;
}

// ── Eval Context ────────────────────────────────────────────────────────────

interface EvalFrame {
  body: Statement[];
  pc: number;
}

export interface EvalState {
  ast: Program;
  vars: Record<string, unknown>;
  frames: EvalFrame[];
  waitRemaining: number;
  done: boolean;
}

// ── Parsing ─────────────────────────────────────────────────────────────────

export function createEvalState(script: string): EvalState | null {
  try {
    const parser = new Parser(script);
    const ast = parser.parse();
    return {
      ast,
      vars: {},
      frames: [{ body: ast.body, pc: 0 }],
      waitRemaining: 0,
      done: false,
    };
  } catch (err) {
    console.error(`[EVAL-INIT] ❌ PARSE FAILED:`, err, `script starts: "${script.slice(0, 80)}..."`);
    return null;
  }
}

// ── Expression evaluation ───────────────────────────────────────────────────

function evalExpr(
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

// ── Tick evaluation ─────────────────────────────────────────────────────────

export interface EvalAction {
  type: 'fire' | 'move' | 'scan' | 'burst' | 'stop';
  /** For fire/burst: angle to shoot. For move: -1=left, 0=none, 1=right */
  value: number;
  /** Speed multiplier for move */
  fast?: boolean;
}

/**
 * Tick the evaluator for one robot. Returns an action to execute or null.
 * Modifies `state` and `robot` in place (deducts energy, sets wait ticks).
 */
export function tickEvaluator(
  state: EvalState,
  robot: ArenaRobot,
  enemy: ArenaRobot,
  projectiles: ArenaProjectile[],
  nextProjId: { current: number },
): EvalAction | null {
  if (state.done) return null;

  if (state.waitRemaining > 0) {
    state.waitRemaining--;
    return null;
  }

  let ops = 0;
  let result: EvalAction | null = null;

  while (ops < MAX_OPS_PER_TICK && result === null) {
    // Auto-restart when program finishes (continuous loop)
    if (state.frames.length === 0) {
      state.frames = [{ body: state.ast.body, pc: 0 }];
      state.waitRemaining = 0;
    }

    const frame = state.frames[state.frames.length - 1];
    if (frame.pc >= frame.body.length) {
      state.frames.pop();
      continue;
    }

    const stmt = frame.body[frame.pc];
    frame.pc++;
    ops++;

    const action = executeStatement(stmt, state, robot, enemy, projectiles, nextProjId);
    if (action) {
      result = action;
    }
  }

  return result;
}

function executeStatement(
  stmt: Statement,
  state: EvalState,
  robot: ArenaRobot,
  enemy: ArenaRobot,
  projectiles: ArenaProjectile[],
  nextProjId: { current: number },
): EvalAction | null {
  switch (stmt.type) {
    case 'ActionStatement': {
      const action = stmt as ActionStatement;
      const cmd = action.consequence.command.toUpperCase();
      const cost = ENERGY_COST[cmd] ?? 0;
      if (robot.energy < cost) return null;
      robot.energy -= cost;

      switch (cmd) {
        case 'FIRE': {
          // Aim directly at the foe — compute angle to target
          const dx = enemy.x - robot.x;
          const dy = enemy.y - robot.y;
          const aimAngle = Math.atan2(dy, dx);
          return { type: 'fire', value: aimAngle, fast: false };
        }
        case 'MOVE':
        case 'MOVE_FAST': {
          // --- SECRET RAIL SYSTEM FOR CAMPAIGN ROBOT ---
          // _SYS_TARGET_X/Y are in pixel space (0-800, 0-600)
          // robot.x/y are in normalized space (0-1), so we divide
          if (state.vars['_SYS_TARGET_X'] !== undefined && state.vars['_SYS_TARGET_Y'] !== undefined) {
            const tx = Number(state.vars['_SYS_TARGET_X']) / 800;
            const ty = Number(state.vars['_SYS_TARGET_Y']) / 600;
            const dx = tx - robot.x;
            const dy = ty - robot.y;
            const dist = Math.hypot(dx, dy);
            const RAIL_SNAP = 0.02; // ~16px in normalized space — forgiving enough to snap reliably

            if (dist < RAIL_SNAP) {
              robot.x = tx;
              robot.y = ty;
              state.vars['_SYS_AT_TARGET'] = 1;
              return { type: 'stop', value: 0 };
            } else {
              robot.angle = Math.atan2(dy, dx);
              state.vars['_SYS_AT_TARGET'] = 0;
              return { type: 'move', fast: cmd === 'MOVE_FAST', value: 0 };
            }
          }

          const dir = action.consequence.args?.[0];
          if (dir && 'value' in dir) {
            const d = String(dir.value).toUpperCase();
            if (d === 'LEFT') return { type: 'move', value: -1, fast: cmd === 'MOVE_FAST' };
            if (d === 'RIGHT') return { type: 'move', value: 1, fast: cmd === 'MOVE_FAST' };
            if (d === 'BACKUP') return { type: 'move', value: -2, fast: cmd === 'MOVE_FAST' };
          }
          return { type: 'move', value: 0, fast: cmd === 'MOVE_FAST' }; // FORWARD default
        }

        case 'BACKUP':
          return { type: 'move', value: -1, fast: false };
        case 'STOP':
          return { type: 'stop', value: 0 };
        case 'BURST_FIRE': {
          // Aim directly at the foe
          const bx = enemy.x - robot.x;
          const by = enemy.y - robot.y;
          return { type: 'burst', value: Math.atan2(by, bx) };
        }
        case 'SCAN': {
          const dx = enemy.x - robot.x;
          const dy = enemy.y - robot.y;
          const angle = Math.atan2(dy, dx);
          if (Number(state.vars['_SYS_SCAN_SWEEP_DEG'] ?? 0) >= 360) robot.angle = angle;
          const visible = canSeeEnemy(state.vars, robot, enemy);
          const lastScan = visible ? 1 : 0;
          const lastVar = findLastScanVar(state);
          if (lastVar) state.vars[lastVar] = lastScan;
          return { type: 'scan', value: lastScan };
        }
        default:
          return null;
      }
    }

    case 'ScanStatement': {
      const cost = ENERGY_COST['SCAN'] ?? 0;
      if (robot.energy < cost) return null;
      robot.energy -= cost;
      const dx = enemy.x - robot.x;
      const dy = enemy.y - robot.y;
      const angle = Math.atan2(dy, dx);
      if (Number(state.vars['_SYS_SCAN_SWEEP_DEG'] ?? 0) >= 360) robot.angle = angle;
      const visible = canSeeEnemy(state.vars, robot, enemy);
      const resultVar = findLastScanVar(state);
      if (resultVar) state.vars[resultVar] = visible ? 1 : 0;
      return { type: 'scan', value: visible ? 1 : 0 };
    }

    case 'IfStatement': {
      const ifStmt = stmt as IfStatement;
      const cond = evalExpr(ifStmt.condition, state.vars, robot, enemy);
      if (cond) {
        state.frames.push({ body: ifStmt.consequence, pc: 0 });
      } else if (ifStmt.alternate) {
        state.frames.push({ body: ifStmt.alternate, pc: 0 });
      }
      return null;
    }

    case 'WhileStatement': {
      const whileStmt = stmt as WhileStatement;
      const cond = evalExpr(whileStmt.condition, state.vars, robot, enemy);
      if (cond) {
        // Push the while body, then re-push the while statement itself
        state.frames.push({ body: whileStmt.body, pc: 0 });
        state.frames.push({ body: [stmt], pc: 0 });
      }
      return null;
    }

    case 'AssignmentStatement': {
      const assignStmt = stmt as AssignmentStatement;
      const name = assignStmt.name.value;

      // Handle SET x = SCAN as a special case
      if (
        assignStmt.value &&
        'type' in assignStmt.value &&
        (assignStmt.value as any).type === 'ScanStatement'
      ) {
        const cost = ENERGY_COST['SCAN'] ?? 0;
        if (robot.energy < cost) return null;
        robot.energy -= cost;
        const dx = enemy.x - robot.x;
        const dy = enemy.y - robot.y;
        const angle = Math.atan2(dy, dx);
        if (Number(state.vars['_SYS_SCAN_SWEEP_DEG'] ?? 0) >= 360) robot.angle = angle;
        const visible = canSeeEnemy(state.vars, robot, enemy);
        state.vars[name] = visible ? 1 : 0;
        return { type: 'scan', value: visible ? 1 : 0 };
      }

      // Handle SET x = RAYCAST()
      if (
        assignStmt.value &&
        'type' in assignStmt.value &&
        (assignStmt.value as any).type === 'FunctionCallExpression' &&
        (assignStmt.value as any).name === 'RAYCAST'
      ) {
        const dx = enemy.x - robot.x;
        const dy = enemy.y - robot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        if (Number(state.vars['_SYS_SCAN_SWEEP_DEG'] ?? 0) >= 360) robot.angle = angle;
        const visible = canSeeEnemy(state.vars, robot, enemy);
        state.vars[name] = visible && enemy.isAlive ? dist : 0;
        return null;
      }

      // Normal assignment
      const value = evalExpr(assignStmt.value as Expression, state.vars, robot, enemy);

      if (assignStmt.index) {
        const idx = evalExpr(assignStmt.index, state.vars, robot, enemy);
        const obj = state.vars[name];
        if (Array.isArray(obj) && typeof idx === 'number') {
          obj[idx] = value;
        } else if (typeof obj === 'object' && obj !== null) {
          (obj as Record<string, unknown>)[String(idx)] = value;
        }
      } else if (assignStmt.property) {
        const obj = state.vars[name];
        if (typeof obj === 'object' && obj !== null) {
          (obj as Record<string, unknown>)[assignStmt.property] = value;
        }
      } else if (name === 'rotation' || name === 'angle' || name === 'rot') {
        robot.angle = Number(value);
      } else {
        state.vars[name] = value;
      }
      return null;
    }

    case 'WaitStatement': {
      const waitStmt = stmt as WaitStatement;
      state.waitRemaining = waitStmt.ticks.value;
      return null;
    }

    case 'BreakStatement':
      // Pop frames until we find a While/For
      while (state.frames.length > 0) {
        const f = state.frames[state.frames.length - 1];
        if (f.body.length > 0) {
          const s = f.body[0];
          if (s.type === 'WhileStatement' || s.type === 'ForStatement') {
            state.frames.pop(); // pop the loop restatement
            break;
          }
        }
        state.frames.pop();
      }
      return null;

    case 'ContinueStatement':
      // Pop just the while body, leave the restatement
      if (state.frames.length >= 2) {
        state.frames.splice(state.frames.length - 2, 1);
      }
      return null;

    default:
      return null;
  }
}

function findLastScanVar(state: EvalState): string | null {
  const frame = state.frames[state.frames.length - 1];
  if (!frame || frame.pc < 2) return null;
  const prevStmt = frame.body[frame.pc - 2];
  if (prevStmt && prevStmt.type === 'AssignmentStatement') {
    const assign = prevStmt as AssignmentStatement;
    if (assign.name) return assign.name.value;
  }
  return null;
}
