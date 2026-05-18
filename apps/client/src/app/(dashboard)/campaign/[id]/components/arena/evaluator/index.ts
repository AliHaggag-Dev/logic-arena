import { Parser } from '@logic-arena/logic-parser';
import type { EvalState, EvalAction } from './types';
import { MAX_OPS_PER_TICK } from './constants';
import { executeStatement } from './statements';
import type { ArenaRobot, ArenaProjectile } from '../scenes';

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
    console.error(`[EVAL-INIT] PARSE FAILED:`, err, `script starts: "${script.slice(0, 80)}..."`);
    return null;
  }
}

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

export type { EvalState, EvalAction };
