export type BlockCategory = "ACTIONS" | "LOGIC" | "VARIABLES" | "DATA" | "SENSORS";

export type BlockType =
  | "MOVE"
  | "MOVE_FAST"
  | "BACKUP"
  | "FIRE"
  | "BURST_FIRE"
  | "SCAN"
  | "PATHFIND"
  | "STOP"
  | "WAIT"
  | "IF_THEN"
  | "IF_THEN_ELSE"
  | "WHILE_DO"
  | "FOR_LOOP"
  | "FUNCTION_DEF"
  | "CALL_FUNCTION"
  | "SET_VAR"
  | "UPDATE_VAR"
  | "CREATE_ARRAY"
  | "CREATE_DICT"
  | "ARRAY_PUSH"
  | "ARRAY_POP"
  | "DICT_SET"
  | "QUERY_SENSOR"
  | "SET_FUNCTION";

export type BlockInputs = Record<string, string | number | boolean>;

export interface BlockNode {
  id: string;
  type: BlockType;
  inputs: BlockInputs;
  children?: BlockNode[];
  elseChildren?: BlockNode[];
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  category: BlockCategory;
  colorVar: string;
  defaultInputs: BlockInputs;
  childSlots?: "then" | "thenElse" | "loop";
}

export interface BlockCategoryDefinition {
  id: BlockCategory;
  label: string;
  colorVar: string;
}

export const BLOCK_CATEGORIES: BlockCategoryDefinition[] = [
  { id: "ACTIONS", label: "Actions", colorVar: "var(--arena-cyan)" },
  { id: "LOGIC", label: "Logic", colorVar: "rgb(var(--arena-purple-rgb))" },
  { id: "VARIABLES", label: "Variables", colorVar: "var(--arena-amber)" },
  { id: "DATA", label: "Data", colorVar: "var(--arena-stasis)" },
  { id: "SENSORS", label: "Sensors", colorVar: "var(--arena-green)" },
];

export const ACTION_OPTIONS: string[] = [
  "MOVE",
  "MOVE_FAST",
  "BACKUP",
  "FIRE",
  "BURST_FIRE",
  "SCAN",
  "PATHFIND",
  "STOP",
];

export const WRITABLE_IDENTIFIERS: string[] = [
  "rotation",
  "fovDirection",
  "lockVision",
  "_SYS_SPEED_MULT",
  "_SYS_STRAFE",
  "_SYS_ORBIT_X",
  "_SYS_ORBIT_Y",
  "_SYS_ORBIT_R",
  "_SYS_FACE_X",
  "_SYS_FACE_Y",
  "_SYS_SCAN_SWEEP_DEG",
  "state",
  "mode",
  "target",
  "i",
  "count",
  "distance",
  "aim",
  "enemies",
  "messages",
];

export const EXPRESSION_OPTIONS: string[] = [
  "0",
  "1",
  "TRUE",
  "FALSE",
  "rotation + 0.1",
  "rotation - 0.1",
  "ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)",
  "MY_ENERGY",
  "ENERGY_PCT",
  "health",
  "distance",
  "VISIBLE_ENEMY_COUNT",
  "GET_ALL_VISIBLE_ENEMIES()",
  "RECEIVE()",
  "RANDOM()",
  "LENGTH(enemies)",
  "POP(queue)",
];

export const CONDITION_OPTIONS: string[] = [
  "CAN_SEE_ENEMY",
  "NOT CAN_SEE_ENEMY",
  "VISIBLE_ENEMY_COUNT > 0",
  "CAN_SEE_OBSTACLE",
  "health < 50",
  "MY_ENERGY > 30",
  "ENERGY_PCT < 50",
  "IN_STASIS",
  "distance < 200",
  "i < count",
  "TRUE",
];

