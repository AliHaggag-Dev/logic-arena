import { Robot } from "../types";

const ROBOT_RADIUS = 15;

export function checkWallBounds(robot: Robot, arenaWidth: number, arenaHeight: number): void {
  if (robot.position.x < ROBOT_RADIUS) {
    robot.position.x = ROBOT_RADIUS;
    robot.velocity.x *= -1;
  } else if (robot.position.x > arenaWidth - ROBOT_RADIUS) {
    robot.position.x = arenaWidth - ROBOT_RADIUS;
    robot.velocity.x *= -1;
  }

  if (robot.position.y < ROBOT_RADIUS) {
    robot.position.y = ROBOT_RADIUS;
    robot.velocity.y *= -1;
  } else if (robot.position.y > arenaHeight - ROBOT_RADIUS) {
    robot.position.y = arenaHeight - ROBOT_RADIUS;
    robot.velocity.y *= -1;
  }
}