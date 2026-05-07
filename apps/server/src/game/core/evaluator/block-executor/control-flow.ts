/** Sentinel symbols for block-level control flow signals. */
export const BREAK_SIGNAL = Symbol('BREAK');
export const CONTINUE_SIGNAL = Symbol('CONTINUE');
export const RETURN_SIGNAL = Symbol('RETURN');

export type BlockSignal =
  | typeof BREAK_SIGNAL
  | typeof CONTINUE_SIGNAL
  | typeof RETURN_SIGNAL;

/** Result of executing a block — carries control flow signals up the stack. */
export interface BlockResult {
  signal?: BlockSignal;
  returnValue?: unknown;
}
