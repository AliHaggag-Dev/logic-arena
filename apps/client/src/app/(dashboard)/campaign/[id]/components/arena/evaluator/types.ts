import type { Program, Statement } from '@logic-arena/logic-parser';

export interface EvalFrame {
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

export interface EvalAction {
  type: 'fire' | 'move' | 'scan' | 'burst' | 'stop';
  value: number;
  fast?: boolean;
}
