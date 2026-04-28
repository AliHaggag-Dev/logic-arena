"use client";

import React from "react";
import { Hexagon, Circle, Diamond, Target, Shield, Star } from 'lucide-react';

const GLYPH_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  '⬡': Hexagon,
  '⦾': Circle,
  '◈': Diamond,
  '◉': Target,
  '⬟': Shield,
  '⬣': Hexagon,
  '★': Star,
};

interface Tier {
  label: string;
  minRank: number;
  color: string;
  glyph: string;
}

const TIERS: Tier[] = [
  { label: "GHOST", minRank: 0, color: "#6b7280", glyph: "◈" },
  { label: "ROOKIE", minRank: 10, color: "#22d3ee", glyph: "⬡" },
  { label: "SYNAPTIC", minRank: 50, color: "#4ade80", glyph: "⬟" },
  { label: "OVERDRIVE", minRank: 100, color: "#f97316", glyph: "⬣" },
  { label: "APEX", minRank: 200, color: "#a855f7", glyph: "★" },
  { label: "LEGENDARY", minRank: 500, color: "#facc15", glyph: "⬡" },
];

function getTier(rank: number): Tier {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (rank >= t.minRank) tier = t;
  }
  return tier;
}

interface Props {
  rank: number;
}

export function OperatorBadge({ rank }: Props) {
  const tier = getTier(rank);

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[10px] font-bold tracking-[0.2em] uppercase transition-all"
      style={{
        background: `color-mix(in srgb, ${tier.color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${tier.color} 40%, transparent)`,
        color: tier.color,
        boxShadow: `0 0 12px color-mix(in srgb, ${tier.color} 25%, transparent)`,
        textShadow: `0 0 8px color-mix(in srgb, ${tier.color} 60%, transparent)`,
      }}
    >
      {(() => {
        const Icon = GLYPH_MAP[tier.glyph] || Hexagon;
        return <Icon className="w-3.5 h-3.5" />;
      })()}
      {tier.label}
    </div>
  );
}
