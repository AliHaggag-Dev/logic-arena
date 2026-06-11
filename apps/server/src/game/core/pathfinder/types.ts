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
  ROBOT_RADIUS: number;
  CLEARANCE_MARGIN: number;
  SNAP_SEARCH_RADIUS: number;
  STUCK_RECOMPUTE_TICKS: number;
  STUCK_PROGRESS_EPSILON: number;
}

export const PATH_CONFIG: PathfinderConfig = {
  COLS: 40,
  ROWS: 30,
  CELL: 20,
  SPEED: 150,
  MAX_ITER: 1200,
  COST_TRAP: 3.0,
  COST_LAVA: 6.0,
  WP_RADIUS: 8,
  RECOMPUTE_DIST: 8,
  ROBOT_RADIUS: 15,
  CLEARANCE_MARGIN: 3,
  SNAP_SEARCH_RADIUS: 6,
  STUCK_RECOMPUTE_TICKS: 60,
  STUCK_PROGRESS_EPSILON: 1,
};
