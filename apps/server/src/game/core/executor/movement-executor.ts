import { GameLoop, Robot } from '@logic-arena/engine';
import { ActionExpression } from '../../../../../../packages/logic-parser/src';
import { Pathfinder } from '../pathfinder/index';

export class MovementExecutor {
  private readonly MOVE_SPEED = 150;
  private readonly MOVE_FAST_MULTIPLIER = 2;

  constructor(
    private gameLoop: GameLoop,
    private pathfinder: Pathfinder,
  ) {}

  execute(
    robotId: string,
    actionCommand: string,
    memory: Record<string, any>,
  ): void {
    const robot = this.gameLoop.getRobots().find((r) => r.id === robotId);
    if (!robot) return;

    // --- Physics Priority ---
    // If the robot is currently bouncing off a wall (cooling down),
    // we strictly ignore all manual movement commands. This prevents scripts
    // from overpowering the physical collision geometry.
    if ((robot.collisionCooldown ?? 0) > 0) {
      return;
    }

    if (actionCommand === 'PATHFIND') {
      this.pathfinder.executePathfind(robot, memory);
      return;
    }

    if (actionCommand === 'STOP') {
      robot.velocity.x = 0;
      robot.velocity.y = 0;
      return;
    }

    // The engine sets speedMultiplier = 0.4 per-tick when the robot is inside a TRAP zone,
    // and resets it to 1.0 at the start of each tick when the robot is outside.
    // The executor simply reads it — no timestamp checks needed.
    const slowMult = robot.speedMultiplier ?? 1.0;
    const targetSpeed = this.MOVE_SPEED * slowMult;

    if (actionCommand === 'BACKUP') {
      // If no forward direction recorded yet (robot hasn't moved), snapshot current rotation
      // as the canonical forward direction before physics can corrupt it via atan2.
      if (robot.facingDirection === undefined) {
        robot.facingDirection = robot.rotation;
      }
      const dir = robot.facingDirection;
      robot.velocity.x = -Math.cos(dir) * targetSpeed;
      robot.velocity.y = -Math.sin(dir) * targetSpeed;
      robot.isManualRotation = true;
      return;
    }

    const speedMultiplier =
      actionCommand === 'MOVE_FAST' ? this.MOVE_FAST_MULTIPLIER : 1;
    const speed = targetSpeed * speedMultiplier;
    const speedMagnitude = Math.hypot(robot.velocity.x, robot.velocity.y);

    if (robot.rotation === 0 && speedMagnitude < 0.001) {
      robot.velocity.x = speed;
      robot.velocity.y = 0;
      robot.facingDirection = 0;
      return;
    }

    robot.velocity.x = Math.cos(robot.rotation) * speed;
    robot.velocity.y = Math.sin(robot.rotation) * speed;
    // Record forward direction so BACKUP can always reverse from a stable angle
    robot.facingDirection = robot.rotation;
  }
}
