export interface CommandDoc {
  command: string;
  category: string;
  parameters: string;
  description: string;
  example: string;
  energyCost?: string;
}

export const COMMAND_TABLE: CommandDoc[] = [
  // --- Control Flow ---
  { command: 'IF...THEN...ELSE...END', category: 'Control Flow', parameters: 'condition', description: 'Branching logic with optional else clause. Must be closed with END.', example: 'IF health < 50 THEN BACKUP ELSE FIRE END', energyCost: 'Free' },
  { command: 'WHILE...DO...END', category: 'Control Flow', parameters: 'condition', description: 'Looping logic. Executes block while condition is true. Auto-capped at 10 iter/tick.', example: 'WHILE spotted DO FIRE WAIT 1 END', energyCost: 'Free' },
  { command: 'FUNCTION / CALL', category: 'Control Flow', parameters: 'name', description: 'Define reusable blocks of logic (functions) and invoke them.', example: 'FUNCTION retreat BACKUP END CALL retreat', energyCost: 'Free' },
  // --- Movement ---
  { command: 'MOVE', category: 'Movement', parameters: '—', description: 'Standard forward propulsion. Blocked during STASIS.', example: 'MOVE', energyCost: '2/tick' },
  { command: 'MOVE_FAST', category: 'Movement', parameters: '—', description: 'High-speed forward propulsion. 2× speed, 2× the energy of MOVE. Blocked during STASIS.', example: 'MOVE_FAST', energyCost: '4/tick' },
  { command: 'BACKUP', category: 'Movement', parameters: '—', description: 'Reverse thrust. Same cost as MOVE. Blocked during STASIS.', example: 'BACKUP', energyCost: '2/tick' },
  { command: 'PATHFIND', category: 'Movement', parameters: '—', description: 'Weighted A* pathfinding toward nearest visible target, avoiding obstacles. Blocked during STASIS.', example: 'PATHFIND', energyCost: '3/tick' },
  { command: 'STOP', category: 'Movement', parameters: '—', description: 'Halt all movement. Always allowed, even during STASIS.', example: 'STOP', energyCost: 'Free' },
  // --- Sensors ---
  { command: 'SCAN', category: 'Sensors', parameters: '—', description: 'Rotates FOV cone +15°/call to sweep the environment. Populates scanned_distance, scanned_angle, scanned_spotted. BLOCKED during STASIS — use WAIT instead.', example: 'SCAN', energyCost: '3/use' },
  { command: 'WAIT', category: 'Sensors', parameters: 'N: ticks', description: 'Suspends code execution for N ticks. 60 ticks ≈ 1 second. Costs 0 energy. Note: energy does NOT regenerate during WAIT — only during STASIS.', example: 'WAIT 30', energyCost: 'Free' },
  // --- Attack ---
  { command: 'FIRE', category: 'Attack', parameters: '—', description: 'Single precision shot toward nearest visible enemy. Deals 25 HP on hit. Only fires if an enemy is in FOV. Blocked during STASIS.', example: 'FIRE', energyCost: '8/shot' },
  { command: 'BURST_FIRE', category: 'Attack', parameters: '—', description: 'Rapid 3-shot burst. Each shot deals 8 HP (up to 24 HP total). Requires enemy in FOV. Blocked during STASIS.', example: 'BURST_FIRE', energyCost: '18/burst' },
  // --- Intelligence ---
  { command: 'SET var = expr', category: 'Intelligence', parameters: 'expression', description: 'Assign values using math operators (+, -, *, /, %). Executes even during STASIS — use to update state machines while immobilised.', example: 'SET rotation = rotation + 0.1', energyCost: 'Free' },
  { command: 'NOT / TRUE / FALSE', category: 'Intelligence', parameters: 'booleans', description: 'Logical operators and boolean constants for advanced conditions.', example: 'IF NOT CAN_SEE_ENEMY THEN SCAN END', energyCost: 'Free' },
  { command: 'AND / OR', category: 'Intelligence', parameters: 'logic', description: 'Compound boolean operators. AND has higher precedence than OR. Both short-circuit evaluate (second operand skipped if result determined by first).', example: 'IF health < 50 AND CAN_SEE_ENEMY THEN FIRE END', energyCost: 'Free' },
];

