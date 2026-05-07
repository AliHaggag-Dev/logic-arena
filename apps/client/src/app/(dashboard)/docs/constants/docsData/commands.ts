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
  { command: 'FOR...TO...DO...END', category: 'Control Flow', parameters: 'assignment, limit', description: 'Deterministic looping logic. Executes a block a fixed number of times. Crucial for writing O(N) linear array traversals that stay within TLE limits.', example: 'FOR i = 0 TO LENGTH(enemies) DO SET current = enemies[i] END', energyCost: 'Free' },
  { command: 'WHILE...DO...END', category: 'Control Flow', parameters: 'condition', description: 'Looping logic. Executes block while condition is true. Auto-capped at 10 iter/tick. WARNING: Nested WHILE loops can easily trigger TLE crashes (O(N²)).', example: 'WHILE spotted DO FIRE WAIT 1 END', energyCost: 'Free' },
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
