"use client";

import React, { useEffect, useRef, useState, useMemo, useId } from "react";
import { CombatStats } from "../../types";
import { AXES, SIDES, RINGS, DURATION } from "./RadarChart.constants";
import { polarToCartesian, getAngle } from "./RadarChart.utils";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface Props {
  stats: CombatStats;
  size?: number;
}

export function RadarChart({ stats, size = 280 }: Props) {
  const uid = useId();
  const fillId = `radar-fill-${uid}`;
  const glowId = `radar-glow-${uid}`;

  const [animated, setAnimated] = useState<CombatStats>({
    efficiency: 0, aggression: 0, defense: 0, precision: 0, speed: 0,
  });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const from = { efficiency: 0, aggression: 0, defense: 0, precision: 0, speed: 0 };
    const to = stats;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      const ease = easeOutCubic(t);

      setAnimated({
        efficiency: from.efficiency + (to.efficiency - from.efficiency) * ease,
        aggression: from.aggression + (to.aggression - from.aggression) * ease,
        defense: from.defense + (to.defense - from.defense) * ease,
        precision: from.precision + (to.precision - from.precision) * ease,
        speed: from.speed + (to.speed - from.speed) * ease,
      });

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [stats]);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = (size / 2) * 0.72;

  const { rings, axisLines, axisDots, labels } = useMemo(() => {
    const ringPts = Array.from({ length: RINGS }, (_, i) => {
      const r = (maxR * (i + 1)) / RINGS;
      return Array.from({ length: SIDES }, (__, j) => {
        const { x, y } = polarToCartesian(cx, cy, r, getAngle(j));
        return `${x},${y}`;
      }).join(" ");
    });

    const lines = AXES.map((_, i) => {
      const end = polarToCartesian(cx, cy, maxR, getAngle(i));
      return { x1: cx, y1: cy, x2: end.x, y2: end.y };
    });

    const dots = AXES.map((_, i) => polarToCartesian(cx, cy, maxR, getAngle(i)));

    const labelDist = maxR + 30;
    const lbls = AXES.map((axis, i) => {
      const angle = getAngle(i);
      const { x, y } = polarToCartesian(cx, cy, labelDist, angle);
      return { ...axis, x, y };
    });

    return { rings: ringPts, axisLines: lines, axisDots: dots, labels: lbls };
  }, [cx, cy, maxR]);

  const dataPoints = AXES.map((axis, i) => {
    const v = (animated[axis.key] ?? 0) / 100;
    return polarToCartesian(cx, cy, maxR * v, getAngle(i));
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div
      style={{ width: size, height: size, position: "relative" }}
      aria-label="Combat Stats Radar Chart"
      role="img"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        <defs>
          <radialGradient id={fillId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.06" />
          </radialGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {rings.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="rgba(var(--accent-rgb), 0.12)"
            strokeWidth={i === RINGS - 1 ? 1.5 : 1}
          />
        ))}

        {axisLines.map((line, i) => (
          <line
            key={i}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke={`${AXES[i].color}40`}
            strokeWidth={1}
          />
        ))}

        {axisDots.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={AXES[i].color} opacity={0.6} />
        ))}

        <polygon points={dataPolygon} fill={`url(#${fillId})`} opacity={0.8} />

        <polygon
          points={dataPolygon}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          filter={`url(#${glowId})`}
          strokeLinejoin="round"
        />
        <polygon
          points={dataPolygon}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {dataPoints.map((pt, i) => (
          <React.Fragment key={i}>
            <circle cx={pt.x} cy={pt.y} r={5} fill={AXES[i].color} opacity={0.9} />
            <circle cx={pt.x} cy={pt.y} r={8} fill={AXES[i].color} opacity={0.15} />
          </React.Fragment>
        ))}

        {labels.map((lbl, i) => {
          const isLeft = lbl.x < cx - 10;
          const isRight = lbl.x > cx + 10;
          const anchor = isLeft ? "end" : isRight ? "start" : "middle";
          const val = Math.round(animated[lbl.key] ?? 0);
          const Icon = lbl.Icon;

          return (
            <g key={i}>
              <Icon
                x={lbl.x - 9}
                y={lbl.y - 18}
                width={18}
                height={18}
                color={lbl.color}
                strokeWidth={2.5}
                style={{ filter: `drop-shadow(0 0 4px ${lbl.color}80)` }}
              />
              <text
                x={lbl.x} y={lbl.y + 10}
                textAnchor={anchor}
                fontSize={7.5}
                fontFamily="monospace"
                fontWeight={700}
                letterSpacing={1.5}
                fill={lbl.color}
              >
                {lbl.label}
              </text>
              <text
                x={lbl.x} y={lbl.y + 22}
                textAnchor={anchor}
                fontSize={10}
                fontFamily="monospace"
                fontWeight={900}
                fill="var(--accent)"
                opacity={0.85}
              >
                {val}
              </text>
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={3} fill="var(--accent)" opacity={0.5} />
      </svg>
    </div>
  );
}
