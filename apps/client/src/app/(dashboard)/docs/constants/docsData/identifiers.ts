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
