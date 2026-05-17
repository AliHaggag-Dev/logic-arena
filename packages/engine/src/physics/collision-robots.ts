import { Robot, Vector2 } from "../types";

const ROBOT_RADIUS = 15;

export function checkRobotRobotCollision(r1: Robot, r2: Robot): void {
  if (!r1.isAlive || !r2.isAlive) return;

  const dx = r2.position.x - r1.position.x;
  const dy = r2.position.y - r1.position.y;
  const distance = Math.hypot(dx, dy);

  if (distance < ROBOT_RADIUS * 2) {
    const nx = distance === 0 ? 1 : dx / distance;
    const ny = distance === 0 ? 0 : dy / distance;

    const overlap = ROBOT_RADIUS * 2 - distance + 1;
    r1.position.x -= (overlap / 2) * nx;
    r1.position.y -= (overlap / 2) * ny;
    r2.position.x += (overlap / 2) * nx;
    r2.position.y += (overlap / 2) * ny;

    const r1IntoR2 = r1.velocity.x * nx + r1.velocity.y * ny;
    if (r1IntoR2 > 0) {
      r1.velocity.x -= r1IntoR2 * nx;
      r1.velocity.y -= r1IntoR2 * ny;
    }

    const r2IntoR1 = r2.velocity.x * nx + r2.velocity.y * ny;
    if (r2IntoR1 < 0) {
      r2.velocity.x -= r2IntoR1 * nx;
      r2.velocity.y -= r2IntoR1 * ny;
    }
  }
}
