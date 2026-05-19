"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_RING_SIZE = 128;
const DEFAULT_RING_COLOR = "var(--accent)";
const STROKE_WIDTH = 10;
const FULL_PERCENT = 100;
const HALF_DIVISOR = 2;
const ANIMATION_DELAY_MS = 80;

export interface ProgressRingProps {
  value: number;
  label: string;
  size?: number;
  color?: string;
}

function clampPercent(value: number): number {
  return Math.min(Math.max(value, 0), FULL_PERCENT);
}

export function ProgressRing({ value, label, size = DEFAULT_RING_SIZE, color = DEFAULT_RING_COLOR }: ProgressRingProps): React.ReactElement {
  const [animatedValue, setAnimatedValue] = useState(0);
  const normalizedValue = clampPercent(value);
  const radius = (size - STROKE_WIDTH) / HALF_DIVISOR;
  const circumference = useMemo((): number => Math.PI * radius * HALF_DIVISOR, [radius]);
  const offset = circumference - (animatedValue / FULL_PERCENT) * circumference;

  useEffect((): (() => void) => {
    const timeoutId = window.setTimeout(() => setAnimatedValue(normalizedValue), ANIMATION_DELAY_MS);
    return (): void => window.clearTimeout(timeoutId);
  }, [normalizedValue]);

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size} role="img" aria-label={`${label}: ${normalizedValue}%`}>
          <circle cx={size / HALF_DIVISOR} cy={size / HALF_DIVISOR} r={radius} fill="none" stroke="rgba(var(--accent-rgb),0.12)" strokeWidth={STROKE_WIDTH} />
          <circle
            cx={size / HALF_DIVISOR}
            cy={size / HALF_DIVISOR}
            r={radius}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-black text-text-primary">
          {Math.round(normalizedValue)}%
        </div>
      </div>
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-text-secondary">{label}</p>
    </div>
  );
}
