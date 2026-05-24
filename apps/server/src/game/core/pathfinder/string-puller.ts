import { PATH_CONFIG, GridCell, Vec2 } from './types';

/**
 * Implements Bresenham's line algorithm for line-of-sight checks.
 * Used to "pull the string" on A* grid paths to smooth them into straight-line segments.
 */
export class StringPuller {
  constructor(private readonly impassable: boolean[][]) {}

  /**
   * Performs a Bresenham line-of-sight check on the impassable grid.
   * Returns true if no SOLID cell lies anywhere between point a and point b.
   */
  hasLOS(a: GridCell, b: GridCell): boolean {
    let { r: r0, c: c0 } = a;
    const { r: r1, c: c1 } = b;

    const dr = Math.abs(r1 - r0);
    const dc = Math.abs(c1 - c0);
    const sr = r0 < r1 ? 1 : -1;
    const sc = c0 < c1 ? 1 : -1;
    let err = dr - dc;

    while (true) {
      if (this.impassable[r0]?.[c0]) return false;
      if (r0 === r1 && c0 === c1) return true;

      let steppedR = false;
      let steppedC = false;

      const e2 = 2 * err;
      if (e2 > -dc) {
        err -= dc;
        r0 += sr;
        steppedR = true;
      }
      if (e2 < dr) {
        err += dr;
        c0 += sc;
        steppedC = true;
      }

      if (steppedR && steppedC) {
        if (
          this.impassable[r0 - sr]?.[c0] ||
          this.impassable[r0]?.[c0 - sc]
        ) {
          return false;
        }
      }
    }
  }

  /**
   * Optimizes a raw grid-based A* path by removing intermediate waypoints
   * that have direct line-of-sight to subsequent waypoints.
   */
  smoothPath(raw: GridCell[]): Vec2[] {
    if (raw.length === 0) return [];

    // String-pulling: convert staircase grid path into smooth straight-line segments.
    const smooth: GridCell[] = [raw[0]];
    let anchor = 0;

    for (let i = 2; i < raw.length; i++) {
      if (!this.hasLOS(raw[anchor], raw[i])) {
        smooth.push(raw[i - 1]);
        anchor = i - 1;
      }
    }

    if (raw.length > 1) {
      smooth.push(raw[raw.length - 1]);
    }

    // Convert grid cells to absolute world-space coordinate centres
    return smooth.map((n) => ({
      x: n.c * PATH_CONFIG.CELL + PATH_CONFIG.CELL / 2,
      y: n.r * PATH_CONFIG.CELL + PATH_CONFIG.CELL / 2,
    }));
  }
}