// ---------------------------------------------------------------------------
// New v2.0 Read-Only Identifiers
// ---------------------------------------------------------------------------

export interface IdentifierDoc {
  name: string;
  type: string;
  category: string;
  description: string;
}

export const IDENTIFIER_TABLE: IdentifierDoc[] = [
  // Self
  { name: 'health', type: 'number', category: 'Self', description: 'Current HP (0–100).' },
  // Movement
  { name: 'rotation', type: 'number', category: 'Movement', description: 'Body facing angle in radians. Writable via SET. Acts as the Steering Wheel — also updates velocity direction. Does NOT affect fovDirection.' },
  { name: 'angle', type: 'number', category: 'Movement', description: 'Alias for rotation. Accepted by all SET commands.' },
  { name: 'rot', type: 'number', category: 'Movement', description: 'Short alias for rotation. Accepted by all SET commands.' },
  // Vision
  { name: 'fovDirection', type: 'number', category: 'Vision', description: 'Scanner eye angle in radians. Independent from body rotation. SET fovDirection = X to aim the scanner separately. Does NOT affect body rotation.' },
  { name: 'lockVision', type: 'flag', category: 'Vision', description: 'SET lockVision = TRUE to sync fovDirection to rotation every tick. Auto-disables when SET rotation or SET fovDirection is used.' },
  // Combat
  { name: 'distance', type: 'number', category: 'Combat', description: 'Distance to nearest VISIBLE enemy. Returns Infinity if none in FOV.' },
  { name: 'spotted', type: 'boolean', category: 'Combat', description: 'True if any enemy is within FOV cone. Legacy alias for CAN_SEE_ENEMY — prefer CAN_SEE_ENEMY in new scripts.' },
  { name: 'bullet_speed', type: 'number', category: 'Combat', description: 'Projectile velocity constant (400 arena units/sec). Useful for predictive aiming calculations.' },
  { name: 'target_vx', type: 'number', category: 'Combat', description: 'X-axis velocity of the nearest visible enemy. Returns 0 if no enemy in FOV. Use with bullet_speed for predictive lead shots.' },
  { name: 'target_vy', type: 'number', category: 'Combat', description: 'Y-axis velocity of the nearest visible enemy. Returns 0 if no enemy in FOV. Use with bullet_speed for predictive lead shots.' },
  // Energy
  { name: 'MY_ENERGY', type: 'number', category: 'Energy', description: 'Current energy level (0–100).' },
  { name: 'ENERGY_PCT', type: 'number', category: 'Energy', description: 'Energy as percentage (0–100). Useful for threshold checks.' },
  { name: 'IN_STASIS', type: 'boolean', category: 'Energy', description: 'True when energy ≤ 0. Robot exits STASIS at energy ≥ 20. MOVE, BACKUP, MOVE_FAST, PATHFIND, FIRE, BURST_FIRE, and SCAN are all blocked during STASIS. SET and WAIT still execute.' },
  // FOV
  { name: 'CAN_SEE_ENEMY', type: 'boolean', category: 'FOV', description: 'True if one or more enemies are within the current FOV cone.' },
  { name: 'VISIBLE_ENEMY_COUNT', type: 'number', category: 'FOV', description: 'Number of enemies currently within the FOV cone.' },
  { name: 'NEAREST_VISIBLE_X', type: 'number', category: 'FOV', description: 'X coordinate of the nearest visible enemy. Returns own X if none visible.' },
  { name: 'NEAREST_VISIBLE_Y', type: 'number', category: 'FOV', description: 'Y coordinate of the nearest visible enemy. Returns own Y if none visible.' },
  { name: 'FOV_ANGLE', type: 'number', category: 'FOV', description: 'Current FOV cone angle in degrees (default 120°).' },
  { name: 'CAN_SEE_OBSTACLE', type: 'boolean', category: 'FOV', description: 'True if one or more obstacles (walls, lava, traps) are within the current FOV cone.' },
  { name: 'NEAREST_OBSTACLE_TYPE', type: 'string', category: 'FOV', description: 'Returns "SOLID" (wall), "TRAP" (slow), "LAVA" (damage), "FINISH_LINE", or "NONE" depending on the nearest visible obstacle.' },
  { name: 'NEAREST_OBSTACLE_DISTANCE', type: 'number', category: 'FOV', description: 'Distance to the nearest visible obstacle. Returns Infinity if none in FOV.' },
  // Scan memory
  { name: 'scanned_distance', type: 'number', category: 'Scan', description: 'Distance to nearest visible enemy as of last SCAN call. Only updates when SCAN executes (SCAN is blocked during STASIS).' },
  { name: 'scanned_angle', type: 'number', category: 'Scan', description: 'Angle toward nearest visible enemy as of last SCAN call. Only updates when SCAN executes.' },
  { name: 'scanned_spotted', type: 'boolean', category: 'Scan', description: 'True if any enemy was visible during the last SCAN call. Remains at its last known value while in STASIS (SCAN cannot update it).' },
];

