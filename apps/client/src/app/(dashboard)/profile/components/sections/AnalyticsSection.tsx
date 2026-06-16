"use client";

import React from "react";
import { ProfileData, CombatStats } from "../../types";
import { STAT_COLORS } from "../../constants";
import { SectionHeader } from "../ui/SectionHeader";
import { Shimmer } from "../ui/Shimmer";
import { RadarChart } from "../charts/RadarChart";
import { StatRing } from "../ui/StatRing";

interface Props {
  loading:      boolean;
  profile:      ProfileData | null;
  isMobile:     boolean;
  profileColor: string;
  stats:        CombatStats;
}

const RING_DEFS: {
  key:      keyof CombatStats | "winRate";
  label:    string;
  sublabel: string;
  color:    string;
}[] = [
  { key: "winRate",    label: "WIN RATE",   sublabel: "%",         color: "#a855f7" },
  { key: "efficiency", label: "EFFICIENCY", sublabel: "dmg/nrg",   color: STAT_COLORS.efficiency },
  { key: "aggression", label: "AGGRESSION", sublabel: "dmg out",   color: STAT_COLORS.aggression },
  { key: "defense",    label: "DEFENSE",    sublabel: "survival",  color: STAT_COLORS.defense    },
  { key: "precision",  label: "PRECISION",  sublabel: "targeting", color: STAT_COLORS.precision  },
  { key: "speed",      label: "SPEED",      sublabel: "cmd rate",  color: STAT_COLORS.speed      },
];

export function AnalyticsSection({ loading, profile, isMobile, profileColor, stats }: Props) {
  return (
    <div className="mb-8">
      <SectionHeader label="COMBAT ANALYTICS" sub="5-AXIS PERFORMANCE" />

      {loading ? (
        <Shimmer className={isMobile ? "h-[340px]" : "h-[300px]"} />
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "rgba(var(--accent-rgb),0.025)",
            border:     "1px solid rgba(var(--accent-rgb),0.12)",
            boxShadow:  "0 0 40px rgba(var(--accent-rgb),0.05)",
          }}
        >
          {/* Top accent strip */}
          <div
            className="h-[2px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${profileColor}, transparent)`,
              opacity: 0.6,
            }}
          />

          <div
            className={`flex ${isMobile ? "flex-col items-center gap-8" : "flex-row items-center justify-around gap-4"} p-6`}
          >
            {/* Radar chart */}
            <div className="flex flex-col items-center gap-2">
              <RadarChart stats={stats} size={isMobile ? 260 : 280} />
              <p className="text-[8px] text-accent/50 tracking-[0.18em] font-mono m-0">
                PERFORMANCE METRICS
              </p>
            </div>

            {/* All 6 stat rings — 2-col desktop, 3-col mobile */}
            <div className={`grid ${isMobile ? "grid-cols-3" : "grid-cols-2"} gap-6`}>
              {RING_DEFS.map(({ key, label, sublabel, color }) => {
                const value =
                  key === "winRate"
                    ? (profile?.winRate ?? 0)
                    : (stats[key as keyof CombatStats] ?? 0);
                return (
                  <StatRing
                    key={key}
                    value={value}
                    label={label}
                    sublabel={sublabel}
                    color={color}
                    size={isMobile ? 78 : 88}
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom strip */}
          <div
            className="h-[1px] w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(var(--accent-rgb),0.25), transparent)",
            }}
          />
        </div>
      )}
    </div>
  );
}