export const FUNCTION_OPTIONS: string[] = [
  "ABS(x)",
  "SQRT(x)",
  "POW(base, exp)",
  "SIN(rotation)",
  "COS(rotation)",
  "TAN(rotation)",
  "ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)",
  "MIN(distance, 200)",
  "MAX(MY_ENERGY, 0)",
  "FLOOR(value)",
  "CEIL(value)",
  "ROUND(health)",
  "LOG(MY_ENERGY)",
  "RANDOM()",
  "LENGTH(enemies)",
  "PUSH(queue, NEAREST_VISIBLE_X)",
  "POP(queue)",
  "GET_ALL_VISIBLE_ENEMIES()",
  "RAYCAST(0)",
  "BROADCAST(state)",
  "RECEIVE()",
];

export const QUERY_OPTIONS: string[] = [
  "GET_HEALTH",
  "GET_ENERGY",
  "GET_ENERGY_PCT",
  "GET_DISTANCE",
  "GET_POSITION",
  "GET_ROTATION",
  "GET_FOV_DIR",
  "GET_VISIBLE_COUNT",
  "GET_OBSTACLE_DISTANCE",
  "GET_OBSTACLE_TYPE",
];

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: "MOVE", label: "MOVE", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "MOVE_FAST", label: "MOVE_FAST", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "BACKUP", label: "BACKUP", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "FIRE", label: "FIRE", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "BURST_FIRE", label: "BURST_FIRE", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "SCAN", label: "SCAN", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "PATHFIND", label: "PATHFIND", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "STOP", label: "STOP", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "WAIT", label: "WAIT", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: { ticks: 5 } },
  { type: "IF_THEN", label: "IF", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { condition: "CAN_SEE_ENEMY" }, childSlots: "then" },
  { type: "IF_THEN_ELSE", label: "IF / ELSE", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { condition: "CAN_SEE_ENEMY" }, childSlots: "thenElse" },
  { type: "WHILE_DO", label: "WHILE", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { condition: "i < count" }, childSlots: "loop" },
  { type: "FOR_LOOP", label: "FOR", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { iterator: "i", start: 0, end: "count" }, childSlots: "loop" },
  { type: "FUNCTION_DEF", label: "FUNCTION", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { name: "retreat" }, childSlots: "loop" },
  { type: "CALL_FUNCTION", label: "CALL", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { name: "retreat" } },
  { type: "SET_VAR", label: "SET", category: "VARIABLES", colorVar: "var(--arena-amber)", defaultInputs: { target: "rotation", value: "ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)" } },
  { type: "UPDATE_VAR", label: "UPDATE", category: "VARIABLES", colorVar: "var(--arena-amber)", defaultInputs: { target: "i", operator: "+", value: "1" } },
  { type: "CREATE_ARRAY", label: "ARRAY", category: "DATA", colorVar: "var(--arena-stasis)", defaultInputs: { target: "queue", values: "0, 1, 2" } },
  { type: "CREATE_DICT", label: "DICT", category: "DATA", colorVar: "var(--arena-stasis)", defaultInputs: { target: "state", entries: 'mode: "SCAN", target_id: 0' } },
  { type: "ARRAY_PUSH", label: "PUSH", category: "DATA", colorVar: "var(--arena-stasis)", defaultInputs: { target: "queue", value: "NEAREST_VISIBLE_X" } },
  { type: "ARRAY_POP", label: "POP", category: "DATA", colorVar: "var(--arena-stasis)", defaultInputs: { target: "last", source: "queue" } },
  { type: "DICT_SET", label: "DICT SET", category: "DATA", colorVar: "var(--arena-stasis)", defaultInputs: { target: "state.mode", value: '"ATTACK"' } },
  { type: "QUERY_SENSOR", label: "QUERY", category: "SENSORS", colorVar: "var(--arena-green)", defaultInputs: { query: "GET_HEALTH" } },
  { type: "SET_FUNCTION", label: "FUNCTION VALUE", category: "SENSORS", colorVar: "var(--arena-green)", defaultInputs: { target: "aim", expression: "ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)" } },
];

export const BLOCK_DEFINITION_BY_TYPE: Record<BlockType, BlockDefinition> = BLOCK_DEFINITIONS.reduce(
  (definitions, definition) => ({ ...definitions, [definition.type]: definition }),
  {} as Record<BlockType, BlockDefinition>,
);
