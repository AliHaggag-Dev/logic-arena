import { MinHeap, HeapNode } from './min-heap';
import { GridBuilder } from './grid-builder';
import { StringPuller } from './string-puller';
import { PATH_CONFIG, Vec2 } from './types';

/**
 * Pure A* implementation utilizing the injected GridBuilder.
 */
export class AStarProtocol {
  constructor(private readonly gridBuilder: GridBuilder) {}

  /**
   * Octile-distance heuristic — admissible for 8-directional grids.
   * Ensures A* doesn't overestimate diagonal costs, guaranteeing optimal paths.
   */
  private octile(dR: number, dC: number): number {
    const [a, b] = dR > dC ? [dR, dC] : [dC, dR];
    return a - b + 1.414 * b;
  }

  /** Converts an (r, c) coordinate pair to a unique contiguous integer key. */
  private key(r: number, c: number): number {
    return r * PATH_CONFIG.COLS + c;
  }

  /**
   * Evaluates the shortest valid path from start to target world coordinates
   * applying octile heuristics and diagonal corner-cut detection.
   */
  performAStar(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
  ): Vec2[] {
    const sC = Math.min(
      PATH_CONFIG.COLS - 1,
      Math.max(0, Math.floor(startX / PATH_CONFIG.CELL)),
    );
    const sR = Math.min(
      PATH_CONFIG.ROWS - 1,
      Math.max(0, Math.floor(startY / PATH_CONFIG.CELL)),
    );
    let tC = Math.min(
      PATH_CONFIG.COLS - 1,
      Math.max(0, Math.floor(targetX / PATH_CONFIG.CELL)),
    );
    let tR = Math.min(
      PATH_CONFIG.ROWS - 1,
      Math.max(0, Math.floor(targetY / PATH_CONFIG.CELL)),
    );

    // Abort if origin is inside a SOLID block
    if (this.gridBuilder.impassable[sR]?.[sC]) return [];

    // Snap a blocked target to the safest adjacent walkable cell
    if (this.gridBuilder.impassable[tR]?.[tC]) {
      const snapped = this.gridBuilder.nearestWalkable(tR, tC);
      if (!snapped) return [];
      tR = snapped.r;
      tC = snapped.c;
    }

    // Already occupying the same cell constraint — abort pathing
    if (sR === tR && sC === tC) return [];

    const gScore = new Map<number, number>();
    const parent = new Map<number, number>();
    const closed = new Set<number>();

    const heap = new MinHeap<HeapNode>();

    const startKey = this.key(sR, sC);
    const h0 = this.octile(Math.abs(tR - sR), Math.abs(tC - sC));
    gScore.set(startKey, 0);
    heap.push({ f: h0, g: 0, h: h0, r: sR, c: sC, parentKey: -1 });

    const DIRS = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0], // cardinal
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1], // diagonal
    ];

    let iters = 0;

    while (heap.size > 0 && iters < PATH_CONFIG.MAX_ITER) {
      iters++;
      const cur = heap.pop()!;
      const curKey = this.key(cur.r, cur.c);

      // Lazy deletion for stale heap nodes
      if (closed.has(curKey)) continue;
      closed.add(curKey);

      if (cur.r === tR && cur.c === tC) {
        return this.reconstruct(curKey, startKey, parent);
      }

      for (const [dr, dc] of DIRS) {
        const nr = cur.r + dr;
        const nc = cur.c + dc;

        if (
          nr < 0 ||
          nr >= PATH_CONFIG.ROWS ||
          nc < 0 ||
          nc >= PATH_CONFIG.COLS
        )
          continue;
        if (this.gridBuilder.impassable[nr][nc]) continue;

        // Diagonal corner-cut prevention to stop robots clipping geometry apexes
        if (dr !== 0 && dc !== 0) {
          if (
            this.gridBuilder.impassable[cur.r + dr]?.[cur.c] ||
            this.gridBuilder.impassable[cur.r]?.[cur.c + dc]
          ) {
            continue;
          }
        }

        const nKey = this.key(nr, nc);
        if (closed.has(nKey)) continue;

        const moveCost = dr !== 0 && dc !== 0 ? 1.414 : 1.0;
        const tG = cur.g + moveCost * this.gridBuilder.costMult[nr][nc];
        const bestG = gScore.get(nKey) ?? Infinity;

        if (tG < bestG) {
          gScore.set(nKey, tG);
          parent.set(nKey, curKey);
          const tH = this.octile(Math.abs(tR - nr), Math.abs(tC - nc));
          heap.push({
            f: tG + tH,
            g: tG,
            h: tH,
            r: nr,
            c: nc,
            parentKey: curKey,
          });
        }
      }
    }

    return [];
  }

  /** Trace parent references back to the start node to form the topological path chain. */
  private reconstruct(
    goalKey: number,
    startKey: number,
    parent: Map<number, number>,
  ): Vec2[] {
    const raw: { r: number; c: number }[] = [];
    let k: number | undefined = goalKey;

    while (k !== undefined && k !== -1) {
      raw.push({
        r: Math.floor(k / PATH_CONFIG.COLS),
        c: k % PATH_CONFIG.COLS,
      });
      k = k === startKey ? undefined : parent.get(k);
    }
    raw.reverse();

    const stringPuller = new StringPuller(this.gridBuilder.impassable);
    return stringPuller.smoothPath(raw);
  }
}
