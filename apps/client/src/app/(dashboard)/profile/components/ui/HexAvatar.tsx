"use client";

import React, { useId } from "react";

interface Props {
  username: string;
  color: string;
  size: number;
}

// Unique filter IDs via useId() prevent SVG filter conflicts when multiple
// avatars appear on the same page.
export function HexAvatar({ username, color, size }: Props) {
  const uid      = useId();
  const filterId = `hex-glow-${uid}`;
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div
      style={{ width: size, height: size, position: "relative", flexShrink: 0 }}
      aria-label={`Avatar for ${username}`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Outer hex */}
        <polygon
          points="50,4 95,27.5 95,72.5 50,96 5,72.5 5,27.5"
          fill={`${color}18`}
          stroke={color}
          strokeWidth="2"
          filter={`url(#${filterId})`}
        />
        {/* Inner hex */}
        <polygon
          points="50,16 84,34.5 84,65.5 50,84 16,65.5 16,34.5"
          fill={`${color}10`}
          stroke={`${color}40`}
          strokeWidth="1"
        />
        {/* Initials */}
        <text
          x="50" y="58"
          textAnchor="middle"
          fontFamily="monospace"
          fontWeight="900"
          fontSize="28"
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        >
          {initials}
        </text>
      </svg>
    </div>
  );
}
