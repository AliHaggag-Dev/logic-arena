"use client";

import { useEffect, useState } from "react";

const DEFAULT_GAUGE_SIZE = 220;
const FULL_PERCENT = 100;
const HALF_PERCENT = 50;
const STROKE_WIDTH = 16;
const GAUGE_RADIUS = 84;
const GAUGE_CENTER_X = 110;
const GAUGE_CENTER_Y = 112;
const GAUGE_START_X = 26;
const GAUGE_END_X = 194;
const GAUGE_PATH = `M ${GAUGE_START_X} ${GAUGE_CENTER_Y} A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${GAUGE_END_X} ${GAUGE_CENTER_Y}`;
const ANIMATION_DELAY_MS = 80;

export interface GaugeWidgetProps {
  value: number;
  title: string;
  maxLabel?: string;
}

function clampPercent(value: number): number {
  return Math.min(Math.max(value, 0), FULL_PERCENT);
}

export function GaugeWidget({ value, title, maxLabel = "100" }: GaugeWidgetProps): React.ReactElement {
  const [animatedValue, setAnimatedValue] = useState(0);
  const normalizedValue = clampPercent(value);
  const dashArray = Math.PI * GAUGE_RADIUS;
  const dashOffset = dashArray - (animatedValue / FULL_PERCENT) * dashArray;

  useEffect((): (() => void) => {
    const timeoutId = window.setTimeout(() => setAnimatedValue(normalizedValue), ANIMATION_DELAY_MS);
    return (): void => window.clearTimeout(timeoutId);
  }, [normalizedValue]);

  return (
    <section className="w-full rounded-lg border border-accent/20 bg-card p-4 shadow-[var(--card-shadow)] md:p-5">
      <h3 className="font-mono text-xs font-black uppercase tracking-widest text-text-primary md:text-sm">{title}</h3>
      <div className="mt-4 flex justify-center">
        <div className="relative" style={{ width: DEFAULT_GAUGE_SIZE, height: DEFAULT_GAUGE_SIZE / 2 }}>
          <svg width={DEFAULT_GAUGE_SIZE} height={DEFAULT_GAUGE_SIZE / 2} viewBox={`0 0 ${DEFAULT_GAUGE_SIZE} ${DEFAULT_GAUGE_SIZE / 2}`} role="img" aria-label={`${title}: ${normalizedValue}%`}>
            <defs>
              <linearGradient id="admin-gauge-gradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="var(--sem-success)" />
                <stop offset="50%" stopColor="var(--sem-warning)" />
                <stop offset="100%" stopColor="var(--sem-danger)" />
              </linearGradient>
            </defs>
            <path d={GAUGE_PATH} fill="none" stroke="rgba(var(--accent-rgb),0.12)" strokeLinecap="round" strokeWidth={STROKE_WIDTH} />
            <path
              d={GAUGE_PATH}
              fill="none"
              stroke="url(#admin-gauge-gradient)"
              strokeLinecap="round"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 text-center font-mono text-3xl font-black text-text-primary">
            {Math.round(normalizedValue)}%
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-text-secondary">
        <span>0</span>
        <span>{HALF_PERCENT}</span>
        <span>{maxLabel}</span>
      </div>
    </section>
  );
}
