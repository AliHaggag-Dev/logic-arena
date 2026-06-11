/* eslint-disable @typescript-eslint/no-unused-vars */
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

interface PathProgress {
  distance: number;
  stalledTicks: number;
}

/**
 * Public facade aggregating A* search subsystems.
 * Replaces the monolithic pathfinder.ts with composed modular utilities.
 */
export class Pathfinder {
  private readonly gridBuilder: GridBuilder;
  private readonly astar: AStarProtocol;

  private readonly pathCache = new Map<string, Vec2[]>();
  private readonly lastTarget = new Map<string, Vec2>();
  private readonly lastWallHitTime = new Map<string, number>();
  private readonly progressCache = new Map<string, PathProgress>();
  private readonly unreachableCache = new Map<string, Vec2>();

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
    // After a wall collision, recompute A* exactly ONCE (not every tick for 500ms).
    // Multiple recomputes from a bouncing position cause the first waypoint to jump,
    // which makes the robot oscillate back and forth by 5-10 units mid-path.
    const hitWallTimestamp = robot.hitWallTimestamp ?? 0;
    const hitWallRecently = Date.now() - hitWallTimestamp < 500;
    const prevWallHit = this.lastWallHitTime.get(id) ?? 0;
    const newWallHit = hitWallRecently && hitWallTimestamp > prevWallHit;
    if (newWallHit) this.lastWallHitTime.set(id, hitWallTimestamp);
    if (!hitWallRecently) this.lastWallHitTime.delete(id);
    const directPathBlocked =
      path.length === 0 &&
      !this.gridBuilder.hasWorldClearance(robot.position, target.position);

    const lastUnreachable = this.unreachableCache.get(id);
    const targetIsStillUnreachable = lastUnreachable && Math.hypot(target.position.x - lastUnreachable.x, target.position.y - lastUnreachable.y) < PATH_CONFIG.RECOMPUTE_DIST;

    // Allow recomputation when the robot hits a wall (position changed) or
    // target moved significantly, even if the target was previously cached
    // as unreachable. Only gate the directPathBlocked check on the cache.
    const targetMoved =
      moved > PATH_CONFIG.RECOMPUTE_DIST || newWallHit || (directPathBlocked && !targetIsStillUnreachable);

    if (targetMoved) {
      // Target moved, collision happened, or direct route is blocked.
      path = this.computePath(robot.position, target.position);

      if (path.length === 0) {
        this.unreachableCache.set(id, { x: target.position.x, y: target.position.y });
      } else {
        this.unreachableCache.delete(id);
      }

      this.pathCache.set(id, path);
      this.lastTarget.set(id, { x: target.position.x, y: target.position.y });
      this.progressCache.delete(id);
    } else if (path.length === 0) {
      // If direct route is blocked AND target is cached as unreachable,
      // don't steer into walls. Wait for the target to move or for a wall
      // hit to trigger recomputation.
      if (!this.gridBuilder.hasWorldClearance(robot.position, target.position)) {
        robot.velocity.x = 0;
        robot.velocity.y = 0;
        return;
      }
      // Path exhausted but direct route is clear — steer directly to target.
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

    // Continuous Dynamic String Pulling:
    // If the robot has direct physical clearance to the NEXT waypoint (path[1]),
    // safely skip the current waypoint (path[0]). This dynamically smooths out
    // A* grid "staircases" into perfectly smooth, rounded curves around obstacles,
    // completely eliminating robotic zigzagging (spinning) when following cached paths.
    while (path.length > 1 && this.gridBuilder.hasWorldClearance(robot.position, path[1])) {
      path.shift();
    }

    this.pathCache.set(id, path);

    if (
      path.length === 0 &&
      !this.gridBuilder.hasWorldClearance(robot.position, target.position)
    ) {
      robot.velocity.x = 0;
      robot.velocity.y = 0;
      return;
    }

    // Apply linear trajectory angular steering
    let steer = path.length > 0 ? path[0] : target.position;
    const steerDistance = Math.hypot(
      steer.x - robot.position.x,
      steer.y - robot.position.y,
    );

    if (path.length > 0 && this.isStalled(id, steerDistance)) {
      path = this.computePath(robot.position, target.position);
      this.pathCache.set(id, path);
      this.progressCache.delete(id);
      if (
        path.length === 0 &&
        !this.gridBuilder.hasWorldClearance(robot.position, target.position)
      ) {
        robot.velocity.x = 0;
        robot.velocity.y = 0;
        return;
      }
      steer = path.length > 0 ? path[0] : target.position;
    }

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
    this.lastWallHitTime.delete(robotId);
    this.progressCache.delete(robotId);
    this.unreachableCache.delete(robotId);
  }

  private computePath(start: Vec2, target: Vec2): Vec2[] {
    return this.astar.performAStar(start.x, start.y, target.x, target.y);
  }



  private isStalled(robotId: string, distance: number): boolean {
    const previous = this.progressCache.get(robotId);

    if (
      !previous ||
      distance < previous.distance - PATH_CONFIG.STUCK_PROGRESS_EPSILON
    ) {
      this.progressCache.set(robotId, { distance, stalledTicks: 0 });
      return false;
    }

    const stalledTicks = previous.stalledTicks + 1;
    this.progressCache.set(robotId, {
      distance: Math.min(previous.distance, distance),
      stalledTicks,
    });

    return stalledTicks >= PATH_CONFIG.STUCK_RECOMPUTE_TICKS;
  }
}
