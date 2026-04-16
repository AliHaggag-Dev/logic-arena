// wall-bounds.ts
import { Robot } from "../types";

const ROBOT_RADIUS = 15;

export function checkWallBounds(
  robot: Robot,
  arenaWidth: number,
  arenaHeight: number
): void {
  let hitNormal = { x: 0, y: 0 };

  if (robot.position.x < ROBOT_RADIUS) {
    robot.position.x = ROBOT_RADIUS;
    robot.velocity.x = Math.abs(robot.velocity.x);
    hitNormal.x = 1;
  } else if (robot.position.x > arenaWidth - ROBOT_RADIUS) {
    robot.position.x = arenaWidth - ROBOT_RADIUS;
    robot.velocity.x = -Math.abs(robot.velocity.x);
    hitNormal.x = -1;
  }

  if (robot.position.y < ROBOT_RADIUS) {
    robot.position.y = ROBOT_RADIUS;
    robot.velocity.y = Math.abs(robot.velocity.y);
    hitNormal.y = 1;
  } else if (robot.position.y > arenaHeight - ROBOT_RADIUS) {
    robot.position.y = arenaHeight - ROBOT_RADIUS;
    robot.velocity.y = -Math.abs(robot.velocity.y);
    hitNormal.y = -1;
  }

  if (hitNormal.x !== 0 || hitNormal.y !== 0) {
    robot.rotation = Math.atan2(robot.velocity.y, robot.velocity.x);
    robot.collisionCooldown = 30;
    robot.hitWallTimestamp = Date.now();
  }
}