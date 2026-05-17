import { GameLoop } from '@logic-arena/engine';
import { NodeType } from '@logic-arena/logic-parser';
import { Pathfinder } from '../pathfinder';
import type { ActionExpression } from '@logic-arena/logic-parser';

type Direction = 'FORWARD' | 'LEFT' | 'RIGHT';

function resolveDirection(
  actionArgs: readonly { type: string; value?: string }[] | undefined,
): Direction {
  if (!actionArgs || actionArgs.length === 0) return 'FORWARD';
  const first = actionArgs[0];
  if (first.type === NodeType.Identifier && first.value) {
    const dir = first.value.toUpperCase();
    if (dir === 'LEFT') return 'LEFT';
    if (dir === 'RIGHT') return 'RIGHT';
  }
  return 'FORWARD';
}

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
    memory: Record<string, unknown>,
    directionArg?: Direction,
  ): void {
    const robot = this.gameLoop.getRobots().find((r) => r.id === robotId);
    if (!robot) return;

    if ((robot.collisionCooldown ?? 0) > 0) {
      return;
    }

    if (actionCommand === 'PATHFIND') {
      robot.isBackingUp = false;
      this.pathfinder.executePathfind(robot, memory);
      return;
    }

    if (actionCommand === 'STOP') {
      robot.isBackingUp = false;
      robot.velocity.x = 0;
      robot.velocity.y = 0;
      return;
    }

    const slowMult = robot.speedMultiplier ?? 1.0;
    const targetSpeed = this.MOVE_SPEED * slowMult;

    if (actionCommand === 'BACKUP') {
      if (robot.facingDirection === undefined) {
        robot.facingDirection = robot.rotation;
      }
      const dir = robot.facingDirection;
      robot.velocity.x = -Math.cos(dir) * targetSpeed;
      robot.velocity.y = -Math.sin(dir) * targetSpeed;
      robot.isManualRotation = true;
      robot.isBackingUp = true;
      return;
    }

    const speedMultiplier =
      actionCommand === 'MOVE_FAST' ? this.MOVE_FAST_MULTIPLIER : 1;
    const speed = targetSpeed * speedMultiplier;

    // --- SECRET RAIL SYSTEM FOR CAMPAIGN ROBOT ---
    // _SYS_TARGET_X/Y are in pixel space (0-800, 0-600), same as robot.position
    if (typeof memory._SYS_TARGET_X === 'number' && typeof memory._SYS_TARGET_Y === 'number') {
      const tx = memory._SYS_TARGET_X as number;
      const ty = memory._SYS_TARGET_Y as number;
      const dx = tx - robot.position.x;
      const dy = ty - robot.position.y;
      const dist = Math.hypot(dx, dy);
      const RAIL_SNAP = 5; // 5 pixels — matches pixel-space coordinates

      if (dist < RAIL_SNAP) {
        // Snap exactly to target to prevent jitter
        robot.position.x = tx;
        robot.position.y = ty;
        robot.velocity.x = 0;
        robot.velocity.y = 0;
        memory._SYS_AT_TARGET = 1;
      } else {
        const angle = Math.atan2(dy, dx);
        robot.velocity.x = Math.cos(angle) * speed;
        robot.velocity.y = Math.sin(angle) * speed;
        robot.rotation = angle;
        robot.isManualRotation = true;
        memory._SYS_AT_TARGET = 0;
      }
      robot.isBackingUp = false;
      robot.facingDirection = robot.rotation;
      return;
    }

    const dir = directionArg ?? 'FORWARD';

    if (dir === 'LEFT') {
      robot.velocity.x = -speed;
      robot.velocity.y = 0;
    } else if (dir === 'RIGHT') {
      robot.velocity.x = speed;
      robot.velocity.y = 0;
    } else {
      robot.velocity.x = Math.cos(robot.rotation) * speed;
      robot.velocity.y = Math.sin(robot.rotation) * speed;
    }

    robot.isBackingUp = false;
    robot.facingDirection = robot.rotation;
  }
}
