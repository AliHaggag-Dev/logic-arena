export type BlockCategory = "ACTIONS" | "LOGIC" | "VARIABLES" | "DATA" | "SENSORS";

export type BlockType =
  | "MOVE"
  | "MOVE_FAST"
  | "BACKUP"
  | "FIRE"
  | "BURST_FIRE"
  | "TELEPORT"
  | "SHIELD"
  | "CLOAK"
  | "DASH"
  | "MINE"
  | "TAUNT"
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
  | "BREAK"
  | "CONTINUE"
  | "RETURN"
  | "SET_VAR"
  | "UPDATE_VAR"
  | "CREATE_ARRAY"
  | "CREATE_DICT"
  | "ARRAY_PUSH"
  | "ARRAY_POP"
  | "DICT_SET"
  | "GET_HEALTH"
  | "GET_ENERGY"
  | "GET_ENERGY_PCT"
  | "GET_DISTANCE"
  | "GET_POSITION"
  | "GET_ROTATION"
  | "GET_FOV_DIR"
  | "GET_VISIBLE_COUNT"
  | "GET_OBSTACLE_DISTANCE"
  | "GET_OBSTACLE_TYPE"
  | "QUERY_SENSOR"
  | "SET_FUNCTION"
  | "BROADCAST"
  | "RECEIVE_INBOX";

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
  description: string;
  category: BlockCategory;
  colorVar: string;
  defaultInputs: BlockInputs;
  childSlots?: "then" | "thenElse" | "loop";
  searchTerms?: string[];
}

export interface BlockCategoryDefinition {
  id: BlockCategory;
  label: string;
  shortLabel: string;
  colorVar: string;
  description: string;
}

export const BLOCK_CATEGORIES: BlockCategoryDefinition[] = [
  {
    id: "ACTIONS",
    label: "Actions",
    shortLabel: "Act",
    colorVar: "var(--arena-cyan)",
    description: "Movement, combat, and abilities",
  },
  {
    id: "LOGIC",
    label: "Logic",
    shortLabel: "Flow",
    colorVar: "rgb(var(--arena-purple-rgb))",
    description: "Conditions, loops, and functions",
  },
  {
    id: "VARIABLES",
    label: "Variables",
    shortLabel: "Vars",
    colorVar: "var(--arena-amber)",
    description: "Assign and update values",
  },
  {
    id: "DATA",
    label: "Data",
    shortLabel: "Data",
    colorVar: "var(--arena-stasis)",
    description: "Arrays and dictionaries",
  },
  {
    id: "SENSORS",
    label: "Sensors",
    shortLabel: "Sense",
    colorVar: "var(--arena-green)",
    description: "Read state, queries, and swarm",
  },
];

