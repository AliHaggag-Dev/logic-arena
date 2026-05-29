// ─────────────────────────────────────────────────────────────────────────────
// AliScript Diagnostics — Master Vocabulary & Logic Rule Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum Levenshtein distance to suggest a fix for an unknown word. */
export const MAX_LEVENSHTEIN_DISTANCE = 3;

/** Words shorter than this are skipped (user variables like `i`, `x`). */
export const MIN_WORD_LENGTH_FOR_CHECK = 3;

// ── Vocabulary Sets ──────────────────────────────────────────────────────────

export const KEYWORDS = new Set<string>([
  'IF', 'THEN', 'ELSE', 'END',
  'WHILE', 'DO',
  'FOR', 'TO',
  'FUNCTION', 'CALL', 'RETURN',
  'SET',
  'NOT', 'AND', 'OR',
  'TRUE', 'FALSE',
  'WAIT', 'SCAN',
  'BREAK', 'CONTINUE',
]);

export const ACTION_COMMANDS = new Set<string>([
  'FIRE', 'BURST_FIRE',
  'TELEPORT', 'SHIELD', 'CLOAK', 'DASH', 'MINE', 'TAUNT',
  'MOVE', 'MOVE_FAST', 'STOP', 'BACKUP',
  'PATHFIND',
]);

export const QUERY_FUNCTIONS = new Set<string>([
  'GET_HEALTH', 'GET_ENERGY', 'GET_ENERGY_PCT',
  'GET_DISTANCE', 'GET_POSITION', 'GET_ROTATION',
  'GET_FOV_DIR', 'GET_VISIBLE_COUNT',
  'GET_OBSTACLE_DISTANCE', 'GET_OBSTACLE_TYPE',
]);

export const BUILTIN_FUNCTIONS = new Set<string>([
  'ABS', 'SQRT', 'POW', 'SIN', 'COS', 'TAN',
  'ATAN2', 'MIN', 'MAX', 'FLOOR', 'CEIL', 'ROUND',
  'LENGTH', 'PUSH', 'POP', 'RANDOM', 'LOG',
  'GET_ALL_VISIBLE_ENEMIES', 'RAYCAST',
  'BROADCAST', 'RECEIVE',
]);

export const RESERVED_VARIABLES = new Set<string>([
  'MY_ENERGY', 'ENERGY_PCT', 'IN_STASIS',
  'CAN_SEE_ENEMY', 'VISIBLE_ENEMY_COUNT', 'FOV_ANGLE',
  'POSITION_X', 'POSITION_Y',
  'NEAREST_VISIBLE_X', 'NEAREST_VISIBLE_Y',
  'CAN_SEE_OBSTACLE', 'NEAREST_OBSTACLE_TYPE', 'NEAREST_OBSTACLE_DISTANCE',
  'FOV_DIRECTION',
]);

export const SYSTEM_VARIABLES = new Set<string>([
  '_SYS_SPEED_MULT', '_SYS_STRAFE',
  '_SYS_ORBIT_X', '_SYS_ORBIT_Y', '_SYS_ORBIT_R',
  '_SYS_FACE_X', '_SYS_FACE_Y',
  '_SYS_TARGET_X', '_SYS_TARGET_Y', '_SYS_AT_TARGET',
  '_SYS_SCAN_SWEEP_DEG',
]);

/** Lowercase property-style identifiers that are valid in AliScript. */
export const KNOWN_PROPERTIES = new Set<string>([
  'distance', 'health', 'rotation', 'angle', 'rot',
  'target_vx', 'target_vy', 'bullet_speed', 'spotted',
  'energy', 'fovDirection', 'lockVision',
]);

// ── Unified Vocabulary ───────────────────────────────────────────────────────

/** All valid uppercase AliScript identifiers combined into one set. */
export const ALL_VALID_UPPER: Set<string> = new Set<string>([
  ...KEYWORDS,
  ...ACTION_COMMANDS,
  ...QUERY_FUNCTIONS,
  ...BUILTIN_FUNCTIONS,
  ...RESERVED_VARIABLES,
  ...SYSTEM_VARIABLES,
]);

/** Flat array of all valid uppercase identifiers — used for Levenshtein search. */
export const ALL_VALID_UPPER_ARRAY: string[] = [...ALL_VALID_UPPER];

/** Combined set for case-sensitive property names. */
export const ALL_VALID_LOWER: Set<string> = new Set<string>(KNOWN_PROPERTIES);

// ── Logic Rule Constants ─────────────────────────────────────────────────────

export const LOOP_KEYWORDS = new Set<string>(['FOR', 'WHILE']);

export const MOVEMENT_COMMANDS = new Set<string>([
  'MOVE', 'MOVE_FAST', 'STOP', 'BACKUP', 'PATHFIND',
]);

export const BLOCK_OPENERS = new Set<string>([
  'IF', 'WHILE', 'FOR', 'FUNCTION',
]);
