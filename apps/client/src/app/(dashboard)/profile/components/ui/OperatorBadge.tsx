"use client";

import React from "react";
import { Hexagon, Circle, Diamond, Target, Shield, Star } from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconComponent = React.ComponentType<LucideProps>;

interface Tier {
  label:   string;
  minRank: number;
  color:   string;
  Icon:    IconComponent;
}

// Icon placed directly in TIERS — eliminates the GLYPH_MAP indirection and the
// duplicate Hexagon mapping that caused ROOKIE and LEGENDARY to look identical.
const TIERS: Tier[] = [
  { label: "GHOST",     minRank:   0, color: "#6b7280", Icon: Diamond  },
  { label: "ROOKIE",    minRank:  10, color: "#22d3ee", Icon: Circle   },
  { label: "SYNAPTIC",  minRank:  50, color: "#4ade80", Icon: Shield   },
  { label: "OVERDRIVE", minRank: 100, color: "#f97316", Icon: Target   },
  { label: "APEX",      minRank: 200, color: "#a855f7", Icon: Star     },
  { label: "LEGENDARY", minRank: 500, color: "#facc15", Icon: Hexagon  },
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
  const { Icon } = tier;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono
                 text-[10px] font-bold tracking-[0.2em] uppercase transition-all"
      style={{
        background:  `color-mix(in srgb, ${tier.color} 10%, transparent)`,
        border:      `1px solid color-mix(in srgb, ${tier.color} 40%, transparent)`,
        color:       tier.color,
        boxShadow:   `0 0 12px color-mix(in srgb, ${tier.color} 25%, transparent)`,
        textShadow:  `0 0 8px  color-mix(in srgb, ${tier.color} 60%, transparent)`,
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {tier.label}
    </div>
  );
}
