// wall-bounds.ts
import { Robot } from "../types";

const ROBOT_RADIUS = 15;

export function checkWallBounds(
  robot: Robot,
  arenaWidth: number,
  arenaHeight: number
): void {
  let hitNormal = { x: 0, y: 0 };

  const BOUNCE_DAMPING = 0.85;

  if (robot.position.x < ROBOT_RADIUS) {
    robot.position.x = ROBOT_RADIUS;
    if (robot.velocity.x < 0) {
      robot.velocity.x = robot.isBackingUp ? 0 : robot.velocity.x * -BOUNCE_DAMPING;
    }
    hitNormal.x = 1;
  } else if (robot.position.x > arenaWidth - ROBOT_RADIUS) {
    robot.position.x = arenaWidth - ROBOT_RADIUS;
    if (robot.velocity.x > 0) {
      robot.velocity.x = robot.isBackingUp ? 0 : robot.velocity.x * -BOUNCE_DAMPING;
    }
    hitNormal.x = -1;
  }

  if (robot.position.y < ROBOT_RADIUS) {
    robot.position.y = ROBOT_RADIUS;
    if (robot.velocity.y < 0) {
      robot.velocity.y = robot.isBackingUp ? 0 : robot.velocity.y * -BOUNCE_DAMPING;
    }
    hitNormal.y = 1;
  } else if (robot.position.y > arenaHeight - ROBOT_RADIUS) {
    robot.position.y = arenaHeight - ROBOT_RADIUS;
    if (robot.velocity.y > 0) {
      robot.velocity.y = robot.isBackingUp ? 0 : robot.velocity.y * -BOUNCE_DAMPING;
    }
    hitNormal.y = -1;
  }

  if (hitNormal.x !== 0 || hitNormal.y !== 0) {
    robot.collisionCooldown = 30;
    robot.hitWallTimestamp = Date.now();
  }
}
