import type {
  Statement,
  ActionStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  AssignmentStatement,
  WaitStatement,
  BreakStatement,
  ContinueStatement,
  ScanStatement,
  Expression,
} from '@logic-arena/logic-parser';
import type { EvalState, EvalAction } from './types';
import type { ArenaRobot, ArenaProjectile } from '../scenes';
import { ENERGY_COST } from './constants';
import { evalExpr, canSeeEnemy } from './gameVars';

export function executeStatement(
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
          const dx = enemy.x - robot.x;
          const dy = enemy.y - robot.y;
          const aimAngle = Math.atan2(dy, dx);
          return { type: 'fire', value: aimAngle, fast: false };
        }
        case 'MOVE':
        case 'MOVE_FAST': {
          if (state.vars['_SYS_TARGET_X'] !== undefined && state.vars['_SYS_TARGET_Y'] !== undefined) {
            const tx = Number(state.vars['_SYS_TARGET_X']) / 800;
            const ty = Number(state.vars['_SYS_TARGET_Y']) / 600;
            const dx = tx - robot.x;
            const dy = ty - robot.y;
            const dist = Math.hypot(dx, dy);
            const RAIL_SNAP = 0.02;

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
            if (d === 'LEFT') { robot.angle = Math.PI; return { type: 'move', value: 0, fast: cmd === 'MOVE_FAST' }; }
            if (d === 'RIGHT') { robot.angle = 0; return { type: 'move', value: 0, fast: cmd === 'MOVE_FAST' }; }
            if (d === 'BACKUP') return { type: 'move', value: -2, fast: cmd === 'MOVE_FAST' };
          }
          return { type: 'move', value: 0, fast: cmd === 'MOVE_FAST' };
        }

        case 'BACKUP':
          return { type: 'move', value: -2, fast: false };
        case 'STOP':
          return { type: 'stop', value: 0 };
        case 'BURST_FIRE': {
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
        state.frames.push({ body: whileStmt.body, pc: 0 });
        state.frames.push({ body: [stmt], pc: 0 });
      }
      return null;
    }

    case 'AssignmentStatement': {
      const assignStmt = stmt as AssignmentStatement;
      const name = assignStmt.name.value;

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
      while (state.frames.length > 0) {
        const f = state.frames[state.frames.length - 1];
        if (f.body.length > 0) {
          const s = f.body[0];
          if (s.type === 'WhileStatement' || s.type === 'ForStatement') {
            state.frames.pop();
            break;
          }
        }
        state.frames.pop();
      }
      return null;

    case 'ContinueStatement':
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
