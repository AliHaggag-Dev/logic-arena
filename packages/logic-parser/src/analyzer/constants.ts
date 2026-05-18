import { NodeType } from '../types';

export const MOVEMENT_STATE = new Set(['STOP', 'MOVE', 'MOVE_FAST', 'BACKUP']);
export const MOVEMENT_EVENT = new Set(['PATHFIND']);
export const CANCELS_MOVEMENT = new Set([...MOVEMENT_STATE]);
export const EARLY_EXIT_TYPES = new Set([
  NodeType.ReturnStatement,
  NodeType.BreakStatement,
  NodeType.WaitStatement,
]);
