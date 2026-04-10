import { Robot, Vector2 } from "../types";

const ROBOT_RADIUS = 15;

export function checkRobotRobotCollision(r1: Robot, r2: Robot): void {
  if (!r1.isAlive || !r2.isAlive) return;

  const dx = r2.position.x - r1.position.x;
  const dy = r2.position.y - r1.position.y;
  const distance = Math.hypot(dx, dy);

  if (distance < ROBOT_RADIUS * 2) {
    // Simple elastic collision
    const tempVx = r1.velocity.x;
    const tempVy = r1.velocity.y;
    r1.velocity.x = r2.velocity.x;
    r1.velocity.y = r2.velocity.y;
    r2.velocity.x = tempVx;
    r2.velocity.y = tempVy;

    // Resolve overlap
    const overlap = ROBOT_RADIUS * 2 - distance + 1;
    const angle = Math.atan2(dy, dx);
    r1.position.x -= (overlap / 2) * Math.cos(angle);
    r1.position.y -= (overlap / 2) * Math.sin(angle);
    r2.position.x += (overlap / 2) * Math.cos(angle);
    r2.position.y += (overlap / 2) * Math.sin(angle);
  }
}