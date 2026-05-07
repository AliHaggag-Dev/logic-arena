import { GameLoop } from '@logic-arena/engine';
import { PATH_CONFIG, GridCell } from './types';

/**
 * Builds and caches the A* navigational grid.
 */
export class GridBuilder {
  public impassable: boolean[][] = [];
  public costMult: number[][] = [];
  private gridReady = false;

  constructor(private readonly gameLoop: GameLoop) {}

  /** Marks the grid for reconstruction on the next pathfind operation. */
  invalidateGrid(): void {
    this.gridReady = false;
  }

  /** Safely builds the grid only when required. Obstacles are stable mid-match. */
  ensureGrid(): void {
    if (this.gridReady) return;
    this.gridReady = true;

    this.impassable = Array.from({ length: PATH_CONFIG.ROWS }, () =>
      new Array(PATH_CONFIG.COLS).fill(false),
    );
    this.costMult = Array.from({ length: PATH_CONFIG.ROWS }, () =>
      new Array(PATH_CONFIG.COLS).fill(1.0),
    );

    // Padding prevents physical collisions when navigating tight spaces
    const PAD = 1;

    for (const obs of this.gameLoop.getObstacles()) {
      const c0 = Math.floor(
        (obs.position.x - obs.width / 2) / PATH_CONFIG.CELL,
      );
      const c1 = Math.floor(
        (obs.position.x + obs.width / 2) / PATH_CONFIG.CELL,
      );
      const r0 = Math.floor(
        (obs.position.y - obs.height / 2) / PATH_CONFIG.CELL,
      );
      const r1 = Math.floor(
        (obs.position.y + obs.height / 2) / PATH_CONFIG.CELL,
      );

      if (obs.type === 'SOLID') {
        for (
          let r = Math.max(0, r0 - PAD);
          r <= Math.min(PATH_CONFIG.ROWS - 1, r1 + PAD);
          r++
        ) {
          for (
            let c = Math.max(0, c0 - PAD);
            c <= Math.min(PATH_CONFIG.COLS - 1, c1 + PAD);
            c++
          ) {
            this.impassable[r][c] = true;
          }
        }
      } else {
        const cost =
          obs.type === 'LAVA' ? PATH_CONFIG.COST_LAVA : PATH_CONFIG.COST_TRAP;
        for (
          let r = Math.max(0, r0);
          r <= Math.min(PATH_CONFIG.ROWS - 1, r1);
          r++
        ) {
          for (
            let c = Math.max(0, c0);
            c <= Math.min(PATH_CONFIG.COLS - 1, c1);
            c++
          ) {
            this.costMult[r][c] = cost;
          }
        }
      }
    }
  }

  /**
   * Snaps a potentially blocked target coordinate to the nearest safe grid cell using a BFS shell check.
   */
  nearestWalkable(r: number, c: number): GridCell | null {
    for (let radius = 0; radius <= 3; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          // Process only the outer shell for this radius level
          if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;

          const nr = r + dr;
          const nc = c + dc;

          if (
            nr >= 0 &&
            nr < PATH_CONFIG.ROWS &&
            nc >= 0 &&
            nc < PATH_CONFIG.COLS &&
            !this.impassable[nr][nc]
          ) {
            return { r: nr, c: nc };
          }
        }
      }
    }
    return null;
  }
}
