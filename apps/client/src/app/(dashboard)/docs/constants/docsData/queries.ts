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
