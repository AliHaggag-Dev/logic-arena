export interface MathFunctionDoc {
  signature: string;
  description: string;
  returns: string;
  example: string;
}

export const MATH_STDLIB_TABLE: MathFunctionDoc[] = [
  { signature: 'ABS(x)', description: 'Absolute value. Strips the sign from a number.', returns: 'number', example: 'SET d = ABS(x2 - x1)' },
  { signature: 'SQRT(x)', description: 'Square root of x. Negative inputs are clamped to 0.', returns: 'number', example: 'SET dist = SQRT(dx * dx + dy * dy)' },
  { signature: 'POW(base, exp)', description: 'Raise base to the power of exp.', returns: 'number', example: 'SET sq = POW(side, 2)' },
  { signature: 'SIN(x)', description: 'Sine of x in radians.', returns: 'number', example: 'SET vy = SIN(rotation)' },
  { signature: 'COS(x)', description: 'Cosine of x in radians.', returns: 'number', example: 'SET vx = COS(rotation)' },
  { signature: 'TAN(x)', description: 'Tangent of x in radians.', returns: 'number', example: 'SET slope = TAN(angle)' },
  { signature: 'ATAN2(y, x)', description: 'Angle in radians from the origin to the point (x, y). The gold-standard function for aiming — converts a direction vector to an angle.', returns: 'number (radians)', example: 'SET aim = ATAN2(ey - POSITION_Y, ex - POSITION_X)' },
  { signature: 'MIN(a, b)', description: 'Returns the smaller of two values.', returns: 'number', example: 'SET safe = MIN(distance, 200)' },
  { signature: 'MAX(a, b)', description: 'Returns the larger of two values.', returns: 'number', example: 'SET e = MAX(MY_ENERGY, 0)' },
  { signature: 'FLOOR(x)', description: 'Rounds x down to the nearest integer.', returns: 'integer', example: 'SET i = FLOOR(LENGTH(arr) / 2)' },
  { signature: 'CEIL(x)', description: 'Rounds x up to the nearest integer.', returns: 'integer', example: 'SET pages = CEIL(count / 10)' },
  { signature: 'ROUND(x)', description: 'Rounds x to the nearest integer.', returns: 'integer', example: 'SET hp = ROUND(health)' },
  { signature: 'LOG(x)', description: 'Natural logarithm of x. x must be greater than 0.', returns: 'number', example: 'SET lg = LOG(MY_ENERGY)' },
  { signature: 'RANDOM()', description: 'Random floating-point number in [0.0, 1.0). Useful for stochastic movement to avoid predictable patterns.', returns: 'number', example: 'SET noise = RANDOM() * 0.4 - 0.2' },
];

// ---------------------------------------------------------------------------
// Array Operations
// ---------------------------------------------------------------------------

export interface ArrayOpDoc {
  signature: string;
  description: string;
  returns: string;
  example: string;
}

export const ARRAY_OPS_TABLE: ArrayOpDoc[] = [
  { signature: 'SET arr = [v0, v1, v2]', description: 'Declare an array literal with initial values. Elements can be any expression. Supports advanced deterministic memory management for state tracking.', returns: 'array', example: 'SET angles = [0, 0.785, 1.57, -0.785]' },
  { signature: 'arr[index]', description: 'Read the value at zero-based index. Returns undefined if out of bounds. Reading from arrays is an O(1) constant time operation.', returns: 'value', example: 'SET a = angles[0]' },
  { signature: 'SET arr[index] = val', description: 'Write a value at zero-based index. Index must be within current array bounds. O(1) time complexity.', returns: '—', example: 'SET scores[i] = ROUND(dist)' },
  { signature: 'LENGTH(arr)', description: 'Returns the number of elements in the array. Works on strings too (returns character count). O(1) lookup. Essential for O(N) bounds-checking in loops.', returns: 'number', example: 'SET n = LENGTH(enemies)' },
  { signature: 'PUSH(arr, value)', description: 'Appends value to the end of the array. Dynamic allocation occurs automatically. Returns the new array length.', returns: 'number', example: 'PUSH(queue, NEAREST_VISIBLE_X)' },
  { signature: 'POP(arr)', description: 'Removes and returns the last element of the array. Returns undefined if empty. O(1) time complexity.', returns: 'value', example: 'SET last = POP(queue)' },
];

