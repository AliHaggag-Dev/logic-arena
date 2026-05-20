export interface AliScriptSuggestion {
  label: string;
  insertText: string;
  detail: string;
  category: string;
}

const COMMAND_SUGGESTIONS: AliScriptSuggestion[] = [
  { label: "FIRE", insertText: "FIRE", detail: "Fire at visible target", category: "Commands" },
  { label: "BURST_FIRE", insertText: "BURST_FIRE", detail: "Fire a burst volley", category: "Commands" },
  { label: "MOVE", insertText: "MOVE", detail: "Move in a direction", category: "Commands" },
  { label: "BACKUP", insertText: "BACKUP", detail: "Move backward", category: "Commands" },
  { label: "SCAN", insertText: "SCAN", detail: "Scan for enemies", category: "Commands" },
  { label: "STOP", insertText: "STOP", detail: "Stop movement", category: "Commands" },
  { label: "PATHFIND", insertText: "PATHFIND", detail: "Navigate around obstacles", category: "Commands" },
  { label: "MOVE_FAST", insertText: "MOVE_FAST", detail: "Move with speed boost", category: "Commands" },
];

const VARIABLE_SUGGESTIONS: AliScriptSuggestion[] = [
  { label: "MY_ENERGY", insertText: "MY_ENERGY", detail: "Current energy", category: "Variables" },
  { label: "ENERGY_PCT", insertText: "ENERGY_PCT", detail: "Energy percentage", category: "Variables" },
  { label: "IN_STASIS", insertText: "IN_STASIS", detail: "Stasis status", category: "Variables" },
  { label: "CAN_SEE_ENEMY", insertText: "CAN_SEE_ENEMY", detail: "Enemy visibility flag", category: "Variables" },
  { label: "VISIBLE_ENEMY_COUNT", insertText: "VISIBLE_ENEMY_COUNT", detail: "Visible enemy count", category: "Variables" },
  { label: "FOV_ANGLE", insertText: "FOV_ANGLE", detail: "Field of view angle", category: "Variables" },
  { label: "POSITION_X", insertText: "POSITION_X", detail: "Current X coordinate", category: "Variables" },
  { label: "POSITION_Y", insertText: "POSITION_Y", detail: "Current Y coordinate", category: "Variables" },
  { label: "NEAREST_VISIBLE_X", insertText: "NEAREST_VISIBLE_X", detail: "Nearest visible target X", category: "Variables" },
  { label: "NEAREST_VISIBLE_Y", insertText: "NEAREST_VISIBLE_Y", detail: "Nearest visible target Y", category: "Variables" },
  { label: "CAN_SEE_OBSTACLE", insertText: "CAN_SEE_OBSTACLE", detail: "Obstacle visibility flag", category: "Variables" },
  { label: "NEAREST_OBSTACLE_TYPE", insertText: "NEAREST_OBSTACLE_TYPE", detail: "Nearest obstacle type", category: "Variables" },
  { label: "NEAREST_OBSTACLE_DISTANCE", insertText: "NEAREST_OBSTACLE_DISTANCE", detail: "Nearest obstacle distance", category: "Variables" },
  { label: "distance", insertText: "distance", detail: "Object distance field", category: "Variables" },
  { label: "health", insertText: "health", detail: "Object health field", category: "Variables" },
  { label: "rotation", insertText: "rotation", detail: "Object rotation field", category: "Variables" },
  { label: "target_vx", insertText: "target_vx", detail: "Target velocity X", category: "Variables" },
  { label: "target_vy", insertText: "target_vy", detail: "Target velocity Y", category: "Variables" },
  { label: "bullet_speed", insertText: "bullet_speed", detail: "Projectile speed field", category: "Variables" },
  { label: "spotted", insertText: "spotted", detail: "Visibility field", category: "Variables" },
];

const FUNCTION_SUGGESTIONS: AliScriptSuggestion[] = [
  { label: "ATAN2", insertText: "ATAN2(", detail: "Angle from vector", category: "Functions" },
  { label: "SQRT", insertText: "SQRT(", detail: "Square root", category: "Functions" },
  { label: "ABS", insertText: "ABS(", detail: "Absolute value", category: "Functions" },
  { label: "SIN", insertText: "SIN(", detail: "Sine", category: "Functions" },
  { label: "COS", insertText: "COS(", detail: "Cosine", category: "Functions" },
  { label: "TAN", insertText: "TAN(", detail: "Tangent", category: "Functions" },
  { label: "FLOOR", insertText: "FLOOR(", detail: "Round down", category: "Functions" },
  { label: "CEIL", insertText: "CEIL(", detail: "Round up", category: "Functions" },
  { label: "ROUND", insertText: "ROUND(", detail: "Round to nearest", category: "Functions" },
  { label: "LOG", insertText: "LOG(", detail: "Natural logarithm", category: "Functions" },
  { label: "POW", insertText: "POW(", detail: "Exponentiation", category: "Functions" },
  { label: "MIN", insertText: "MIN(", detail: "Minimum value", category: "Functions" },
  { label: "MAX", insertText: "MAX(", detail: "Maximum value", category: "Functions" },
  { label: "RANDOM", insertText: "RANDOM(", detail: "Random value", category: "Functions" },
  { label: "LENGTH", insertText: "LENGTH(", detail: "Array length", category: "Functions" },
  { label: "PUSH", insertText: "PUSH(", detail: "Append array value", category: "Functions" },
  { label: "POP", insertText: "POP(", detail: "Remove array value", category: "Functions" },
  { label: "GET_ALL_VISIBLE_ENEMIES", insertText: "GET_ALL_VISIBLE_ENEMIES(", detail: "Visible enemies array", category: "Functions" },
  { label: "RAYCAST", insertText: "RAYCAST(", detail: "Cast sensor ray", category: "Functions" },
];