// ---------------------------------------------------------------------------
// Query Functions (Status & Logs)
// ---------------------------------------------------------------------------

export interface QueryDoc {
  command: string;
  description: string;
  returns: string;
  example: string;
}

export const QUERY_TABLE: QueryDoc[] = [
  { command: 'GET_HEALTH()', description: 'Prints current robot health to status logs.', returns: 'number (0-100)', example: 'GET_HEALTH()' },
  { command: 'GET_ENERGY()', description: 'Prints current energy level to status logs.', returns: 'number (0-100)', example: 'GET_ENERGY()' },
  { command: 'GET_ENERGY_PCT()', description: 'Prints current energy as a percentage.', returns: 'number (0-100)', example: 'GET_ENERGY_PCT()' },
  { command: 'GET_DISTANCE()', description: 'Prints distance to the nearest visible enemy.', returns: 'number | "Infinity"', example: 'GET_DISTANCE()' },
  { command: 'GET_POSITION()', description: 'Prints current {x, y} position in arena units.', returns: 'string ({x, y})', example: 'GET_POSITION()' },
  { command: 'GET_ROTATION()', description: 'Prints body facing angle in radians.', returns: 'number', example: 'GET_ROTATION()' },
  { command: 'GET_FOV_DIR()', description: 'Prints scanner facing angle in radians.', returns: 'number', example: 'GET_FOV_DIR()' },
  { command: 'GET_VISIBLE_COUNT()', description: 'Prints number of enemies currently in FOV.', returns: 'number', example: 'GET_VISIBLE_COUNT()' },
  { command: 'GET_OBSTACLE_TYPE()', description: 'Prints type of nearest visible obstacle ("SOLID", "TRAP", "LAVA", "FINISH_LINE", "NONE").', returns: 'string', example: 'GET_OBSTACLE_TYPE()' },
  { command: 'GET_OBSTACLE_DISTANCE()', description: 'Prints distance to the nearest visible obstacle.', returns: 'number | "Infinity"', example: 'GET_OBSTACLE_DISTANCE()' },
];

// ---------------------------------------------------------------------------
// Algorithm Challenges
// ---------------------------------------------------------------------------

export interface AlgorithmChallenge {
  title: string;
  badge: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  concept: string;
  code: string;
  color: string;
}