export const ACTION_OPTIONS: string[] = [
  "MOVE",
  "MOVE_FAST",
  "BACKUP",
  "FIRE",
  "BURST_FIRE",
  "TELEPORT",
  "SHIELD",
  "CLOAK",
  "DASH",
  "MINE",
  "TAUNT",
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

const GET_QUERY_BLOCKS: BlockDefinition[] = QUERY_OPTIONS.map((query) => ({
  type: query as BlockType,
  label: `${query}()`,
  description: `Log ${query.replace("GET_", "").replace(/_/g, " ").toLowerCase()} to console`,
  category: "SENSORS" as BlockCategory,
  colorVar: "var(--arena-green)",
  defaultInputs: {},
  searchTerms: [query, query.toLowerCase(), "get", "query", "sensor"],
}));

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: "MOVE", label: "MOVE", description: "Move forward at standard speed", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "MOVE_FAST", label: "MOVE_FAST", description: "Move forward at 2× speed", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "BACKUP", label: "BACKUP", description: "Move in reverse", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "FIRE", label: "FIRE", description: "Single shot at nearest visible enemy", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "BURST_FIRE", label: "BURST_FIRE", description: "Multi-shot burst at enemy", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "TELEPORT", label: "TELEPORT", description: "Instant jump to coordinates", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: { x: 400, y: 300 } },
  { type: "SHIELD", label: "SHIELD", description: "Activate defensive shield", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "CLOAK", label: "CLOAK", description: "Become invisible briefly", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "DASH", label: "DASH", description: "Quick burst movement", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: { distance: 80 } },
  { type: "MINE", label: "MINE", description: "Drop a proximity mine", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "TAUNT", label: "TAUNT", description: "Send a taunt message", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: { message: '"COME AT ME"' } },
  { type: "SCAN", label: "SCAN", description: "Rotate scanner cone +15°", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "PATHFIND", label: "PATHFIND", description: "A* pathfind toward target", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "STOP", label: "STOP", description: "Halt all movement", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: {} },
  { type: "WAIT", label: "WAIT", description: "Pause for N ticks", category: "ACTIONS", colorVar: "var(--arena-cyan)", defaultInputs: { ticks: 5 } },
  { type: "IF_THEN", label: "IF", description: "Run blocks when condition is true", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { condition: "CAN_SEE_ENEMY" }, childSlots: "then" },
  { type: "IF_THEN_ELSE", label: "IF / ELSE", description: "Branch on condition with else path", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { condition: "CAN_SEE_ENEMY" }, childSlots: "thenElse" },
  { type: "WHILE_DO", label: "WHILE", description: "Loop while condition is true", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { condition: "i < count" }, childSlots: "loop" },
  { type: "FOR_LOOP", label: "FOR", description: "Counted loop from start to end", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { iterator: "i", start: 0, end: "count" }, childSlots: "loop" },
  { type: "FUNCTION_DEF", label: "FUNCTION", description: "Define a reusable routine", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { name: "retreat" }, childSlots: "loop" },
  { type: "CALL_FUNCTION", label: "CALL", description: "Call a function by name", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: { name: "retreat" } },
  { type: "BREAK", label: "BREAK", description: "Exit the innermost loop", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: {} },
  { type: "CONTINUE", label: "CONTINUE", description: "Skip to next loop iteration", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: {} },
  { type: "RETURN", label: "RETURN", description: "Return from current function", category: "LOGIC", colorVar: "rgb(var(--arena-purple-rgb))", defaultInputs: {} },
  { type: "SET_VAR", label: "SET", description: "Assign a variable", category: "VARIABLES", colorVar: "var(--arena-amber)", defaultInputs: { target: "rotation", value: "ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)" } },
  { type: "UPDATE_VAR", label: "UPDATE", description: "Increment or modify a variable", category: "VARIABLES", colorVar: "var(--arena-amber)", defaultInputs: { target: "i", operator: "+", value: "1" } },
  { type: "CREATE_ARRAY", label: "ARRAY", description: "Create an array variable", category: "DATA", colorVar: "var(--arena-stasis)", defaultInputs: { target: "queue", values: "0, 1, 2" } },
  { type: "CREATE_DICT", label: "DICT", description: "Create a dictionary / state object", category: "DATA", colorVar: "var(--arena-stasis)", defaultInputs: { target: "state", entries: 'mode: "SCAN", target_id: 0' } },
  { type: "ARRAY_PUSH", label: "PUSH", description: "Append value to array", category: "DATA", colorVar: "var(--arena-stasis)", defaultInputs: { target: "queue", value: "NEAREST_VISIBLE_X" } },
  { type: "ARRAY_POP", label: "POP", description: "Remove last array element", category: "DATA", colorVar: "var(--arena-stasis)", defaultInputs: { target: "last", source: "queue" } },
  { type: "DICT_SET", label: "DICT SET", description: "Set a dictionary key", category: "DATA", colorVar: "var(--arena-stasis)", defaultInputs: { target: "state.mode", value: '"ATTACK"' } },
  ...GET_QUERY_BLOCKS,
  {
    type: "QUERY_SENSOR",
    label: "QUERY (custom)",
    description: "Pick any sensor query from dropdown",
    category: "SENSORS",
    colorVar: "var(--arena-green)",
    defaultInputs: { query: "GET_HEALTH" },
    searchTerms: ["query", "sensor", "custom"],
  },
  {
    type: 'SET_FUNCTION',
    label: "SET = function",
    description: "Assign result of a math / sensor function",
    category: "SENSORS",
    colorVar: "var(--arena-green)",
    defaultInputs: { target: "aim", expression: "ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)" },
    searchTerms: ["atan2", "random", "raycast", "math"],
  },
  {
    type: "BROADCAST",
    label: "BROADCAST",
    description: "Send data to all alive teammates",
    category: "SENSORS",
    colorVar: "var(--arena-green)",
    defaultInputs: { payload: "state" },
    searchTerms: ["swarm", "team", "message"],
  },
  {
    type: "RECEIVE_INBOX",
    label: "RECEIVE()",
    description: "Read teammate messages into a variable",
    category: "SENSORS",
    colorVar: "var(--arena-green)",
    defaultInputs: { target: "messages" },
    searchTerms: ["swarm", "team", "inbox", "receive"],
  },
];

export const BLOCK_DEFINITION_BY_TYPE: Record<BlockType, BlockDefinition> = BLOCK_DEFINITIONS.reduce(
  (definitions, definition) => ({ ...definitions, [definition.type]: definition }),
  {} as Record<BlockType, BlockDefinition>,
);
