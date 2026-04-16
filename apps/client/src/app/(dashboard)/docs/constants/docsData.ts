export interface CommandDoc {
  command:     string;
  category:    string;
  parameters:  string;
  description: string;
  example:     string;
  energyCost?: string; // AliScript v2.0 addition
}

export const COMMAND_TABLE: CommandDoc[] = [
  // --- Control Flow ---
  { command: 'IF...THEN...ELSE...END', category: 'Control Flow',  parameters: 'condition',    description: 'Branching logic with optional else clause. Must be closed with END.',                        example: 'IF health < 50 THEN BACKUP ELSE FIRE END',          energyCost: 'Free' },
  { command: 'WHILE...DO...END',       category: 'Control Flow',  parameters: 'condition',    description: 'Looping logic. Executes block while condition is true. Auto-capped at 10 iter/tick.',     example: 'WHILE spotted DO FIRE WAIT 1 END',                  energyCost: 'Free' },
  { command: 'FUNCTION / CALL',        category: 'Control Flow',  parameters: 'name',         description: 'Define reusable neural pathways (functions) and invoke them.',                             example: 'FUNCTION retreat BACKUP END CALL retreat',          energyCost: 'Free' },
  // --- Movement ---
  { command: 'MOVE',                   category: 'Movement',      parameters: '—',            description: 'Standard forward propulsion.',                                                             example: 'MOVE',                                              energyCost: '1/tick' },
  { command: 'MOVE_FAST',              category: 'Movement',      parameters: '—',            description: 'High-speed forward propulsion. Burns 3× the energy of MOVE.',                            example: 'MOVE_FAST',                                         energyCost: '3/tick' },
  { command: 'BACKUP',                 category: 'Movement',      parameters: '—',            description: 'Reverse thrust. Same cost as MOVE.',                                                      example: 'BACKUP',                                            energyCost: '1/tick' },
  { command: 'PATHFIND',               category: 'Movement',      parameters: '—',            description: 'Weighted A* pathfinding toward nearest visible target, avoiding obstacles.',              example: 'PATHFIND',                                          energyCost: '2/tick' },
  { command: 'STOP',                   category: 'Movement',      parameters: '—',            description: 'Halt all movement.',                                                                       example: 'STOP',                                              energyCost: 'Free'  },
  // --- Sensors ---
  { command: 'SCAN',                   category: 'Sensors',       parameters: '—',            description: 'Rotates FOV cone +15°/call to sweep the environment. Populates scanned_distance, scanned_angle, scanned_spotted. Works during STASIS.', example: 'SCAN',      energyCost: '5/use' },
  { command: 'WAIT',                   category: 'Sensors',       parameters: 'N: ticks',     description: 'Suspends code execution for N ticks. 60 ticks ≈ 1 second.',                              example: 'WAIT 30',                                           energyCost: 'Free'  },
  // --- Attack ---
  { command: 'FIRE',                   category: 'Attack',        parameters: '—',            description: 'Single precision shot toward nearest visible enemy.',                                     example: 'FIRE',                                              energyCost: '15/shot' },
  { command: 'BURST_FIRE',             category: 'Attack',        parameters: '—',            description: 'Rapid multi-shot burst. Higher damage, higher energy cost.',                             example: 'BURST_FIRE',                                        energyCost: '20/shot' },
  // --- Intelligence ---
  { command: 'SET var = expr',         category: 'Intelligence',  parameters: 'expression',   description: 'Assign values using math operators (+, -, *, /, %). Executes even during STASIS.',      example: 'SET rotation = rotation + 0.1',                     energyCost: 'Free'  },
  { command: 'NOT / TRUE / FALSE',     category: 'Intelligence',  parameters: 'booleans',     description: 'Logical operators and boolean constants for advanced conditions.',                         example: 'IF NOT CAN_SEE_ENEMY THEN SCAN',                    energyCost: 'Free'  },
];

// ---------------------------------------------------------------------------
// New v2.0 Read-Only Identifiers
// ---------------------------------------------------------------------------

export interface IdentifierDoc {
  name:        string;
  type:        string;
  category:    string;
  description: string;
}

