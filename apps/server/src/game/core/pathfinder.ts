import { GameLoop, Robot } from "@logic-arena/engine";
import { CombatMath } from "./combat-math";

/**
 * A* Pathfinder — Fixed & 3D-Ready
 *
 * === Jitter Root Cause & Fix ===
 * The old pathfinder marked ALL obstacle types as impassable, including walkable
 * TRAP/LAVA zones. When a robot was pushed into those zones by combat, A* would
 * recalculate a path that leads away → robot overshoots → A* recalculates again
 * → "circular jitter" (robot spinning in place).
 *
 * Fix:
 *  1. Only SOLID obstacles are marked as impassable (`grid[r][c] = true`).
 *  2. TRAP/LAVA cells receive a cost penalty in `costGrid`. The weighted g-cost
 *     formula `g_new = g_parent + BASE_COST * cellCost` makes A* naturally prefer
 *     routes that avoid these zones without making them completely impassable.
 *  3. Self-waypoint skip: leading path waypoints within ½ cell distance of the
 *     robot are consumed immediately to prevent "pointing at yourself" stall.
 *  4. MAX_ITERATIONS = 800 guarantees < 5ms execution on the 40×30 grid.
 *
 * === 3D Readiness ===
 * The Node interface includes a `z` property (altitude). The heuristic is:
 *   h = |dc| + |dr| + |dz| * HEIGHT_COST_FACTOR
 * All nodes currently have z = 0 (flat arena), so this is a no-op now, but the
 * structure is ready to incorporate ramp altitude costs in the future.
 */
export class Pathfinder {
    private grid: boolean[][] = [];       // true = impassable (SOLID only)
    private costGrid: number[][] = [];    // per-cell traversal cost multiplier
    private readonly GRID_COLS = 40;      // 800px / 20px per cell
    private readonly GRID_ROWS = 30;      // 600px / 20px per cell
    private readonly CELL_SIZE = 20;      // world-units per grid cell
    private readonly MOVE_SPEED = 150;
    private readonly MAX_ITERATIONS = 800; // caps A* at < 5ms on this grid size
    private readonly HEIGHT_COST_FACTOR = 2.0; // future ramp cost weight

    // Walkable-zone traversal cost multipliers
    private readonly COST_NORMAL = 1.0;
    private readonly COST_TRAP   = 3.0; // prefer to route around TRAP zones
    private readonly COST_LAVA   = 5.0; // strongly avoid LAVA zones

    constructor(private gameLoop: GameLoop) { }

    rebuildGrid(): void {
        // Initialise both grids fresh
        this.grid     = Array(this.GRID_ROWS).fill(null).map(() => Array(this.GRID_COLS).fill(false));
        this.costGrid = Array(this.GRID_ROWS).fill(null).map(() => Array(this.GRID_COLS).fill(this.COST_NORMAL));

        const solidPad = 1; // 1-cell padding for robot radius around SOLID walls
        const obstacles = this.gameLoop.getObstacles();

        for (const obs of obstacles) {
            if (obs.type === 'SOLID') {
                // Mark cells as impassable with a 1-cell padding for robot radius
                const minCol = Math.max(0, Math.floor((obs.position.x - obs.width / 2) / this.CELL_SIZE) - solidPad);
                const maxCol = Math.min(this.GRID_COLS - 1, Math.floor((obs.position.x + obs.width / 2) / this.CELL_SIZE) + solidPad);
                const minRow = Math.max(0, Math.floor((obs.position.y - obs.height / 2) / this.CELL_SIZE) - solidPad);
                const maxRow = Math.min(this.GRID_ROWS - 1, Math.floor((obs.position.y + obs.height / 2) / this.CELL_SIZE) + solidPad);
                for (let r = minRow; r <= maxRow; r++) {
                    for (let c = minCol; c <= maxCol; c++) {
                        this.grid[r][c] = true;
                    }
                }
            } else {
                // TRAP and LAVA: walkable but costly
                const cost = obs.type === 'LAVA' ? this.COST_LAVA : this.COST_TRAP;
                const minCol = Math.max(0, Math.floor((obs.position.x - obs.width / 2) / this.CELL_SIZE));
                const maxCol = Math.min(this.GRID_COLS - 1, Math.floor((obs.position.x + obs.width / 2) / this.CELL_SIZE));
                const minRow = Math.max(0, Math.floor((obs.position.y - obs.height / 2) / this.CELL_SIZE));
                const maxRow = Math.min(this.GRID_ROWS - 1, Math.floor((obs.position.y + obs.height / 2) / this.CELL_SIZE));
                for (let r = minRow; r <= maxRow; r++) {
                    for (let c = minCol; c <= maxCol; c++) {
                        this.costGrid[r][c] = cost;
                    }
                }
            }
        }
    }