const SYSTEM_VARIABLE_SUGGESTIONS: AliScriptSuggestion[] = [
  { label: "_SYS_SPEED_MULT", insertText: "_SYS_SPEED_MULT", detail: "Movement speed multiplier", category: "System Vars" },
  { label: "_SYS_STRAFE", insertText: "_SYS_STRAFE", detail: "Strafe control", category: "System Vars" },
  { label: "_SYS_ORBIT_X", insertText: "_SYS_ORBIT_X", detail: "Orbit center X", category: "System Vars" },
  { label: "_SYS_ORBIT_Y", insertText: "_SYS_ORBIT_Y", detail: "Orbit center Y", category: "System Vars" },
  { label: "_SYS_ORBIT_R", insertText: "_SYS_ORBIT_R", detail: "Orbit radius", category: "System Vars" },
  { label: "_SYS_FACE_X", insertText: "_SYS_FACE_X", detail: "Face target X", category: "System Vars" },
  { label: "_SYS_FACE_Y", insertText: "_SYS_FACE_Y", detail: "Face target Y", category: "System Vars" },
  { label: "_SYS_TARGET_X", insertText: "_SYS_TARGET_X", detail: "Path target X", category: "System Vars" },
  { label: "_SYS_TARGET_Y", insertText: "_SYS_TARGET_Y", detail: "Path target Y", category: "System Vars" },
  { label: "_SYS_AT_TARGET", insertText: "_SYS_AT_TARGET", detail: "Reached target flag", category: "System Vars" },
  { label: "_SYS_SCAN_SWEEP_DEG", insertText: "_SYS_SCAN_SWEEP_DEG", detail: "Scan sweep degrees", category: "System Vars" },
];

const KEYWORD_SUGGESTIONS: AliScriptSuggestion[] = [
  { label: "IF", insertText: "IF ", detail: "Conditional branch", category: "Commands" },
  { label: "ELSE", insertText: "ELSE", detail: "Alternate branch", category: "Commands" },
  { label: "END", insertText: "END", detail: "Close block", category: "Commands" },
  { label: "WHILE", insertText: "WHILE ", detail: "Loop while condition is true", category: "Commands" },
  { label: "FOR", insertText: "FOR ", detail: "Iterate over range", category: "Commands" },
  { label: "SET", insertText: "SET ", detail: "Assign variable", category: "Commands" },
];

const ALL_SUGGESTIONS = [
  ...KEYWORD_SUGGESTIONS,
  ...COMMAND_SUGGESTIONS,
  ...VARIABLE_SUGGESTIONS,
  ...FUNCTION_SUGGESTIONS,
  ...SYSTEM_VARIABLE_SUGGESTIONS,
];

const MAX_SUGGESTIONS = 10;

export function getAliScriptSuggestions(code: string, cursorPosition: number): AliScriptSuggestion[] {
  const wordMatch = code.slice(0, cursorPosition).match(/[A-Za-z_][A-Za-z0-9_]*$/);
  const prefix = wordMatch?.[0] ?? "";
  const lineStart = code.lastIndexOf("\n", cursorPosition - 1) + 1;
  const currentLinePrefix = code.slice(lineStart, cursorPosition);
  const isLineStart = currentLinePrefix.trimStart() === prefix;
  const previousToken = currentLinePrefix.trim().split(/\s+/).at(-2)?.toUpperCase() ?? "";
  const normalizedPrefix = prefix.toUpperCase();

  if (!prefix) return [];

  const scopedSuggestions = previousToken === "SET"
    ? [...VARIABLE_SUGGESTIONS, ...SYSTEM_VARIABLE_SUGGESTIONS, ...FUNCTION_SUGGESTIONS]
    : isLineStart
      ? [...KEYWORD_SUGGESTIONS, ...COMMAND_SUGGESTIONS]
      : [...VARIABLE_SUGGESTIONS, ...FUNCTION_SUGGESTIONS, ...SYSTEM_VARIABLE_SUGGESTIONS, ...COMMAND_SUGGESTIONS];

  return scopedSuggestions
    .filter((suggestion) => suggestion.label.toUpperCase().startsWith(normalizedPrefix))
    .concat(
      ALL_SUGGESTIONS.filter((suggestion) => suggestion.label.toUpperCase().startsWith(normalizedPrefix)),
    )
    .filter((suggestion, index, suggestions) => suggestions.findIndex((item) => item.label === suggestion.label) === index)
    .slice(0, MAX_SUGGESTIONS);
}

