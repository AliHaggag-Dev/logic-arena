import { Robot, Obstacle } from "../types";

const ROBOT_RADIUS = 15;
const MINE_DAMAGE = 35;
const MINE_ARM_DELAY_MS = 250;

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

      // Push robot OUT along the collision normal + an extra REPEL_FORCE to
      // prevent it from re-entering the wall geometry next tick (sticky wall fix)
      const REPEL_FORCE = 5.0;
      robot.position.x += (overlap + REPEL_FORCE) * nx;
      robot.position.y += (overlap + REPEL_FORCE) * ny;

      // Calculate perfect incident reflection (Deflection Bounce)
      // v' = v - 2(v·n)n  with 0.85 damping to bleed off excess kinetic energy
      const dot = robot.velocity.x * nx + robot.velocity.y * ny;
      if (robot.isBackingUp) {
        robot.velocity.x -= dot * nx;
        robot.velocity.y -= dot * ny;
      } else {
        const BOUNCE_DAMPING = 0.85;
        robot.velocity.x = (robot.velocity.x - 2 * dot * nx) * BOUNCE_DAMPING;
        robot.velocity.y = (robot.velocity.y - 2 * dot * ny) * BOUNCE_DAMPING;
      }

      // Soft override: force chassis rotation to match new reflected velocity
      if (!robot.isBackingUp && Math.hypot(robot.velocity.x, robot.velocity.y) > 0.001) {
        robot.rotation = Math.atan2(robot.velocity.y, robot.velocity.x);
      }
      
      // Inject shockwave telemetry logic and give immunity to steering overrides
      robot.hitWallTimestamp = Date.now();
      robot.collisionCooldown = 20;
    }
    return;
  }

  if (obstacle.type === 'MINE') {
    if (
      obstacle.ownerId === robot.id &&
      Date.now() - (obstacle.createdAt ?? 0) < MINE_ARM_DELAY_MS
    ) {
      return;
    }

    const dx = robot.position.x - obstacle.position.x;
    const dy = robot.position.y - obstacle.position.y;
    const triggerRadius = Math.max(obstacle.width, obstacle.height) / 2 + ROBOT_RADIUS;
    if (dx * dx + dy * dy <= triggerRadius * triggerRadius) {
      obstacle.triggered = true;
      if (!robot.isShielded) {
        robot.health = Math.max(0, robot.health - MINE_DAMAGE);
        if (robot.health === 0) robot.isAlive = false;
      } else {
        robot.shieldHitTimestamp = Date.now();
      }
    }
    return;
  }

  // --- TRAP / LAVA: Walkable zones — OBB (oriented bounding box) center-point overlap ---
  // Robots walk through these zones; no push-out is applied.
  // Properly accounts for obstacle rotation so collision matches visual rendering.
  const dx = robot.position.x - obstacle.position.x;
  const dy = robot.position.y - obstacle.position.y;
  const cos = Math.cos(-obstacle.rotation);
  const sin = Math.sin(-obstacle.rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  const halfW = obstacle.width / 2;
  const halfH = obstacle.height / 2;
  const insideX = localX >= -halfW && localX <= halfW;
  const insideY = localY >= -halfH && localY <= halfH;

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