    performAStar(
        startX: number, startY: number,
        targetX: number, targetY: number
    ): { x: number; y: number }[] {
        // --- Strict bounds clamping — prevents undefined indexing near arena edge ---
        const startCol  = Math.min(this.GRID_COLS - 1, Math.max(0, Math.floor(startX  / this.CELL_SIZE)));
        const startRow  = Math.min(this.GRID_ROWS - 1, Math.max(0, Math.floor(startY  / this.CELL_SIZE)));
        const targetCol = Math.min(this.GRID_COLS - 1, Math.max(0, Math.floor(targetX / this.CELL_SIZE)));
        const targetRow = Math.min(this.GRID_ROWS - 1, Math.max(0, Math.floor(targetY / this.CELL_SIZE)));

        // If the start cell itself is blocked, bail early (robot is being pushed into a wall)
        if (this.grid[startRow]?.[startCol]) return [];

        /**
         * Node includes `z` (altitude) for 3D-readiness.
         * Heuristic: h = |dc| + |dr| + |dz| * HEIGHT_COST_FACTOR
         * Currently dz is always 0 (flat arena).
         */
        interface Node {
            c: number; r: number;
            z: number;           // altitude — 0 for all nodes on flat arena
            g: number; h: number; f: number;
            parent: Node | null;
        }

        const openSet: Node[] = [];
        const closedSet: boolean[][] = Array(this.GRID_ROWS).fill(null).map(() => Array(this.GRID_COLS).fill(false));

        const dz = 0; // target altitude − start altitude (flat = 0)
        const startH = Math.abs(startCol - targetCol) + Math.abs(startRow - targetRow) + Math.abs(dz) * this.HEIGHT_COST_FACTOR;
        const startNode: Node = { c: startCol, r: startRow, z: 0, g: 0, h: startH, f: startH, parent: null };
        openSet.push(startNode);

        let iterations = 0;

        while (openSet.length > 0 && iterations < this.MAX_ITERATIONS) {
            iterations++;

            // Find node with lowest f — linear scan is fine for small grids (40×30)
            let lowestIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestIndex].f) lowestIndex = i;
            }

            const current = openSet[lowestIndex];

            // Goal reached — reconstruct path
            if (current.c === targetCol && current.r === targetRow) {
                const path: { x: number; y: number }[] = [];
                let curr: Node | null = current;
                while (curr) {
                    path.push({
                        x: curr.c * this.CELL_SIZE + this.CELL_SIZE / 2,
                        y: curr.r * this.CELL_SIZE + this.CELL_SIZE / 2,
                    });
                    curr = curr.parent;
                }
                return path.reverse();
            }

            openSet.splice(lowestIndex, 1);
            closedSet[current.r][current.c] = true;

            // 8-directional neighbours
            const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            for (const [dr, dc] of dirs) {
                const newR = current.r + dr;
                const newC = current.c + dc;

                if (newR < 0 || newR >= this.GRID_ROWS || newC < 0 || newC >= this.GRID_COLS) continue;
                if (closedSet[newR][newC] || this.grid[newR][newC]) continue;

                // Weighted g-cost: diagonal steps cost √2; also multiply by cell cost
                const baseCost = dr !== 0 && dc !== 0 ? 1.414 : 1.0;
                const cellCost = this.costGrid[newR][newC];
                const tG = current.g + baseCost * cellCost;

                let neighbor = openSet.find(n => n.r === newR && n.c === newC);
                if (!neighbor) {
                    const nz = 0; // flat arena — z always 0
                    const tH = Math.abs(newC - targetCol) + Math.abs(newR - targetRow) + Math.abs(nz - 0) * this.HEIGHT_COST_FACTOR;
                    neighbor = { c: newC, r: newR, z: nz, g: tG, h: tH, f: tG + tH, parent: current };
                    openSet.push(neighbor);
                } else if (tG < neighbor.g) {
                    neighbor.g = tG;
                    neighbor.f = tG + neighbor.h;
                    neighbor.parent = current;
                }
            }
        }

        return []; // No path found within iteration budget
    }

    executePathfind(robot: Robot, memory: Record<string, any>): void {
        this.rebuildGrid();
        const target = CombatMath.getClosestTarget(robot, this.gameLoop.getRobots());
        if (!target) return;

        let currentPath: { x: number; y: number }[] = memory["path"] || [];
        const lastCalcTarget = memory["lastPathCalcPosition"] || { x: 0, y: 0 };

        // Only recalculate if target moved > 50px or we have no path
        const targetMoveDist = Math.hypot(
            target.position.x - lastCalcTarget.x,
            target.position.y - lastCalcTarget.y
        );
        if (currentPath.length === 0 || targetMoveDist > 50) {
            currentPath = this.performAStar(
                robot.position.x, robot.position.y,
                target.position.x, target.position.y
            );
            memory["lastPathCalcPosition"] = { x: target.position.x, y: target.position.y };
            memory["path"] = currentPath;
        }

        // --- Self-waypoint skip ---
        // Consume leading waypoints that are within ½ cell of the robot's current position.
        // This prevents the "pointing at yourself" stall that caused circular jitter.
        const SKIP_RADIUS = this.CELL_SIZE / 2; // 10 world-units
        while (currentPath.length > 0) {
            const wp = currentPath[0];
            if (Math.hypot(robot.position.x - wp.x, robot.position.y - wp.y) < SKIP_RADIUS) {
                currentPath.shift();
            } else {
                break;
            }
        }
        memory["path"] = currentPath;

        if (currentPath.length > 0) {
            const nextWaypoint = currentPath[0];
            const distToWaypoint = Math.hypot(robot.position.x - nextWaypoint.x, robot.position.y - nextWaypoint.y);

            if (distToWaypoint < 25) {
                currentPath.shift();
                memory["path"] = currentPath;
                if (currentPath.length > 0) {
                    const next = currentPath[0];
                    const angle = Math.atan2(next.y - robot.position.y, next.x - robot.position.x);
                    robot.velocity.x = Math.cos(angle) * this.MOVE_SPEED;
                    robot.velocity.y = Math.sin(angle) * this.MOVE_SPEED;
                    robot.rotation = angle;
                } else {
                    robot.velocity = { x: 0, y: 0 };
                }
            } else {
                const angle = Math.atan2(nextWaypoint.y - robot.position.y, nextWaypoint.x - robot.position.x);
                robot.velocity.x = Math.cos(angle) * this.MOVE_SPEED;
                robot.velocity.y = Math.sin(angle) * this.MOVE_SPEED;
                robot.rotation = angle;
            }
        } else {
            // Direct movement fallback
            const angle = Math.atan2(target.position.y - robot.position.y, target.position.x - robot.position.x);
            robot.velocity.x = Math.cos(angle) * this.MOVE_SPEED;
            robot.velocity.y = Math.sin(angle) * this.MOVE_SPEED;
            robot.rotation = angle;
        }
    }
}