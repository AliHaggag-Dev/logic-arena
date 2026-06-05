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

    // --- _SYS_FACE_X / _SYS_FACE_Y: independent FOV aiming ---
    // Runs before the ice check so FOV can track targets while sliding.
    if (
      typeof memory._SYS_FACE_X === 'number' &&
      typeof memory._SYS_FACE_Y === 'number'
    ) {
      const fx = memory._SYS_FACE_X;
      const fy = memory._SYS_FACE_Y;
      const dx = fx - robot.position.x;
      const dy = fy - robot.position.y;
      robot.fovDirection = Math.atan2(dy, dx);
    }

    if (robot.insideIcePatch) {
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

    // --- _SYS_SPEED_MULT: script-controlled speed multiplier ---
    const sysSpeedMult =
      typeof memory._SYS_SPEED_MULT === 'number' ? memory._SYS_SPEED_MULT : 1;
    const targetSpeed = this.MOVE_SPEED * slowMult * sysSpeedMult;

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

    // --- _SYS_ORBIT_X / _SYS_ORBIT_Y / _SYS_ORBIT_R: circular orbit ---
    if (
      typeof memory._SYS_ORBIT_X === 'number' &&
      typeof memory._SYS_ORBIT_Y === 'number' &&
      typeof memory._SYS_ORBIT_R === 'number'
    ) {
      const cx = memory._SYS_ORBIT_X;
      const cy = memory._SYS_ORBIT_Y;
      const orbitR = memory._SYS_ORBIT_R;
      const radius = Math.abs(orbitR);
      const clockwise = orbitR >= 0;

      // Current angle from center to robot
      const currentAngle = Math.atan2(
        robot.position.y - cy,
        robot.position.x - cx,
      );

      // Compute tangent direction (perpendicular to radius)
      const ORBIT_STEP = 0.15; // radians per tick advance
      const stepDir = clockwise ? ORBIT_STEP : -ORBIT_STEP;
      const nextAngle = currentAngle + stepDir;

      // Target point on the orbit circle ahead of current position
      const tx = cx + Math.cos(nextAngle) * radius;
      const ty = cy + Math.sin(nextAngle) * radius;

      const dx = tx - robot.position.x;
      const dy = ty - robot.position.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        const moveAngle = Math.atan2(dy, dx);
        robot.velocity.x = Math.cos(moveAngle) * speed;
        robot.velocity.y = Math.sin(moveAngle) * speed;
        robot.rotation = moveAngle;
        robot.isManualRotation = true;
      } else {
        robot.velocity.x = 0;
        robot.velocity.y = 0;
      }

      robot.isBackingUp = false;
      robot.facingDirection = robot.rotation;
      return;
    }

    // --- _SYS_STRAFE: perpendicular lateral movement ---
    if (typeof memory._SYS_STRAFE === 'number' && memory._SYS_STRAFE !== 0) {
      const strafeDir = memory._SYS_STRAFE > 0 ? 1 : -1;
      // Perpendicular to current rotation: +π/2 = right, -π/2 = left
      const HALF_PI = Math.PI / 2;
      const strafeAngle = robot.rotation + strafeDir * HALF_PI;
      robot.velocity.x = Math.cos(strafeAngle) * speed;
      robot.velocity.y = Math.sin(strafeAngle) * speed;
      // Body rotation stays fixed — only movement direction changes
      robot.isManualRotation = true;
      robot.isBackingUp = false;
      robot.facingDirection = robot.rotation;
      return;
    }

    // --- SECRET RAIL SYSTEM FOR CAMPAIGN ROBOT ---
    // _SYS_TARGET_X/Y are in pixel space (0-800, 0-600), same as robot.position
    if (
      typeof memory._SYS_TARGET_X === 'number' &&
      typeof memory._SYS_TARGET_Y === 'number'
    ) {
      const tx = memory._SYS_TARGET_X;
      const ty = memory._SYS_TARGET_Y;
      const dx = tx - robot.position.x;
      const dy = ty - robot.position.y;
      const dist = Math.hypot(dx, dy);

      // The logic evaluates every 6 physics ticks (0.1s).
      // At speed=150, it moves 15px per logic tick.
      // If RAIL_SNAP is too small (e.g. 5), it steps over it, oscillating forever.
      const RAIL_SNAP = Math.max(25, speed * 0.15);

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
