export interface Vec2 {
  x: number;
  y: number;
}

export interface GridCell {
  r: number;
  c: number;
}

export interface PathfinderConfig {
  COLS: number;
  ROWS: number;
  CELL: number;
  SPEED: number;
  MAX_ITER: number;
  COST_TRAP: number;
  COST_LAVA: number;
  WP_RADIUS: number;
  RECOMPUTE_DIST: number;
}

export const PATH_CONFIG: PathfinderConfig = {
  COLS: 40,
  ROWS: 30,
  CELL: 20,
  SPEED: 150,
  MAX_ITER: 1200,
  COST_TRAP: 3.0,
  COST_LAVA: 6.0,
  WP_RADIUS: 25,
  RECOMPUTE_DIST: 90,
};
