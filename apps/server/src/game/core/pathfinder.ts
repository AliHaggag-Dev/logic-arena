import { GameLoop, Robot } from "@logic-arena/engine";
import { CombatMath } from "./combat-math";

// ─── Binary min-heap ────────────────────────────────────────────────────────
// Used as the A* open set — O(log n) push/pop vs the old O(n) linear scan.
interface HeapNode {
  f: number;
  g: number;
  h: number;
  r: number;
  c: number;
  parentKey: number; // r * COLS + c of parent (-1 for start)
}

class MinHeap {
  private data: HeapNode[] = [];

  get size(): number { return this.data.length; }

  push(node: HeapNode): void {
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): HeapNode | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.data[p].f <= this.data[i].f) break;
      [this.data[p], this.data[i]] = [this.data[i], this.data[p]];
      i = p;
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let min = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.data[l].f < this.data[min].f) min = l;
      if (r < n && this.data[r].f < this.data[min].f) min = r;
      if (min === i) break;
      [this.data[min], this.data[i]] = [this.data[i], this.data[min]];
      i = min;
    }
  }
}

// ─── Pathfinder ──────────────────────────────────────────────────────────────
export class Pathfinder {
  // Grid dimensions — 800×600 arena / 20px cells = 40×30
  private readonly COLS      = 40;
  private readonly ROWS      = 30;
  private readonly CELL      = 20;   // world-units per cell
  private readonly SPEED     = 150;  // world-units per tick (matches MovementExecutor)

  // A* iteration budget — guarantees < 2ms on a 40×30 grid even in the worst case
  private readonly MAX_ITER  = 1200;

  // Traversal cost multipliers for penalty cells
  private readonly COST_TRAP = 3.0;
  private readonly COST_LAVA = 6.0;

  // Waypoint following
  private readonly WP_RADIUS = 25;   // px — advance past a waypoint when within this radius

  // Path cache — per robot, keyed by robot id
  private readonly pathCache  = new Map<string, { x: number; y: number }[]>();
  private readonly lastTarget = new Map<string, { x: number; y: number }>();
  // Enemy must move this many px before we recompute the path
  private readonly RECOMPUTE_DIST = 90;

  // Grid data — built once per match (obstacles are static)
  private impassable: boolean[][]  = [];  // true → SOLID, cannot enter
  private costMult:   number[][]   = [];  // traversal cost multiplier (1 = normal)
  private gridReady = false;

  constructor(private readonly gameLoop: GameLoop) {}

  // ── Grid management ─────────────────────────────────────────────────────────

  /** Called by the game on match start so the grid is definitely fresh. */
  invalidateGrid(): void { this.gridReady = false; }

  private ensureGrid(): void {
    if (this.gridReady) return;
    this.gridReady = true;

    this.impassable = Array.from({ length: this.ROWS }, () => new Array(this.COLS).fill(false));
    this.costMult   = Array.from({ length: this.ROWS }, () => new Array(this.COLS).fill(1.0));

    // 1-cell padding around SOLID walls so the robot body doesn't scrape edges
    const PAD = 1;

    for (const obs of this.gameLoop.getObstacles()) {
      const c0 = Math.floor((obs.position.x - obs.width  / 2) / this.CELL);
      const c1 = Math.floor((obs.position.x + obs.width  / 2) / this.CELL);
      const r0 = Math.floor((obs.position.y - obs.height / 2) / this.CELL);
      const r1 = Math.floor((obs.position.y + obs.height / 2) / this.CELL);

      if (obs.type === 'SOLID') {
        for (let r = Math.max(0, r0 - PAD); r <= Math.min(this.ROWS - 1, r1 + PAD); r++) {
          for (let c = Math.max(0, c0 - PAD); c <= Math.min(this.COLS - 1, c1 + PAD); c++) {
            this.impassable[r][c] = true;
          }
        }
      } else {
        const cost = obs.type === 'LAVA' ? this.COST_LAVA : this.COST_TRAP;
        for (let r = Math.max(0, r0); r <= Math.min(this.ROWS - 1, r1); r++) {
          for (let c = Math.max(0, c0); c <= Math.min(this.COLS - 1, c1); c++) {
            this.costMult[r][c] = cost;
          }
        }
      }
    }
  }