export const ALGORITHM_CHALLENGES: AlgorithmChallenge[] = [
  {
    title: 'Spiral Search Pattern',
    badge: '🔍',
    description: 'Continuously rotate the FOV with SCAN until an enemy enters vision, then engage. Classic search algorithm applied to robot combat.',
    difficulty: 'BEGINNER',
    concept: 'FOV Sweep / Detection Loop',
    color: '#22d3ee',
    code:
      `// ── Spiral Search Pattern ──────────────────────
// Uses SCAN to rotate the FOV cone until CAN_SEE_ENEMY
// becomes true, then switches to combat mode.

WHILE TRUE DO
  IF CAN_SEE_ENEMY THEN
    // Target acquired — eliminate
    PATHFIND
    IF distance < 200 THEN
      FIRE
    END
  ELSE
    // Sweep the environment
    SCAN
    SET rotation = rotation + 0.08
    MOVE
    WAIT 1
  END
END`,
  },
  {
    title: 'Energy-Efficient Sniper',
    badge: '⚡',
    description: 'Only fire when energy is sufficient and the enemy is visible. Waits during STASIS for energy to recover. Maximises the Efficiency Score metric.',
    difficulty: 'INTERMEDIATE',
    concept: 'Resource-Aware Decision Making',
    color: '#a855f7',
    code:
      `// ── Energy-Efficient Sniper ────────────────────
// Optimises damage-per-energy-unit to achieve a
// high EFFICIENCY_SCORE at match end.
// NOTE: SCAN is BLOCKED during STASIS — use WAIT instead.

WHILE TRUE DO
  IF IN_STASIS THEN
    // Cannot act — wait for energy to recover (regen: +3/tick)
    WAIT 5
  ELSE
    IF MY_ENERGY < 30 THEN
      // Conserve — stop and let STASIS trigger regen
      STOP
      WAIT 3
    ELSE
      IF CAN_SEE_ENEMY THEN
        IF ENERGY_PCT > 60 THEN
          BURST_FIRE
        ELSE
          FIRE
        END
      ELSE
        SCAN
        MOVE
      END
    END
  END
END`,
  },
  {
    title: 'Defensive Regeneration Loop',
    badge: '🛡️',
    description: 'Detect STASIS entry, back away from the last known enemy position, and wait for energy to recover before re-engaging.',
    difficulty: 'ADVANCED',
    concept: 'State Machine / Stasis Recovery',
    color: '#f97316',
    code:
      `// ── Defensive Regeneration Loop ────────────────
// A two-state machine: COMBAT and RECOVERY.
// Switches states based on IN_STASIS and ENERGY_PCT.
// NOTE: SCAN is BLOCKED during STASIS — only WAIT/SET work.

SET mode = 0

WHILE TRUE DO
  IF IN_STASIS THEN
    // Forced recovery — SCAN blocked, SET still works
    SET mode = 1
    WAIT 4
  ELSE
    IF mode == 1 THEN
      // Just exited stasis — retreat before re-engaging
      IF ENERGY_PCT < 50 THEN
        BACKUP
        WAIT 2
      ELSE
        SET mode = 0
      END
    ELSE
      // Normal combat mode
      IF CAN_SEE_ENEMY THEN
        IF distance < 180 THEN
          FIRE
        ELSE
          PATHFIND
        END
      ELSE
        SCAN
        SET rotation = rotation + 0.12
      END
    END
  END
END`,
  },
];

// ---------------------------------------------------------------------------
// Quick Reference cards
// ---------------------------------------------------------------------------

export const QUICK_REF = [
  { title: 'CONTROL FLOW', icon: '⬡', color: '#f59e0b', commands: ['IF...ELSE', 'WHILE...DO', 'FUNCTION', 'CALL', 'END'] },
  { title: 'SENSORS / FOV', icon: '◈', color: '#06b6d4', commands: ['SCAN (blocked in STASIS)', 'WAIT', 'CAN_SEE_ENEMY', 'NEAREST_VISIBLE_X/Y', 'CAN_SEE_OBSTACLE'] },
  { title: 'MOVEMENT & VISION', icon: '⦾', color: '#4ade80', commands: ['rotation / angle / rot', 'fovDirection (Eye)', 'lockVision (Link)', 'SET rotation = 1.57', 'PATHFIND'] },
  { title: 'ENERGY', icon: '⚡', color: '#a855f7', commands: ['MY_ENERGY (0–100)', 'ENERGY_PCT', 'IN_STASIS', 'Regen: +3/tick in STASIS only'] },
  { title: 'INTELLIGENCE', icon: '◉', color: '#6366f1', commands: ['SET var = val', 'Math (+,-,*,/,%)', 'NOT / AND / OR', 'TRUE / FALSE'] },
  { title: 'ROTATION SYSTEM', icon: '◎', color: '#f59e0b', commands: ['rotation = body', 'fovDirection = eyes', 'lockVision = link', 'SET lockVision = TRUE', 'Auto-disables on SET'] },
  { title: 'STATUS QUERIES', icon: '📊', color: '#06b6d4', commands: ['GET_HEALTH()', 'GET_ENERGY()', 'GET_POSITION()', 'GET_DISTANCE()'] },
];

