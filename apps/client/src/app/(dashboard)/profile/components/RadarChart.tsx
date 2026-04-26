"use client";

import React, { useEffect, useRef, useState } from "react";
import { CombatStats } from "../types";

interface Axis {
  key: keyof CombatStats;
  label: string;
  color: string;
  icon: string;
}

const AXES: Axis[] = [
  { key: "efficiency", label: "EFFICIENCY",  color: "#22d3ee", icon: "⚡" },
  { key: "aggression", label: "AGGRESSION",  color: "#f97316", icon: "🔥" },
  { key: "defense",    label: "DEFENSE",     color: "#4ade80", icon: "🛡" },
  { key: "precision",  label: "PRECISION",   color: "#a855f7", icon: "🎯" },
  { key: "speed",      label: "SPEED",       color: "#facc15", icon: "💨" },
];

const SIDES = 5;
const RINGS = 5;

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleRad: number,
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function getAngle(i: number): number {
  // Start from the top (−π/2) and go clockwise
  return (Math.PI * 2 * i) / SIDES - Math.PI / 2;
}

interface Props {
  stats: CombatStats;
  size?: number;
}

export function RadarChart({ stats, size = 280 }: Props) {
  const [animated, setAnimated] = useState<CombatStats>({
    efficiency: 0, aggression: 0, defense: 0, precision: 0, speed: 0,
  });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const DURATION = 1200;

  useEffect(() => {
    const from = { efficiency: 0, aggression: 0, defense: 0, precision: 0, speed: 0 };
    const to   = stats;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - t, 3);

      const next: CombatStats = {
        efficiency: from.efficiency + (to.efficiency - from.efficiency) * ease,
        aggression: from.aggression + (to.aggression - from.aggression) * ease,
        defense:    from.defense    + (to.defense    - from.defense)    * ease,
        precision:  from.precision  + (to.precision  - from.precision)  * ease,
        speed:      from.speed      + (to.speed      - from.speed)      * ease,
      };
      setAnimated(next);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    startRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stats]);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = (size / 2) * 0.72;

  // Build ring grid lines
  const rings = Array.from({ length: RINGS }, (_, i) => {
    const r = (maxR * (i + 1)) / RINGS;
    const pts = Array.from({ length: SIDES }, (__, j) => {
      const { x, y } = polarToCartesian(cx, cy, r, getAngle(j));
      return `${x},${y}`;
    }).join(" ");
    return pts;
  });

  // Axis lines
  const axisLines = AXES.map((_, i) => {
    const end = polarToCartesian(cx, cy, maxR, getAngle(i));
    return { x1: cx, y1: cy, x2: end.x, y2: end.y };
  });

  // Data polygon points (animated)
  const dataPoints = AXES.map((axis, i) => {
    const v  = (animated[axis.key] ?? 0) / 100;
    const pt = polarToCartesian(cx, cy, maxR * v, getAngle(i));
    return pt;
  });
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Label positions — push a bit further than maxR
  const labelDist = maxR + 30;
  const labels = AXES.map((axis, i) => {
    const angle = getAngle(i);
    const { x, y } = polarToCartesian(cx, cy, labelDist, angle);
    return { ...axis, x, y };
  });

  return (
    <div
      style={{ width: size, height: size, position: "relative" }}
      aria-label="Combat Stats Radar Chart"
      role="img"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        <defs>
          {/* Gradient fill for the data polygon */}
          <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="var(--accent)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.06" />
          </radialGradient>

          {/* Glow filter for the polygon stroke */}
          <filter id="radar-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feComposite  in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Ring grid ── */}
        {rings.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="rgba(var(--accent-rgb), 0.12)"
            strokeWidth={i === RINGS - 1 ? 1.5 : 1}
          />
        ))}

        {/* ── Axis lines ── */}
        {axisLines.map((line, i) => (
          <line
            key={i}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke={`${AXES[i].color}40`}
            strokeWidth={1}
          />
        ))}

        {/* ── Axis dots at maxR ── */}
        {AXES.map((axis, i) => {
          const pt = polarToCartesian(cx, cy, maxR, getAngle(i));
          return (
            <circle
              key={i}
              cx={pt.x} cy={pt.y} r={3}
              fill={axis.color}
              opacity={0.6}
            />
          );
        })}

        {/* ── Data polygon fill ── */}
        <polygon
          points={dataPolygon}
          fill="url(#radar-fill)"
          opacity={0.8}
        />

        {/* ── Data polygon stroke (glowing) ── */}
        <polygon
          points={dataPolygon}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          filter="url(#radar-glow)"
          strokeLinejoin="round"
        />
        <polygon
          points={dataPolygon}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* ── Data vertex dots ── */}
        {dataPoints.map((pt, i) => (
          <React.Fragment key={i}>
            <circle
              cx={pt.x} cy={pt.y} r={5}
              fill={AXES[i].color}
              opacity={0.9}
            />
            <circle
              cx={pt.x} cy={pt.y} r={8}
              fill={AXES[i].color}
              opacity={0.15}
            />
          </React.Fragment>
        ))}

        {/* ── Axis labels ── */}
        {labels.map((lbl, i) => {
          const isLeft  = lbl.x < cx - 10;
          const isRight = lbl.x > cx + 10;
          const anchor  = isLeft ? "end" : isRight ? "start" : "middle";
          const val     = Math.round(animated[lbl.key] ?? 0);

          return (
            <g key={i}>
              {/* icon */}
              <text
                x={lbl.x}
                y={lbl.y - 6}
                textAnchor={anchor}
                fontSize={13}
                dominantBaseline="middle"
              >
                {lbl.icon}
              </text>
              {/* label */}
              <text
                x={lbl.x}
                y={lbl.y + 10}
                textAnchor={anchor}
                fontSize={7.5}
                fontFamily="monospace"
                fontWeight={700}
                letterSpacing={1.5}
                fill={lbl.color}
              >
                {lbl.label}
              </text>
              {/* numeric value */}
              <text
                x={lbl.x}
                y={lbl.y + 22}
                textAnchor={anchor}
                fontSize={10}
                fontFamily="monospace"
                fontWeight={900}
                fill="white"
                opacity={0.85}
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* ── Center dot ── */}
        <circle cx={cx} cy={cy} r={3} fill="var(--accent)" opacity={0.5} />
      </svg>
    </div>
  );
}
