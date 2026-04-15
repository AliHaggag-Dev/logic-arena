import { Robot, Obstacle } from "../types";

const ROBOT_RADIUS = 15;

/**
 * Checks and resolves a robot vs obstacle collision.
 *
 * Collision Dispatcher — The 3 Pillars:
 *   SOLID : Impassable. Pushes robot out + reflects velocity component.
 *   TRAP  : Walkable slow zone. AABB center-overlap test sets speedMultiplier = 0.4.
 *           No push-out — the robot moves through but is slowed by 60%.
 *   LAVA  : Walkable damage zone. AABB center-overlap test sets insideLava = true.
 *           No push-out — damage is applied by the game loop (5 HP/sec).
 */
export function checkObstacleCollision(robot: Robot, obstacle: Obstacle): void {
  // --- SOLID: Standard circle-vs-AABB collision with push-out ---
  if (obstacle.type === 'SOLID') {
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
    const distSq = dx * dx + dy * dy;

    if (distSq < ROBOT_RADIUS * ROBOT_RADIUS) {
      const distance = Math.sqrt(distSq) || 0.0001; // avoid divide-by-zero
      const overlap = ROBOT_RADIUS - distance;
      const nx = dx / distance;
      const ny = dy / distance;

      // Push robot out along the collision normal
      robot.position.x += overlap * nx;
      robot.position.y += overlap * ny;

      // Reflect the dominant velocity component (wall slide)
      if (Math.abs(dx) > Math.abs(dy)) {
        robot.velocity.x *= -1;
      } else {
        robot.velocity.y *= -1;
      }
    }
    return;
  }

  // --- TRAP / LAVA: Walkable zones — AABB center-point overlap only ---
  // Robots walk through these zones; no push-out is applied.
  const halfW = obstacle.width / 2;
  const halfH = obstacle.height / 2;
  const insideX = robot.position.x >= obstacle.position.x - halfW &&
                  robot.position.x <= obstacle.position.x + halfW;
  const insideY = robot.position.y >= obstacle.position.y - halfH &&
                  robot.position.y <= obstacle.position.y + halfH;

  if (!insideX || !insideY) return;

  if (obstacle.type === 'TRAP') {
    // Set per-tick speed modifier. The game loop reads this and applies it to
    // the position update. Reset to 1.0 at the START of each robot's tick.
    robot.speedMultiplier = 0.4; // 60% velocity reduction
  } else if (obstacle.type === 'LAVA') {
    // Flag the robot as inside lava. The game loop deducts 5 HP/sec.
    // Reset to false at the START of each robot's tick.
    robot.insideLava = true;
  }
}