// ---------------------------------------------------------------------------
// Dictionary / State Operations
// ---------------------------------------------------------------------------

export interface DictionaryOpDoc {
  signature: string;
  description: string;
  returns: string;
  example: string;
}

export const DICTIONARY_OPS_TABLE: DictionaryOpDoc[] = [
  { signature: 'SET obj = { key: "val" }', description: 'Declare an object literal (Dictionary/Hash Map). Supports O(1) lookups and dynamic key insertion. Perfect for powerful state machines and memory persistence.', returns: 'object', example: 'SET state = { mode: "HUNT", target_id: 4 }' },
  { signature: 'obj.key', description: 'Dot notation to access or modify a property. Key must be an identifier. Fast O(1) property access.', returns: 'value', example: 'SET m = state.mode' },
  { signature: 'obj["key"]', description: 'Bracket notation to access or modify a property. Key can be any expression resolving to a string. O(1) property access.', returns: 'value', example: 'SET state["mode"] = "EVADE"' },
  { signature: 'SET obj.key = val', description: 'Mutating assignment. Update a property on an existing object. Extremely useful for state preservation across ticks.', returns: '—', example: 'SET state.mode = "ATTACK"' },
];

// ---------------------------------------------------------------------------
// Advanced Sensor Functions (Phase 1)
// ---------------------------------------------------------------------------

export interface SensorFunctionDoc {
  signature: string;
  category: string;
  description: string;
  returns: string;
  returnDetail: string;
  example: string;
  note: string;
}

export const SENSOR_FUNCTIONS_TABLE: SensorFunctionDoc[] = [
  {
    signature: 'GET_ALL_VISIBLE_ENEMIES()',
    category: 'Vision Array',
    description: 'Returns an Array of enemy snapshots for every alive enemy currently inside this robot\'s FOV cone. Each snapshot is a 4-element sub-array. Enemies are intentionally returned UNSORTED — players are expected to implement O(N) complexity linear scans or O(N log N) sorting algorithms to find their priority target without triggering TLE crashes.',
    returns: 'Array of [distance, x, y, health]',
    returnDetail: 'enemies[i][0] = distance  •  enemies[i][1] = position X  •  enemies[i][2] = position Y  •  enemies[i][3] = health (0–100)',
    example:
      `SET enemies = GET_ALL_VISIBLE_ENEMIES()
SET count = LENGTH(enemies)
// Find the weakest target (manual min-search)
SET i = 1
SET weakest = enemies[0]
WHILE i < count DO
  SET candidate = enemies[i]
  IF candidate[3] < weakest[3] THEN
    SET weakest = candidate
  END
  SET i = i + 1
END
// Aim and fire
SET aim = ATAN2(weakest[2] - POSITION_Y, weakest[1] - POSITION_X)
SET rotation = aim
FIRE`,
    note: 'Returns an empty array [] when no enemies are in FOV. Always check LENGTH() before indexing.',
  },
  {
    signature: 'RAYCAST(angle)',
    category: 'Line of Sight',
    description: 'Fires an advanced physics ray from the robot\'s current position in the direction (robot.rotation + angle), where angle is a relative radian offset. Returns the distance in arena units to the first solid obstacle encountered. Essential for advanced collision avoidance and Line-of-Sight verification before firing. Checks: boundary walls → SOLID obstacles → alive robots. TRAP and LAVA zones are transparent.',
    returns: 'number (distance in arena units)',
    returnDetail: 'Range: 1 to FOV range (default 300). Returns the FOV range value when nothing is hit within sensor range.',
    example:
      `// Obstacle avoidance with 3-ray sonar
SET front = RAYCAST(0)
SET left  = RAYCAST(-0.785)
SET right = RAYCAST(0.785)
IF front < 60 THEN
  IF left > right THEN
    SET rotation = rotation - 0.3
  ELSE
    SET rotation = rotation + 0.3
  END
ELSE
  // Clear path — check Line-of-Sight before firing
  IF CAN_SEE_ENEMY THEN
    SET losCheck = RAYCAST(ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X) - rotation)
    IF losCheck > distance THEN
      FIRE
    END
  END
END
MOVE`,
    note: 'angle is relative to robot.rotation. RAYCAST(0) fires straight ahead. RAYCAST(-1.57) fires 90° left. Use ATAN2 to compute an absolute angle then subtract rotation to get the relative offset.',
  },
];
