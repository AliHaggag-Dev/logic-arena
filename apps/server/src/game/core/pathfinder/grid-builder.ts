import { GameLoop } from '@logic-arena/engine';
import { PATH_CONFIG, GridCell, Vec2 } from './types';

interface WalkableCandidate extends GridCell {
  score: number;
}

const CLIP_EPSILON = 0.000001;

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

  /** Returns true when a robot center segment keeps physical clearance from all solid obstacles. */
  hasWorldClearance(a: Vec2, b: Vec2, relaxed = false): boolean {
    const clearance = relaxed ? 1 : PATH_CONFIG.ROBOT_RADIUS + PATH_CONFIG.CLEARANCE_MARGIN;

    for (const obs of this.gameLoop.getObstacles()) {
      if (obs.type !== 'SOLID') continue;

      const cos = Math.cos(-obs.rotation);
      const sin = Math.sin(-obs.rotation);
      const localA = this.toLocalPoint(a, obs.position, cos, sin);
      const localB = this.toLocalPoint(b, obs.position, cos, sin);

      if (
        this.segmentIntersectsAabb(
          localA,
          localB,
          obs.width / 2 + clearance,
          obs.height / 2 + clearance,
        )
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Snaps a potentially blocked coordinate to the nearest safe grid cell.
   * When an origin is provided, prefer cells physically reachable from that exact world position.
   */
  nearestWalkable(r: number, c: number, origin?: Vec2): GridCell | null {
    let best: WalkableCandidate | null = null;

    for (let radius = 0; radius <= PATH_CONFIG.SNAP_SEARCH_RADIUS; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          // Process only the outer shell for this radius level
          if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;

          const nr = r + dr;
          const nc = c + dc;

          if (!this.isWalkable(nr, nc)) continue;

          const center = this.cellCenter(nr, nc);
          if (origin && !this.hasWorldClearance(origin, center, true)) continue;

          const score = origin
            ? Math.hypot(origin.x - center.x, origin.y - center.y)
            : Math.hypot(r - nr, c - nc);

          if (!best || score < best.score) {
            best = { r: nr, c: nc, score };
          }
        }
      }

      const selected = best;
      if (selected) return { r: selected.r, c: selected.c };
    }

    return null;
  }

  private isWalkable(r: number, c: number): boolean {
    return (
      r >= 0 &&
      r < PATH_CONFIG.ROWS &&
      c >= 0 &&
      c < PATH_CONFIG.COLS &&
      !this.impassable[r][c]
    );
  }

  private cellCenter(r: number, c: number): Vec2 {
    return {
      x: c * PATH_CONFIG.CELL + PATH_CONFIG.CELL / 2,
      y: r * PATH_CONFIG.CELL + PATH_CONFIG.CELL / 2,
    };
  }

  private toLocalPoint(
    point: Vec2,
    origin: Vec2,
    cos: number,
    sin: number,
  ): Vec2 {
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;

    return {
      x: dx * cos - dy * sin,
      y: dx * sin + dy * cos,
    };
  }

  private segmentIntersectsAabb(
    a: Vec2,
    b: Vec2,
    halfWidth: number,
    halfHeight: number,
  ): boolean {
    let tMin = 0;
    let tMax = 1;
    const delta = { x: b.x - a.x, y: b.y - a.y };

    const xRange = this.clipSegmentAxis(
      a.x,
      delta.x,
      -halfWidth,
      halfWidth,
      tMin,
      tMax,
    );
    if (!xRange) return false;
    tMin = xRange.min;
    tMax = xRange.max;

    const yRange = this.clipSegmentAxis(
      a.y,
      delta.y,
      -halfHeight,
      halfHeight,
      tMin,
      tMax,
    );
    return yRange !== null;
  }

  private clipSegmentAxis(
    start: number,
    delta: number,
    min: number,
    max: number,
    tMin: number,
    tMax: number,
  ): { min: number; max: number } | null {
    if (Math.abs(delta) < CLIP_EPSILON) {
      return start >= min && start <= max ? { min: tMin, max: tMax } : null;
    }

    const invDelta = 1 / delta;
    let near = (min - start) * invDelta;
    let far = (max - start) * invDelta;

    if (near > far) {
      const previousNear = near;
      near = far;
      far = previousNear;
    }

    const clippedMin = Math.max(tMin, near);
    const clippedMax = Math.min(tMax, far);
    return clippedMin <= clippedMax
      ? { min: clippedMin, max: clippedMax }
      : null;
  }
}
