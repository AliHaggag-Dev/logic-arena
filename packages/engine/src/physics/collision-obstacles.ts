import { Robot, Obstacle, ObstacleType } from "../types";

const ROBOT_RADIUS = 15;

export function checkObstacleCollision(robot: Robot, obstacle: Obstacle): void {
  const now = Date.now();

  const closestX = Math.max(
    obstacle.position.x - obstacle.width / 2,
    Math.min(robot.position.x, obstacle.position.x + obstacle.width / 2)
  );
  const closestY = Math.max(
    obstacle.position.y - obstacle.height / 2,
    Math.min(robot.position.y, obstacle.position.y + obstacle.height / 2)
  );

  const dx = robot.position.x - closestX;
  const dy = robot.position.y - closestY;
  const distance = Math.hypot(dx, dy);

  if (distance < ROBOT_RADIUS) {
    // Collision detected, first push robot out
    const overlap = ROBOT_RADIUS - distance;
    const angle = Math.atan2(dy, dx);
    robot.position.x += overlap * Math.cos(angle);
    robot.position.y += overlap * Math.sin(angle);

    // Apply obstacle-specific effects
    switch (obstacle.type) {
      case 'WALL':
        // Reflect velocity based on which side was hit
        if (Math.abs(dx) > Math.abs(dy)) {
          robot.velocity.x *= -1;
        } else {
          robot.velocity.y *= -1;
        }
        break;
      case 'TRAP':
        robot.health = Math.max(0, robot.health - 10);
        if (robot.health === 0) robot.isAlive = false;
        robot.trappedUntil = now + 5000; // 5 seconds
        robot.velocity = { x: 0, y: 0 };
        break;
      case 'SLOW':
        robot.slowedUntil = now + 3000; // 3 seconds
        robot.speedMultiplier = 0.4;
        break;
      case 'BOUNCER':
        if (Math.abs(dx) > Math.abs(dy)) {
          robot.velocity.x *= -1.8;
          robot.velocity.y *= 1.8;
        } else {
          robot.velocity.x *= 1.8;
          robot.velocity.y *= -1.8;
        }
        break;
    }
  }
}