export const IDENTIFIER_TABLE: IdentifierDoc[] = [
  // Legacy
  { name: 'health',            type: 'number',  category: 'Self',       description: 'Current HP (0–100).' },
  { name: 'rotation',          type: 'number',  category: 'Movement',   description: 'Body facing angle in radians. Writable via SET. Acts as the Steering Wheel — also updates velocity direction.' },
  { name: 'angle',             type: 'number',  category: 'Movement',   description: 'Alias for rotation. Accepted by all SET commands.' },
  { name: 'rot',               type: 'number',  category: 'Movement',   description: 'Short alias for rotation. Accepted by all SET commands.' },
  { name: 'fovDirection',      type: 'number',  category: 'Vision',     description: 'Scanner eye angle in radians. Independent from body rotation. SET fovDirection = X to aim the scanner separately from where the robot is moving.' },
  { name: 'lockVision',        type: 'flag',    category: 'Vision',     description: 'SET lockVision = TRUE to sync fovDirection to rotation every tick. Turns the scanner into a fixed headlamp locked to the body.' },
  { name: 'distance',          type: 'number',  category: 'Combat',     description: 'Distance to nearest VISIBLE enemy. Infinity if none in FOV.' },
  { name: 'spotted',           type: 'boolean', category: 'Combat',     description: 'True if any enemy is within FOV cone. Alias for CAN_SEE_ENEMY.' },
  { name: 'bullet_speed',      type: 'number',  category: 'Combat',     description: 'Projectile velocity constant (400 arena units/sec).' },
  // Energy — new
  { name: 'MY_ENERGY',         type: 'number',  category: 'Energy',     description: 'Current energy level (0–1000).' },
  { name: 'ENERGY_PCT',        type: 'number',  category: 'Energy',     description: 'Energy as percentage (0–100). Useful for threshold checks.' },
  { name: 'IN_STASIS',         type: 'boolean', category: 'Energy',     description: 'True when energy ≤ 0. Movement and fire are blocked until energy ≥ 50.' },
  // FOV — new
  { name: 'CAN_SEE_ENEMY',      type: 'boolean', category: 'FOV',       description: 'True if one or more enemies are within the current FOV cone.' },
  { name: 'VISIBLE_ENEMY_COUNT',type: 'number',  category: 'FOV',       description: 'Number of enemies currently within the FOV cone.' },
  { name: 'NEAREST_VISIBLE_X',  type: 'number',  category: 'FOV',       description: 'X coordinate of the nearest visible enemy. Returns own X if none visible.' },
  { name: 'NEAREST_VISIBLE_Y',  type: 'number',  category: 'FOV',       description: 'Y coordinate of the nearest visible enemy. Returns own Y if none visible.' },
  { name: 'FOV_ANGLE',          type: 'number',  category: 'FOV',       description: 'Current FOV cone angle in degrees (default 120°).' },
  // Scan memory
  { name: 'scanned_distance',   type: 'number',  category: 'Scan',      description: 'Distance to nearest visible enemy as of last SCAN call.' },
  { name: 'scanned_angle',      type: 'number',  category: 'Scan',      description: 'Angle toward nearest visible enemy as of last SCAN call.' },
  { name: 'scanned_spotted',    type: 'boolean', category: 'Scan',      description: 'True if any enemy was visible during the last SCAN call.' },
];

// ---------------------------------------------------------------------------
// Algorithm Challenges (new)
// ---------------------------------------------------------------------------

export interface AlgorithmChallenge {
  title:       string;
  badge:       string;
  description: string;
  difficulty:  'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  concept:     string;
  code:        string;
  color:       string;
}

