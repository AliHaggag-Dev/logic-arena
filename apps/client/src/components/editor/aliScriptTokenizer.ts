export type TokenType =
  | "KEYWORD"
  | "COMMAND"
  | "FUNCTION"
  | "RESERVED_VAR"
  | "SYSTEM_VAR"
  | "NUMBER"
  | "STRING"
  | "OPERATOR"
  | "COMMENT"
  | "IDENTIFIER";

export interface AliScriptToken {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

const KEYWORDS = new Set<string>([
  "IF",
  "ELSE",
  "END",
  "WHILE",
  "FOR",
  "DO",
  "SET",
  "NOT",
  "THEN",
  "AND",
  "OR",
]);

const COMMANDS = new Set<string>([
  "FIRE",
  "BURST_FIRE",
  "MOVE",
  "BACKUP",
  "SCAN",
  "STOP",
  "PATHFIND",
  "MOVE_FAST",
]);

const FUNCTIONS = new Set<string>([
  "ATAN2",
  "SQRT",
  "ABS",
  "SIN",
  "COS",
  "TAN",
  "FLOOR",
  "CEIL",
  "ROUND",
  "LOG",
  "POW",
  "MIN",
  "MAX",
  "RANDOM",
  "LENGTH",
  "PUSH",
  "POP",
  "GET_ALL_VISIBLE_ENEMIES",
  "RAYCAST",
]);

const RESERVED_VARIABLES = new Set<string>([
  "MY_ENERGY",
  "ENERGY_PCT",
  "IN_STASIS",
  "CAN_SEE_ENEMY",
  "VISIBLE_ENEMY_COUNT",
  "FOV_ANGLE",
  "POSITION_X",
  "POSITION_Y",
  "NEAREST_VISIBLE_X",
  "NEAREST_VISIBLE_Y",
  "CAN_SEE_OBSTACLE",
  "NEAREST_OBSTACLE_TYPE",
  "NEAREST_OBSTACLE_DISTANCE",
  "distance",
  "health",
  "rotation",
  "target_vx",
  "target_vy",
  "bullet_speed",
  "spotted",
]);

const SYSTEM_VARIABLES = new Set<string>([
  "_SYS_SPEED_MULT",
  "_SYS_STRAFE",
  "_SYS_ORBIT_X",
  "_SYS_ORBIT_Y",
  "_SYS_ORBIT_R",
  "_SYS_FACE_X",
  "_SYS_FACE_Y",
  "_SYS_TARGET_X",
  "_SYS_TARGET_Y",
  "_SYS_AT_TARGET",
  "_SYS_SCAN_SWEEP_DEG",
]);

const OPERATOR_CHARS = new Set<string>(["=", "+", "-", "*", "/", "%", ">", "<", "!", "(", ")", "[", "]", ",", "."]);

function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_]/.test(char);
}

function isIdentifierPart(char: string): boolean {
  return /[A-Za-z0-9_]/.test(char);
}

function isDigit(char: string): boolean {
  return /[0-9]/.test(char);
}

function getIdentifierType(value: string): TokenType {
  const upperValue = value.toUpperCase();

  if (KEYWORDS.has(upperValue)) return "KEYWORD";
  if (COMMANDS.has(upperValue)) return "COMMAND";
  if (FUNCTIONS.has(upperValue)) return "FUNCTION";
  if (SYSTEM_VARIABLES.has(upperValue)) return "SYSTEM_VAR";
  if (RESERVED_VARIABLES.has(value) || RESERVED_VARIABLES.has(upperValue)) return "RESERVED_VAR";

  return "IDENTIFIER";
}

export function tokenizeAliScript(code: string): AliScriptToken[] {
  const tokens: AliScriptToken[] = [];
  let index = 0;

  while (index < code.length) {
    const char = code[index] ?? "";
    const nextChar = code[index + 1] ?? "";

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      const start = index;
      while (index < code.length && code[index] !== "\n") index += 1;
      tokens.push({ type: "COMMENT", value: code.slice(start, index), start, end: index });
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      const start = index;
      index += 1;
      while (index < code.length) {
        const currentChar = code[index] ?? "";
        const previousChar = code[index - 1] ?? "";
        index += 1;
        if (currentChar === quote && previousChar !== "\\") break;
      }
      tokens.push({ type: "STRING", value: code.slice(start, index), start, end: index });
      continue;
    }

    if (isDigit(char) || (char === "." && isDigit(nextChar))) {
      const start = index;
      if (char === ".") index += 1;
      while (index < code.length && isDigit(code[index] ?? "")) index += 1;
      if (code[index] === ".") {
        index += 1;
        while (index < code.length && isDigit(code[index] ?? "")) index += 1;
      }
      tokens.push({ type: "NUMBER", value: code.slice(start, index), start, end: index });
      continue;
    }

    if (isIdentifierStart(char)) {
      const start = index;
      index += 1;
      while (index < code.length && isIdentifierPart(code[index] ?? "")) index += 1;
      const value = code.slice(start, index);
      tokens.push({ type: getIdentifierType(value), value, start, end: index });
      continue;
    }

    if (OPERATOR_CHARS.has(char)) {
      const start = index;
      const pair = code.slice(index, index + 2);
      index += ["==", "!=", ">=", "<=", "&&", "||"].includes(pair) ? 2 : 1;
      tokens.push({ type: "OPERATOR", value: code.slice(start, index), start, end: index });
      continue;
    }

    const start = index;
    index += 1;
    tokens.push({ type: "OPERATOR", value: code.slice(start, index), start, end: index });
  }

  return tokens;
}

