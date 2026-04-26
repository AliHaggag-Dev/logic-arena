"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  value: number;       // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  sublabel: string;
}

export function StatRing({
  value,
  size = 90,
  strokeWidth = 7,
  color = "var(--accent)",
  label,
  sublabel,
}: Props) {
  const [animated, setAnimated] = useState(0);
  const rafRef   = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const DURATION = 1000;

  useEffect(() => {
    const from = 0;
    const to   = value;
    startRef.current = null;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t    = Math.min((ts - startRef.current) / DURATION, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimated(from + (to - from) * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  const r           = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset      = circumference - (animated / 100) * circumference;

  return (
    <div
      className="flex flex-col items-center gap-1.5"
      role="img"
      aria-label={`${label}: ${value}%`}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={0.1}
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 5px ${color})`,
              transition: "stroke-dashoffset 0.05s linear",
            }}
          />
        </svg>
        {/* Center value */}
        <div
          className="absolute inset-0 flex items-center justify-center font-black font-mono"
          style={{
            fontSize: 18,
            color,
            textShadow: `0 0 10px ${color}`,
          }}
        >
          {Math.round(animated)}
        </div>
      </div>
      <span
        className="text-[9px] font-bold tracking-[0.18em] uppercase font-mono"
        style={{ color: `${color}B0` }}
      >
        {label}
      </span>
      <span className="text-[8px] text-accent/35 tracking-[0.1em] font-mono">
        {sublabel}
      </span>
    </div>
  );
}