export const ALGORITHM_CHALLENGES: AlgorithmChallenge[] = [
  {
    title:       'Spiral Search Pattern',
    badge:       '🔍',
    description: 'Continuously rotate the FOV with SCAN until an enemy enters vision, then engage. Classic search algorithm applied to robot combat.',
    difficulty:  'BEGINNER',
    concept:     'FOV Sweep / Detection Loop',
    color:       '#22d3ee',
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
    title:       'Energy-Efficient Sniper',
    badge:       '⚡',
    description: 'Only fire when energy is sufficient and the enemy is visible. Recharges passively when low. Maximises the Efficiency Score metric.',
    difficulty:  'INTERMEDIATE',
    concept:     'Resource-Aware Decision Making',
    color:       '#a855f7',
    code:
`// ── Energy-Efficient Sniper ────────────────────
// Optimises damage-per-energy-unit to achieve a
// high EFFICIENCY_SCORE at match end.

WHILE TRUE DO
  IF IN_STASIS THEN
    // Cannot act — scan is still allowed, costs 5
    SCAN
    WAIT 5
  ELSE
    IF MY_ENERGY < 100 THEN
      // Conserve — stop and regenerate
      STOP
      SCAN
      WAIT 3
    ELSE
      IF CAN_SEE_ENEMY THEN
        IF ENERGY_PCT > 40 THEN
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
    title:       'Defensive Regeneration Loop',
    badge:       '🛡️',
    description: 'Detect STASIS entry, back away from the last known enemy position, and wait for energy to recover before re-engaging.',
    difficulty:  'ADVANCED',
    concept:     'State Machine / Stasis Recovery',
    color:       '#f97316',
    code:
`// ── Defensive Regeneration Loop ────────────────
// A two-state machine: COMBAT and RECOVERY.
// Switches states based on IN_STASIS and ENERGY_PCT.

SET mode = 0

WHILE TRUE DO
  IF IN_STASIS THEN
    // Forced recovery — cannot fire or move
    SET mode = 1
    SCAN
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
// Existing exports (unchanged)
// ---------------------------------------------------------------------------

export const QUICK_REF = [
  { title: 'CONTROL FLOW', icon: '⬡', color: '#f59e0b', commands: ['IF...ELSE', 'WHILE...DO', 'FUNCTION', 'CALL', 'END'] },
  { title: 'SENSORS / FOV', icon: '◈', color: '#22d3ee', commands: ['SCAN', 'WAIT', 'CAN_SEE_ENEMY', 'NEAREST_VISIBLE_X/Y', 'FOV_ANGLE'] },
  { title: 'MOVEMENT & VISION', icon: '⦾', color: '#4ade80', commands: ['rotation / angle / rot', 'fovDirection (Eye)', 'lockVision (Link)', 'SET rotation = 1.57', 'PATHFIND'] },
  { title: 'ENERGY',        icon: '⚡', color: '#a855f7', commands: ['MY_ENERGY', 'ENERGY_PCT', 'IN_STASIS'] },
  { title: 'INTELLIGENCE',  icon: '◉', color: '#6366f1', commands: ['SET var = val', 'Math (+,-,*,/,%)', 'Logic (NOT,TRUE,FALSE)', 'rotation'] },
];

export const SAMPLE_SCRIPT =
`// The Energy-Aware Stalker v2.0
WHILE TRUE DO
  IF IN_STASIS THEN
    SCAN
    WAIT 5
  ELSE
    IF CAN_SEE_ENEMY THEN
      IF MY_ENERGY > 200 THEN
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

export const CATEGORY_COLORS: Record<string, string> = {
  'Control Flow':    '#f59e0b',
  Movement:          '#4ade80',
  Vision:            '#22d3ee',
  Sensors:           '#06b6d4',
  Attack:            '#f97316',
  Tactics:           '#facc15',
  'Advanced Combat': '#ef4444',
  Evasion:           '#22c55e',
  Intelligence:      '#a855f7',
  Energy:            '#818cf8',
  FOV:               '#22d3ee',
  Scan:              '#67e8f9',
  Self:              '#94a3b8',
  Combat:            '#f87171',
  flag:              '#4ade80',
};

export const TACTICS_DATA = [
  { title: 'THE STALKER',   desc: 'Sensor-loop logic for hyper-accurate target acquisition.',                 code: '// Adaptive Scan Loop\nSCAN\nWHILE NOT scanned_spotted DO\n  SET rotation = rotation + 0.1\n  WAIT 2\n  SCAN\nEND\nPATHFIND',                                                                                                                              color: '#22d3ee' },
  { title: 'THE TURRET',    desc: 'Energy-efficient static defense with manual rotation.',                    code: 'FUNCTION defend\n  SCAN\n  IF scanned_distance < 150 THEN\n    BURST_FIRE\n    WAIT 10\n  ELSE\n    SET rotation = rotation + 0.05\n  END\nEND\nSTOP\nWHILE TRUE DO CALL defend END',                                                                     color: '#f97316' },
  { title: 'THE JITTERBUG', desc: 'Chaotic movement offsets to bypass enemy trajectory prediction.',          code: 'SET offset = 1\nWHILE TRUE DO\n  MOVE_FAST\n  SET rotation = rotation + (offset * 0.5)\n  SET offset = offset * -1\n  IF CAN_SEE_ENEMY THEN FIRE END\n  WAIT 3\nEND',                                                                              color: '#a855f7' },
];
