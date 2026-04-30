"use client";

import React from "react";

interface Props {
  label: string;
  value: string | number;
  accent: string;
}

// Hover effect via CSS custom property to avoid useState re-renders (P5)
export function StatCard({ label, value, accent }: Props) {
  return (
    <div
      className="rounded-[10px] p-[20px_22px] flex flex-col gap-2 backdrop-blur-md
                 transition-all duration-250 shrink-0 group"
      style={{
        background: "color-mix(in srgb, var(--card) 55%, transparent)",
        boxShadow: "var(--card-shadow)",
        border: `1px solid color-mix(in srgb, ${accent} 10%, transparent)`,
        // CSS custom property drives the hover border via the group class below
      }}
      // Pure-CSS hover instead of JS state (no unnecessary re-renders)
      onMouseEnter={(e) =>
        (e.currentTarget.style.border = `1px solid color-mix(in srgb, ${accent} 30%, transparent)`)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.border = `1px solid color-mix(in srgb, ${accent} 10%, transparent)`)
      }
    >
      <span
        className="text-[9px] tracking-[0.22em] font-bold uppercase"
        style={{ color: `color-mix(in srgb, ${accent} 60%, transparent)` }}
      >
        {label}
      </span>
      <span
        className="text-[32px] font-black leading-none tracking-[-0.02em]"
        style={{
          color: accent,
          textShadow: `0 0 14px color-mix(in srgb, ${accent} 60%, transparent)`,
        }}
      >
        {value}
      </span>
    </div>
  );
}