  // ── A* core ─────────────────────────────────────────────────────────────────

  /**
   * Octile-distance heuristic — admissible for 8-directional grids.
   * Old code used Manhattan which OVERESTIMATES diagonal movement → non-optimal paths.
   */
  private octile(dR: number, dC: number): number {
    const [a, b] = dR > dC ? [dR, dC] : [dC, dR];
    return (a - b) + 1.414 * b;
  }

  /** Convert (r, c) to a unique integer key for O(1) Map lookups. */
  private key(r: number, c: number): number { return r * this.COLS + c; }

  /**
   * Snap a potentially-blocked world position to the nearest walkable grid cell.
   * Used so A* always has a valid goal even when the enemy is overlapping a wall.
   */
  private nearestWalkable(r: number, c: number): { r: number; c: number } | null {
    for (let radius = 0; radius <= 3; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue; // only shell
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < this.ROWS && nc >= 0 && nc < this.COLS && !this.impassable[nr][nc]) {
            return { r: nr, c: nc };
          }
        }
      }
    }
    return null;
  }

  performAStar(
    startX: number, startY: number,
    targetX: number, targetY: number,
  ): { x: number; y: number }[] {
    const sC = Math.min(this.COLS - 1, Math.max(0, Math.floor(startX  / this.CELL)));
    const sR = Math.min(this.ROWS - 1, Math.max(0, Math.floor(startY  / this.CELL)));
    let   tC = Math.min(this.COLS - 1, Math.max(0, Math.floor(targetX / this.CELL)));
    let   tR = Math.min(this.ROWS - 1, Math.max(0, Math.floor(targetY / this.CELL)));

    // Bail if start is inside a wall (robot overlapping obstacle)
    if (this.impassable[sR]?.[sC]) return [];

    // Snap blocked target to nearest walkable — prevents empty-path on wall-overlap
    if (this.impassable[tR]?.[tC]) {
      const snapped = this.nearestWalkable(tR, tC);
      if (!snapped) return [];
      tR = snapped.r;
      tC = snapped.c;
    }

    // Already in the same cell — no path needed, caller falls back to direct steer
    if (sR === tR && sC === tC) return [];

    // ── Data structures ──────────────────────────────────────────────────────
    // gScore[key] = best known g for cell key
    const gScore = new Map<number, number>();
    // parent[key] = key of the cell we came from
    const parent = new Map<number, number>();
    // closed set
    const closed = new Set<number>();

    const heap = new MinHeap();

    const startKey  = this.key(sR, sC);
    const h0        = this.octile(Math.abs(tR - sR), Math.abs(tC - sC));
    gScore.set(startKey, 0);
    heap.push({ f: h0, g: 0, h: h0, r: sR, c: sC, parentKey: -1 });

    // 8 directions: [dr, dc]
    const DIRS = [
      [ 0,  1], [ 0, -1], [ 1,  0], [-1,  0],   // cardinals
      [ 1,  1], [ 1, -1], [-1,  1], [-1, -1],   // diagonals
    ];

    let iters = 0;

    while (heap.size > 0 && iters < this.MAX_ITER) {
      iters++;
      const cur = heap.pop()!;
      const curKey = this.key(cur.r, cur.c);

      if (closed.has(curKey)) continue; // lazy deletion — skip stale entries
      closed.add(curKey);

      // ── Goal check ───────────────────────────────────────────────────────
      if (cur.r === tR && cur.c === tC) {
        return this.reconstructAndSmooth(curKey, startKey, parent);
      }

      for (const [dr, dc] of DIRS) {
        const nr = cur.r + dr;
        const nc = cur.c + dc;

        if (nr < 0 || nr >= this.ROWS || nc < 0 || nc >= this.COLS) continue;
        if (this.impassable[nr][nc]) continue;

        // ── Diagonal corner-cut prevention ───────────────────────────────────
        // Without this, robots squeeze through single-cell wall gaps diagonally.
        if (dr !== 0 && dc !== 0) {
          if (this.impassable[cur.r + dr]?.[cur.c] || this.impassable[cur.r]?.[cur.c + dc]) continue;
        }

        const nKey = this.key(nr, nc);
        if (closed.has(nKey)) continue;

        const moveCost = dr !== 0 && dc !== 0 ? 1.414 : 1.0;
        const tG       = cur.g + moveCost * this.costMult[nr][nc];
        const bestG    = gScore.get(nKey) ?? Infinity;

        if (tG < bestG) {
          gScore.set(nKey, tG);
          parent.set(nKey, curKey);
          const tH = this.octile(Math.abs(tR - nr), Math.abs(tC - nc));
          heap.push({ f: tG + tH, g: tG, h: tH, r: nr, c: nc, parentKey: curKey });
        }
      }
    }

    return []; // iteration budget exhausted or no path
  }

  // ── Path reconstruction + smoothing ─────────────────────────────────────────

  private reconstructAndSmooth(
    goalKey: number,
    startKey: number,
    parent: Map<number, number>,
  ): { x: number; y: number }[] {
    // Walk the parent chain to reconstruct the raw grid path
    const raw: { r: number; c: number }[] = [];
    let k: number | undefined = goalKey;
    while (k !== undefined && k !== -1) {
      raw.push({ r: Math.floor(k / this.COLS), c: k % this.COLS });
      k = k === startKey ? undefined : parent.get(k);
    }
    raw.reverse();

    // String-pulling: remove waypoints that have direct line-of-sight to a further waypoint.
    // This converts the staircase grid path into smooth straight-line segments.
    const smooth: { r: number; c: number }[] = [raw[0]];
    let anchor = 0;

    for (let i = 2; i < raw.length; i++) {
      if (!this.hasLOS(raw[anchor], raw[i])) {
        smooth.push(raw[i - 1]);
        anchor = i - 1;
      }
    }
    if (raw.length > 1) smooth.push(raw[raw.length - 1]);

    // Convert grid cells to world-space centres
    return smooth.map(n => ({
      x: n.c * this.CELL + this.CELL / 2,
      y: n.r * this.CELL + this.CELL / 2,
    }));
  }

  /**
   * Bresenham line-of-sight check on the impassable grid.
   * Returns true if no SOLID cell lies between a and b.
   */
  private hasLOS(a: { r: number; c: number }, b: { r: number; c: number }): boolean {
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
      const e2 = 2 * err;
      if (e2 > -dc) { err -= dc; r0 += sr; }
      if (e2 <  dr) { err += dr; c0 += sc; }
    }
  }

  // ── Per-tick execution ───────────────────────────────────────────────────────

  executePathfind(robot: Robot, memory: Record<string, unknown>): void {
    this.ensureGrid();

    const target = CombatMath.getClosestTarget(robot, this.gameLoop.getRobots());
    if (!target) {
      // No enemy — drift toward arena centre
      const angle = Math.atan2(300 - robot.position.y, 400 - robot.position.x);
      robot.velocity.x = Math.cos(angle) * this.SPEED;
      robot.velocity.y = Math.sin(angle) * this.SPEED;
      robot.rotation   = angle;
      return;
    }

    const robotId = robot.id;
    let path = this.pathCache.get(robotId) ?? [];
    const last = this.lastTarget.get(robotId) ?? { x: -99999, y: -99999 };

    // Recompute when enemy moves far enough or we have no path
    const moved = Math.hypot(target.position.x - last.x, target.position.y - last.y);
    if (path.length === 0 || moved > this.RECOMPUTE_DIST) {
      path = this.performAStar(
        robot.position.x, robot.position.y,
        target.position.x, target.position.y,
      );
      this.pathCache.set(robotId, path);
      this.lastTarget.set(robotId, { x: target.position.x, y: target.position.y });
    }

    // Consume waypoints the robot has already passed
    while (path.length > 0 &&
      Math.hypot(robot.position.x - path[0].x, robot.position.y - path[0].y) < this.WP_RADIUS
    ) {
      path.shift();
    }
    this.pathCache.set(robotId, path);

    // Steer toward next waypoint, or directly at target when path is exhausted
    const steer = path.length > 0 ? path[0] : target.position;
    const angle = Math.atan2(steer.y - robot.position.y, steer.x - robot.position.x);
    robot.velocity.x = Math.cos(angle) * this.SPEED;
    robot.velocity.y = Math.sin(angle) * this.SPEED;
    robot.rotation   = angle;
  }

  clearRobotPath(robotId: string): void {
    this.pathCache.delete(robotId);
    this.lastTarget.delete(robotId);
  }
}