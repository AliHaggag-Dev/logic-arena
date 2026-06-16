"use client";

import React, { useId } from "react";

interface Props {
  username: string;
  avatarUrl: string | null;
  color: string;
  size: number;
}

// Unique filter IDs via useId() prevent SVG filter conflicts when multiple
// avatars appear on the same page.
export function HexAvatar({ username, avatarUrl, color, size }: Props) {
  const uid      = useId();
  const filterId = `hex-glow-${uid}`;
  const clipId   = `hex-clip-${uid}`;
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
          <clipPath id={clipId}>
            <polygon points="50,12 86,31 86,69 50,88 14,69 14,31" />
          </clipPath>
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
        {avatarUrl ? (
          <image
            href={avatarUrl}
            x="14"
            y="12"
            width="72"
            height="76"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
            // @ts-ignore -- loading is valid SVG 2 attribute for <image> in HTML context
            loading="eager"
            aria-label={`Profile picture for ${username}`}
          />
        ) : (
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
        )}
        {avatarUrl && (
          <polygon
            points="50,12 86,31 86,69 50,88 14,69 14,31"
            fill="transparent"
            stroke={color}
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  );
}
