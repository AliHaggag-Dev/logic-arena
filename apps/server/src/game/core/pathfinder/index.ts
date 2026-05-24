export * from './types';
export * from './grid-builder';
export * from './min-heap';
export * from './string-puller';
export * from './astar';

import { GameLoop, Robot } from '@logic-arena/engine';
import { CombatMath } from '../combat-math';
import { PATH_CONFIG, Vec2 } from './types';
import { GridBuilder } from './grid-builder';
import { AStarProtocol } from './astar';

/**
 * Public facade aggregating A* search subsystems.
 * Replaces the monolithic pathfinder.ts with composed modular utilities.
 */
export class Pathfinder {
  private readonly gridBuilder: GridBuilder;
  private readonly astar: AStarProtocol;

  private readonly pathCache = new Map<string, Vec2[]>();
  private readonly lastTarget = new Map<string, Vec2>();

  constructor(private readonly gameLoop: GameLoop) {
    this.gridBuilder = new GridBuilder(this.gameLoop);
    this.astar = new AStarProtocol(this.gridBuilder);
  }

  /** Forces the grid layout to invalidate and immediately rebuild on the next path execution cycle. */
  invalidateGrid(): void {
    this.gridBuilder.invalidateGrid();
  }

  /** Per-tick path execution pipeline. */
  executePathfind(robot: Robot, _: Record<string, unknown>): void {
    this.gridBuilder.ensureGrid();

    const target = CombatMath.getClosestTarget(
      robot,
      this.gameLoop.getRobots(),
    );
    if (!target) {
      // Fallback: direct central alignment drift
      const angle = Math.atan2(300 - robot.position.y, 400 - robot.position.x);
      robot.velocity.x = Math.cos(angle) * PATH_CONFIG.SPEED;
      robot.velocity.y = Math.sin(angle) * PATH_CONFIG.SPEED;
      robot.rotation = angle;
      return;
    }

    const id = robot.id;
    let path = this.pathCache.get(id) ?? [];
    const last = this.lastTarget.get(id) ?? { x: -99999, y: -99999 };

    // Dynamically invalidate active path routing if the target repositions outside the tolerance threshold
    const moved = Math.hypot(
      target.position.x - last.x,
      target.position.y - last.y,
    );
    // Recompute if target moved OR if robot recently collided with a wall (and finished its bounce)
    const hitWallRecently = Date.now() - (robot.hitWallTimestamp ?? 0) < 500;
    const targetMoved = moved > PATH_CONFIG.RECOMPUTE_DIST || hitWallRecently;

    if (targetMoved) {
      // Target repositioned — recompute full A* path
      path = this.astar.performAStar(
        robot.position.x,
        robot.position.y,
        target.position.x,
        target.position.y,
      );
      this.pathCache.set(id, path);
      this.lastTarget.set(id, { x: target.position.x, y: target.position.y });
    } else if (path.length === 0) {
      // Path exhausted but target hasn't moved — steer directly to target.
      // Do NOT recompute A*: that would generate a path whose first waypoint
      // is behind the robot (robot overshot the last grid cell centre),
      // causing the back-and-forth oscillation.
      const angle = Math.atan2(
        target.position.y - robot.position.y,
        target.position.x - robot.position.x,
      );
      robot.velocity.x = Math.cos(angle) * PATH_CONFIG.SPEED;
      robot.velocity.y = Math.sin(angle) * PATH_CONFIG.SPEED;
      robot.rotation = angle;
      return;
    }

    // Eliminate consumed topological checkpoints
    while (
      path.length > 0 &&
      Math.hypot(robot.position.x - path[0].x, robot.position.y - path[0].y) <
        PATH_CONFIG.WP_RADIUS
    ) {
      path.shift();
    }
    this.pathCache.set(id, path);

    // Apply linear trajectory angular steering
    const steer = path.length > 0 ? path[0] : target.position;
    const angle = Math.atan2(
      steer.y - robot.position.y,
      steer.x - robot.position.x,
    );
    robot.velocity.x = Math.cos(angle) * PATH_CONFIG.SPEED;
    robot.velocity.y = Math.sin(angle) * PATH_CONFIG.SPEED;
    robot.rotation = angle;
  }

  /** Restores memory state upon robot core deletion or match reset. */
  clearRobotPath(robotId: string): void {
    this.pathCache.delete(robotId);
    this.lastTarget.delete(robotId);
  }
}
