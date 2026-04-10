import { GameLoop, Robot } from "@logic-arena/engine";
import { CombatMath } from "./combat-math";

export class Pathfinder {
    private grid: boolean[][] = [];
    private readonly GRID_COLS = 40;
    private readonly GRID_ROWS = 30;
    private readonly CELL_SIZE = 20;
    private readonly MOVE_SPEED = 150;

    constructor(private gameLoop: GameLoop) { }

    rebuildGrid() {
        this.grid = Array(this.GRID_ROWS).fill(null).map(() => Array(this.GRID_COLS).fill(false));
        const pad = 1; // 1 cell padding for robot radius
        const obstacles = this.gameLoop.getObstacles();

        for (const obs of obstacles) {
            const minCol = Math.max(0, Math.floor((obs.position.x - obs.width / 2) / this.CELL_SIZE) - pad);
            const maxCol = Math.min(this.GRID_COLS - 1, Math.floor((obs.position.x + obs.width / 2) / this.CELL_SIZE) + pad);
            const minRow = Math.max(0, Math.floor((obs.position.y - obs.height / 2) / this.CELL_SIZE) - pad);
            const maxRow = Math.min(this.GRID_ROWS - 1, Math.floor((obs.position.y + obs.height / 2) / this.CELL_SIZE) + pad);

            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    this.grid[r][c] = true;
                }
            }
        }
    }

    performAStar(startX: number, startY: number, targetX: number, targetY: number): { x: number, y: number }[] {
        const startCol = Math.floor(startX / this.CELL_SIZE);
        const startRow = Math.floor(startY / this.CELL_SIZE);
        const targetCol = Math.floor(targetX / this.CELL_SIZE);
        const targetRow = Math.floor(targetY / this.CELL_SIZE);

        if (startCol < 0 || startCol >= this.GRID_COLS || startRow < 0 || startRow >= this.GRID_ROWS ||
            targetCol < 0 || targetCol >= this.GRID_COLS || targetRow < 0 || targetRow >= this.GRID_ROWS) {
            return [];
        }

        interface Node { c: number, r: number, g: number, h: number, f: number, parent: Node | null }
        const openSet: Node[] = [];
        const closedSet: boolean[][] = Array(this.GRID_ROWS).fill(null).map(() => Array(this.GRID_COLS).fill(false));

        const startNode = { c: startCol, r: startRow, g: 0, h: Math.abs(startCol - targetCol) + Math.abs(startRow - targetRow), f: 0, parent: null };
        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);

        while (openSet.length > 0) {
            let lowestIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestIndex].f) {
                    lowestIndex = i;
                }
            }

            const current = openSet[lowestIndex];
            if (current.c === targetCol && current.r === targetRow) {
                const path: { x: number, y: number }[] = [];
                let curr: Node | null = current;
                while (curr) {
                    path.push({ x: curr.c * this.CELL_SIZE + this.CELL_SIZE / 2, y: curr.r * this.CELL_SIZE + this.CELL_SIZE / 2 });
                    curr = curr.parent;
                }
                return path.reverse();
            }

            openSet.splice(lowestIndex, 1);
            closedSet[current.r][current.c] = true;

            const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            for (const [dr, dc] of dirs) {
                const newR = current.r + dr;
                const newC = current.c + dc;

                if (newR >= 0 && newR < this.GRID_ROWS && newC >= 0 && newC < this.GRID_COLS) {
                    if (closedSet[newR][newC] || this.grid[newR][newC]) continue;

                    const tG = current.g + (dr !== 0 && dc !== 0 ? 1.414 : 1);
                    let neighbor = openSet.find(n => n.r === newR && n.c === newC);

                    if (!neighbor) {
                        neighbor = { r: newR, c: newC, g: tG, h: Math.abs(newC - targetCol) + Math.abs(newR - targetRow), f: 0, parent: current };
                        neighbor.f = neighbor.g + neighbor.h;
                        openSet.push(neighbor);
                    } else if (tG < neighbor.g) {
                        neighbor.g = tG;
                        neighbor.f = neighbor.g + neighbor.h;
                        neighbor.parent = current;
                    }
                }
            }
        }
        return [];
    }

    executePathfind(robot: Robot, memory: Map<string, any>) {
        const target = CombatMath.getClosestTarget(robot, this.gameLoop.getRobots());
        if (!target) return;

        let currentPath: { x: number, y: number }[] = memory.get('path') || [];
        const lastCalcTarget = memory.get('lastPathCalcPosition') || { x: 0, y: 0 };

        // Only recalculate if target moved > 50px or no path
        const targetMoveDist = Math.hypot(target.position.x - lastCalcTarget.x, target.position.y - lastCalcTarget.y);
        if (currentPath.length === 0 || targetMoveDist > 50) {
            currentPath = this.performAStar(robot.position.x, robot.position.y, target.position.x, target.position.y);
            memory.set('lastPathCalcPosition', { x: target.position.x, y: target.position.y });
            memory.set('path', currentPath);
        }

        if (currentPath.length > 0) {
            const nextWaypoint = currentPath[0];
            const distToWaypoint = Math.hypot(robot.position.x - nextWaypoint.x, robot.position.y - nextWaypoint.y);

            if (distToWaypoint < 25) {
                currentPath.shift();
                memory.set('path', currentPath);
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