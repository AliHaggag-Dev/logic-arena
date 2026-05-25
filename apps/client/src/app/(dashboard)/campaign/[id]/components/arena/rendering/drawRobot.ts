import { FOV_HALF, FOV_RANGE } from '../constants';
import type { ArenaRobot } from '../scenes';

export function drawFovCone(
  ctx: CanvasRenderingContext2D,
  robot: ArenaRobot,
  W: number, H: number,
  alpha: number,
): void {
  if (!robot.isAlive || alpha <= 0) return;
  const px = robot.x * W, py = robot.y * H;
  const range = FOV_RANGE * Math.min(W, H);

  const spinAngle = Math.PI * 2 * (1.0 - alpha);
  const currentAngle = robot.angle + spinAngle;

  ctx.save();
  ctx.globalAlpha = alpha * 0.18;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, range, currentAngle - FOV_HALF, currentAngle + FOV_HALF);
  ctx.closePath();
  ctx.fillStyle = robot.color;
  ctx.fill();
  ctx.globalAlpha = alpha * 0.45;
  ctx.strokeStyle = robot.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px, py, range, currentAngle - FOV_HALF, currentAngle + FOV_HALF);
  ctx.stroke();
  ctx.restore();
}

export function drawRobot(
  ctx: CanvasRenderingContext2D,
  robot: ArenaRobot,
  W: number, H: number,
  tick: number,
  fovAlpha: number,
): void {
  if (!robot.isAlive) return;
  const px = robot.x * W, py = robot.y * H;
  const r = robot.size * Math.min(W, H);
  const invPulse = robot.invulnerableTimer > 0 ? 0.3 + Math.sin(tick * 0.3) * 0.3 : 0;
  const a = robot.invulnerableTimer > 0 ? 0.4 + invPulse : 1;

  drawFovCone(ctx, robot, W, H, fovAlpha);

  ctx.save();
  ctx.translate(px, py);
  ctx.globalAlpha = a;

  const glowR = r * (1.8 + Math.sin(tick * 0.05) * 0.15);
  const grd = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, glowR);
  grd.addColorStop(0, `${robot.color}30`);
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2); ctx.fill();

  ctx.rotate(robot.angle);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const rx = Math.cos(ang) * r, ry = Math.sin(ang) * r * 0.8;
    i === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.fillStyle = `${robot.color}22`;
  ctx.strokeStyle = robot.color;
  ctx.lineWidth = 1.5;
  ctx.fill(); ctx.stroke();

  ctx.strokeStyle = robot.color;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r * 0.2, 0); ctx.lineTo(r * 1.4, 0); ctx.stroke();

  ctx.fillStyle = robot.color;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
