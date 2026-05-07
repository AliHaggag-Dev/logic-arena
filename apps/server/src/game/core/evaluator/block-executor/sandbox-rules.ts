import { NodeType } from '@logic-arena/logic-parser';

// ── Sandbox: allowed AST node types ─────────────────────────────────────────
export const ALLOWED_NODE_TYPES = new Set<string>([
  NodeType.AssignmentStatement,
  NodeType.IfStatement,
  NodeType.WhileStatement,
  NodeType.ForStatement,
  NodeType.ActionStatement,
  NodeType.CallStatement,
  NodeType.WaitStatement,
  NodeType.ScanStatement,
  NodeType.FunctionDeclaration,
  NodeType.QueryStatement,
  NodeType.BreakStatement,
  NodeType.ContinueStatement,
  NodeType.ReturnStatement,
]);

// ── Sandbox: allowed action command strings ─────────────────────────────────
export const ALLOWED_ACTION_COMMANDS = new Set<string>([
  'MOVE',
  'MOVE_FAST',
  'BACKUP',
  'STOP',
  'PATHFIND',
  'WAIT',
  'SCAN',
  'FIRE',
  'BURST_FIRE',
]);

// ── Commands blocked during STASIS (user's script can still read IN_STASIS and branch)
// STOP and WAIT are intentionally excluded — they cost 0 energy and don't move the robot.
export const STASIS_BLOCKED_ACTION_CMDS = new Set<string>([
  'MOVE',
  'MOVE_FAST',
  'BACKUP',
  'PATHFIND',
  'FIRE',
  'BURST_FIRE',
]);