// ---------------------------------------------------------------------------
// Sample script shown in the interactive playground
// ---------------------------------------------------------------------------

export const SAMPLE_SCRIPT =
  `// The Energy-Aware Stalker v2.3
// NOTE: energy only regens during STASIS, not during WAIT/STOP.
WHILE TRUE DO
  IF IN_STASIS THEN
    // Blocked — wait for energy recovery (+3/tick)
    WAIT 5
  ELSE
    IF CAN_SEE_ENEMY THEN
      IF MY_ENERGY > 60 THEN
        BURST_FIRE
      ELSE
        FIRE
      END
    ELSE
      SCAN
      SET rotation = rotation + 0.1
      MOVE
    END
  END
END`;

// ---------------------------------------------------------------------------
// Category → color map (single source of truth for the entire docs page)
// ---------------------------------------------------------------------------

export const CATEGORY_COLORS: Record<string, string> = {
  'Control Flow': '#f59e0b',
  Movement:       '#4ade80',
  Vision:         '#22d3ee',
  Sensors:        '#06b6d4',
  Attack:         '#f97316',
  Tactics:        '#eab308',
  'Advanced Combat': '#ef4444',
  Evasion:        '#10b981',
  Intelligence:   '#a855f7',
  Energy:         '#818cf8',
  FOV:            '#22d3ee',
  Scan:           '#67e8f9',
  Self:           '#94a3b8',
  Combat:         '#f87171',
  flag:           '#4ade80',
};

// ---------------------------------------------------------------------------
// Battle Tactics presets
// ---------------------------------------------------------------------------

export const TACTICS_DATA = [
  { title: 'THE STALKER', desc: 'Sensor-loop logic for hyper-accurate target acquisition.', code: '// Adaptive Scan Loop\nSCAN\nWHILE NOT scanned_spotted DO\n  SET rotation = rotation + 0.1\n  WAIT 2\n  SCAN\nEND\nPATHFIND', color: '#22d3ee' },
  { title: 'THE TURRET', desc: 'Energy-efficient static defense with manual rotation.', code: 'FUNCTION defend\n  SCAN\n  IF scanned_distance < 150 THEN\n    BURST_FIRE\n    WAIT 10\n  ELSE\n    SET rotation = rotation + 0.05\n  END\nEND\nSTOP\nWHILE TRUE DO CALL defend END', color: '#f97316' },
  { title: 'THE JITTERBUG', desc: 'Chaotic movement offsets to bypass enemy trajectory prediction.', code: 'SET offset = 1\nWHILE TRUE DO\n  MOVE_FAST\n  SET rotation = rotation + (offset * 0.5)\n  SET offset = offset * -1\n  IF CAN_SEE_ENEMY THEN FIRE END\n  WAIT 3\nEND', color: '#a855f7' },
];

// ---------------------------------------------------------------------------
// Rotation system guide
// ---------------------------------------------------------------------------

export interface RotationExample {
  title: string;
  description: string;
  code: string;
  result: string;
}

export interface ConflictRule {
  scenario: string;
  outcome: string;
}

export interface RotationSystemGuide {
  controls: {
    name: string;
    alias?: string[];
    controls: string;
    affectsMovement: boolean;
    affectsVision: boolean;
    description: string;
  }[];
  angleReference: { value: string; direction: string; label: string }[];
  examples: RotationExample[];
  conflictRules: ConflictRule[];
}

