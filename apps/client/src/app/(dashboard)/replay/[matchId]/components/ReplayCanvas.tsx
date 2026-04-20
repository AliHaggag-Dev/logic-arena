import React, { useEffect, useRef } from "react";
import { Snapshot } from "../types";

export const CANVAS_W = 420;
export const CANVAS_H = 315; // 420 * (600/800)
const ARENA_W = 800;
const ARENA_H = 600;

function scaleX(x: number) { return (x / ARENA_W) * CANVAS_W; }
function scaleY(y: number) { return (y / ARENA_H) * CANVAS_H; }

const ROBOT_COLORS = [
  "#00ffff", "#ff00ff", "var(--color-orange-500)", "var(--color-emerald-500)",
  "#f43f5e", "#eab308", "#38bdf8", "#c084fc",
];

function getColorForId(idx: number): string {
  return ROBOT_COLORS[idx % ROBOT_COLORS.length];
}

export function drawFrame(ctx: CanvasRenderingContext2D, snap: Snapshot | undefined) {
  const W = CANVAS_W;
  const H = CANVAS_H;

  // Background
  ctx.fillStyle = "#030712";
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = "rgba(8,145,178,0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath(); ctx.moveTo((i / 10) * W, 0); ctx.lineTo((i / 10) * W, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, (i / 10) * H); ctx.lineTo(W, (i / 10) * H); ctx.stroke();
  }

  // Arena border
  ctx.strokeStyle = "rgba(var(--accent-rgb),0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // Fallback
  if (!snap) {
    ctx.fillStyle = "rgba(var(--accent-rgb),0.15)";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Projectiles
  snap.projectiles?.forEach((p) => {
    if (!p.position) return;
    const px = scaleX(p.position.x);
    const py = scaleY(p.position.y);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = "var(--accent)";
    ctx.shadowColor = "var(--accent)";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Robots
  snap.robots?.forEach((robot, idx) => {
    if (!robot.position) return;
    const rx = scaleX(robot.position.x);
    const ry = scaleY(robot.position.y);
    const color = robot.color || getColorForId(idx);
    const radius = 12;

    // Health ring
    const healthPct = Math.max(0, Math.min(1, robot.health / 100));
    ctx.beginPath();
    ctx.arc(rx, ry, radius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * healthPct);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Robot body fill
    ctx.beginPath();
    ctx.arc(rx, ry, radius, 0, Math.PI * 2);
    ctx.fillStyle = `${color}30`;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Facing direction dot
    if (robot.rotation !== undefined) {
      const dotX = rx + Math.cos(robot.rotation) * (radius - 3);
      const dotY = ry + Math.sin(robot.rotation) * (radius - 3);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // ID label
    const shortId = robot.id.startsWith("bot") ? "BOT" : robot.id.slice(0, 5);
    ctx.fillStyle = color;
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shortId, rx, ry);
    ctx.textBaseline = "alphabetic";
  });
}

interface Props {
  snapshot?: Snapshot;
}

export function ReplayCanvas({ snapshot }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFrame(ctx, snapshot);
  }, [snapshot]);

  return (
    <div className="relative w-full max-w-[420px] rounded-[10px] overflow-hidden border border-accent/20 shadow-[0_0_40px_rgba(var(--accent-rgb),0.06),0_0_0_1px_rgba(var(--accent-rgb),0.05)]">
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-auto block" />
      {/* Corner accents */}
      {[
        { top: 0, left: 0, borderTop: true, borderLeft: true },
        { top: 0, right: 0, borderTop: true, borderRight: true },
        { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
        { bottom: 0, right: 0, borderBottom: true, borderRight: true }
      ].map((pos, i) => (
        <div key={i} className="absolute w-4 h-4 pointer-events-none" style={{
          top: pos.top !== undefined ? 0 : undefined,
          bottom: pos.bottom !== undefined ? 0 : undefined,
          left: pos.left !== undefined ? 0 : undefined,
          right: pos.right !== undefined ? 0 : undefined,
          borderTop: pos.borderTop ? "2px solid rgba(var(--accent-rgb),0.5)" : "none",
          borderBottom: pos.borderBottom ? "2px solid rgba(var(--accent-rgb),0.5)" : "none",
          borderLeft: pos.borderLeft ? "2px solid rgba(var(--accent-rgb),0.5)" : "none",
          borderRight: pos.borderRight ? "2px solid rgba(var(--accent-rgb),0.5)" : "none",
        }} />
      ))}
    </div>
  );
}
