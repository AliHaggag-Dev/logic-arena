import React, { useState } from "react";

interface Props {
  label: string;
  value: string | number;
  accent: string;
}

export function StatCard({ label, value, accent }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="bg-card/55 rounded-[10px] p-[20px_22px] flex flex-col gap-2 backdrop-blur-md transition-all duration-250 shrink-0"
      style={{
        boxShadow: 'var(--card-shadow)',
        border: `1px solid color-mix(in srgb, ${accent} ${hovered ? 30 : 10}%, transparent)`
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="text-[9px] tracking-[0.22em] font-bold uppercase transition-colors"
        style={{ color: `color-mix(in srgb, ${accent} 60%, transparent)` }}
      >
        {label}
      </span>
      <span
        className="text-[32px] font-black leading-none tracking-[-0.02em] transition-colors"
        style={{
          textShadow: `0 0 14px color-mix(in srgb, ${accent} 60%, transparent)`,
          color: accent
        }}
      >
        {value}
      </span>
    </div>
  );
}