export const ROTATION_SYSTEM_GUIDE: RotationSystemGuide = {
  controls: [
    {
      name: 'rotation',
      alias: ['angle', 'rot'],
      controls: 'Robot body & tracks',
      affectsMovement: true,
      affectsVision: false,
      description: 'Controls which direction the robot drives. Physics auto-updates it when moving. Does NOT touch fovDirection ever.'
    },
    {
      name: 'fovDirection',
      controls: 'Scanner cone (eyes)',
      affectsMovement: false,
      affectsVision: true,
      description: 'Controls where the FOV cone points. Completely independent from body. CAN_SEE_ENEMY checks this cone only.'
    },
    {
      name: 'lockVision',
      controls: 'Links body + scanner',
      affectsMovement: false,
      affectsVision: false,
      description: 'When TRUE, fovDirection auto-follows rotation every tick. Auto-disables when SET rotation or SET fovDirection is used manually.'
    }
  ],
  angleReference: [
    { value: '0',     direction: '→', label: 'Right (East)' },
    { value: '1.57',  direction: '↓', label: 'Down (South)' },
    { value: '3.14',  direction: '←', label: 'Left (West)' },
    { value: '-1.57', direction: '↑', label: 'Up (North)' },
    { value: '4.71',  direction: '↑', label: 'Up (North) alt' },
  ],
  examples: [
    {
      title: 'Basic — Move and shoot forward',
      description: 'Simplest setup: scanner follows body, fires anything in front.',
      code: `SET lockVision = TRUE
WHILE TRUE DO
  MOVE
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END`,
      result: 'Robot drives forward, shoots anything its body faces.'
    },
    {
      title: 'Rear-View — Eyes in the back of the head',
      description: 'Body drives East, scanner watches West. Detects enemies sneaking up from behind.',
      code: `SET rotation = 0
SET fovDirection = 3.14
WHILE TRUE DO
  MOVE
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END`,
      result: 'Robot moves right while watching left. Fires at enemies behind it.'
    },
    {
      title: 'Sweep Radar — Spinning scanner while moving',
      description: 'SCAN rotates scanner +15° per call. Full 360° sweep while driving.',
      code: `WHILE TRUE DO
  MOVE
  SCAN
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END`,
      result: 'Robot drives forward, scanner sweeps full circle, fires on detection.'
    },
    {
      title: 'Sniper Tower — Stand still, guard a direction',
      description: 'Robot never moves. Scanner fixed East. Fires anything entering cone.',
      code: `SET fovDirection = 0
WHILE TRUE DO
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END`,
      result: 'Static guardian. Only shoots enemies entering its fixed cone.'
    },
    {
      title: 'Split Brain — Move South, watch North',
      description: 'Body and scanner pointing opposite directions simultaneously.',
      code: `SET lockVision = TRUE
SET rotation = 1.57
MOVE
WAIT 20
SET fovDirection = -1.57
WHILE TRUE DO
  MOVE
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END`,
      result: 'Drives South. After 20 ticks lockVision disables. Scanner points North. Rear-eye mode.'
    }
  ],
  conflictRules: [
    { scenario: 'lockVision ON + SET rotation = X',    outcome: 'lockVision disables. Body turns to X. Scanner stays at last position.' },
    { scenario: 'lockVision ON + SET fovDirection = X', outcome: 'lockVision disables. Scanner turns to X. Body stays unchanged.' },
    { scenario: 'lockVision ON + MOVE',                outcome: 'Body rotates from physics. Scanner follows (lockVision still ON).' },
    { scenario: 'lockVision ON + SCAN',                outcome: 'Scanner rotates +15°. Next tick lockVision re-syncs scanner to body.' },
    { scenario: 'lockVision OFF + MOVE',               outcome: 'Body rotates from physics. Scanner frozen at last position.' },
    { scenario: 'lockVision OFF + SET rotation = X',   outcome: 'Body turns to X. Scanner completely unaffected.' },
    { scenario: 'lockVision OFF + SET fovDirection = X', outcome: 'Scanner turns to X. Body completely unaffected.' },
  ]
};
