export const BUILTIN_FUNCTION_NAMES = new Set([
    "ABS", "SQRT", "POW", "SIN", "COS", "TAN",
    "ATAN2", "MIN", "MAX", "FLOOR", "CEIL", "ROUND",
    "LENGTH", "PUSH", "POP", "RANDOM", "LOG",
    "GET_ALL_VISIBLE_ENEMIES", "RAYCAST",
    "MY_HEALTH", "ENEMY_HEALTH", "ENEMY_VELOCITY",
    "PREDICT_POSITION", "CALCULATE_LEAD",
    "BROADCAST", "RECEIVE",
]);

export const ADDITIVE_OPERATORS = new Set(["+", "-"]);
export const COMPARISON_OPERATORS = new Set(["<", ">", "==", "!=", "<=", ">="]);
export const MULTIPLICATIVE_OPERATORS = new Set(["*", "/", "%"]);

export const MAX_LITERAL_COLLECTION_ELEMENTS = 100;
export const FORBIDDEN_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);
