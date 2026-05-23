import { Snapshot } from "../types";

export const CANVAS_W = 800;
export const CANVAS_H = 600;
const MAX_HEALTH = 100;
const HEALTH_LERP = 0.08;

const ROBOT_COLORS = [
  "#00ffff",
  "#ff00ff",
  "var(--color-orange-500)",
  "var(--color-emerald-500)",
  "#f43f5e",
  "#eab308",
  "#38bdf8",
  "#c084fc",
];

function getColorForId(idx: number): string {
  return ROBOT_COLORS[idx % ROBOT_COLORS.length];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

const TWO_PI = Math.PI * 2;

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  prevSnap: Snapshot | undefined,
  currSnap: Snapshot | undefined,
  t: number,
  smoothedHealth: Map<string, number>
) {
  const W = CANVAS_W;
  const H = CANVAS_H;

  // Background
  ctx.fillStyle = "#030712";
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "rgba(8,145,178,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    ctx.moveTo((i / 10) * W, 0);
    ctx.lineTo((i / 10) * W, H);
    ctx.moveTo(0, (i / 10) * H);
    ctx.lineTo(W, (i / 10) * H);
  }
  ctx.stroke();

  // Border
  ctx.strokeStyle = "rgba(var(--accent-rgb),0.18)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  const snap = currSnap ?? prevSnap;
  if (!snap) {
    ctx.fillStyle = "rgba(var(--accent-rgb),0.15)";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 32, 0, TWO_PI);
    ctx.fill();
    return;
  }

  // Draw Projectiles (Batched)
  if (snap.projectiles?.length) {
    ctx.beginPath();
    snap.projectiles.forEach((curr) => {
      if (!curr.position) return;
      let rx: number, ry: number;

      if (curr.velocity) {
        rx = curr.position.x + curr.velocity.x * t;
        ry = curr.position.y + curr.velocity.y * t;
      } else {
        const prev = prevSnap?.projectiles?.find(
          (p) => p.id === curr.id
        );
        if (prev?.position) {
          rx = lerp(prev.position.x, curr.position.x, t);
          ry = lerp(prev.position.y, curr.position.y, t);
        } else {
          rx = curr.position.x;
          ry = curr.position.y;
        }
      }
      ctx.moveTo(rx, ry);
      ctx.arc(rx, ry, 5, 0, TWO_PI);
      const projColor = curr.color || "#22d3ee";
      ctx.fillStyle = projColor;
      ctx.shadowColor = projColor;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath(); // reset path for next projectile if using different colors, wait, they are batched!
    });
  }

  // Draw Robots
  snap.robots?.forEach((curr, idx) => {
    if (!curr.position) return;

    const prev = prevSnap?.robots?.find((r) => r.id === curr.id);

    const rx = prev ? lerp(prev.position.x, curr.position.x, t) : curr.position.x;
    const ry = prev ? lerp(prev.position.y, curr.position.y, t) : curr.position.y;
    const rotation = prev?.rotation !== undefined && curr.rotation !== undefined
      ? lerpAngle(prev.rotation, curr.rotation, t)
      : curr.rotation;

    const color = curr.color || getColorForId(idx);
    const radius = 24;

    const targetHealth = Math.max(0, curr.health);
    const prevSmoothed = smoothedHealth.get(curr.id) ?? targetHealth;
    const newSmoothed = lerp(prevSmoothed, targetHealth, HEALTH_LERP);
    smoothedHealth.set(curr.id, newSmoothed);

    // Health Ring
    if (newSmoothed > 0) {
      const fraction = Math.max(0, Math.min(1, newSmoothed / MAX_HEALTH));
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + fraction * TWO_PI;
      ctx.beginPath();
      ctx.arc(rx, ry, radius + 8, startAngle, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Body
    ctx.beginPath();
    ctx.arc(rx, ry, radius, 0, TWO_PI);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.2;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Direction indicator
    if (rotation !== undefined) {
      const dotX = rx + Math.cos(rotation) * (radius - 6);
      const dotY = ry + Math.sin(rotation) * (radius - 6);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, TWO_PI);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // ID Text
    const shortId = curr.id.startsWith("bot") ? "BOT" : curr.id.slice(0, 5);
    ctx.fillStyle = color;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shortId, rx, ry);
    ctx.textBaseline = "alphabetic";
  });
}
