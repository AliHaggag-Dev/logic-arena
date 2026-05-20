"use client";

import React from "react";

const MAX_STAT_VALUE = 100;
const CRITICAL_HEALTH_PERCENT = 30;

interface BattleHUDProps {
  playerHealth: number;
  enemyHealth: number;
  playerEnergy: number;
  tick: number;
  maxTicks: number;
  isMobile: boolean;
}

interface StatBlockProps {
  label: string;
  health: number;
  energy?: number;
  align: "left" | "right";
}

function clampPercent(value: number, max: number = MAX_STAT_VALUE): number {
  return Math.max(0, Math.min(MAX_STAT_VALUE, (value / max) * MAX_STAT_VALUE));
}

function StatBlock({ label, health, energy, align }: StatBlockProps) {
  const healthPercent = clampPercent(health);
  const energyPercent = energy === undefined ? null : clampPercent(energy);
  const isCritical = healthPercent < CRITICAL_HEALTH_PERCENT;

  return (
    <div className={`min-w-[132px] ${align === "right" ? "text-right" : "text-left"}`}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-[8px] font-black tracking-[0.22em] text-accent/60 uppercase">{label}</span>
        <span className="text-[9px] font-black tracking-[0.12em] text-accent/80">{Math.ceil(health)}</span>
      </div>
      <div className={`h-2 rounded-full border border-accent/20 bg-bg-primary/80 overflow-hidden ${isCritical ? "shadow-[0_0_14px_rgba(var(--accent-rgb),0.55)]" : ""}`}>
        <div
          className="h-full bg-accent transition-[width,box-shadow] duration-300 ease-out"
          style={{
            width: `${healthPercent}%`,
            boxShadow: isCritical ? "0 0 14px rgba(var(--accent-rgb),0.85)" : "0 0 8px rgba(var(--accent-rgb),0.35)",
          }}
        />
      </div>
      {energyPercent !== null && (
        <div className="mt-1 h-1 rounded-full border border-accent/10 bg-bg-primary/70 overflow-hidden">
          <div
            className="h-full bg-accent/60 transition-[width] duration-300 ease-out"
            style={{ width: `${energyPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function BattleHUD({ playerHealth, enemyHealth, playerEnergy, tick, maxTicks, isMobile }: BattleHUDProps) {
  const boundedMaxTicks = Math.max(1, maxTicks);
  const progressPercent = clampPercent(tick, boundedMaxTicks);
  const remainingTicks = Math.max(0, boundedMaxTicks - tick);

  if (isMobile) {
    return (
      <div className="mb-2 rounded-lg border border-accent/15 bg-bg-primary/85 px-3 py-2 shadow-[0_0_24px_rgba(var(--accent-rgb),0.08)]">
        <div className="grid grid-cols-2 gap-3">
          <StatBlock label="ALLY" health={playerHealth} energy={playerEnergy} align="left" />
          <StatBlock label="ENEMY" health={enemyHealth} align="right" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[8px] font-black tracking-[0.18em] text-accent/45 uppercase">TIME</span>
          <div className="h-1.5 flex-1 rounded-full border border-accent/10 bg-bg-primary/80 overflow-hidden">
            <div className="h-full bg-accent/70 transition-[width] duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="min-w-[42px] text-right text-[8px] font-black tracking-[0.12em] text-accent/60">{remainingTicks}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-4 top-4 rounded-lg border border-accent/15 bg-bg-primary/75 p-3 backdrop-blur-sm shadow-[0_0_28px_rgba(var(--accent-rgb),0.08)]">
        <StatBlock label="ALLY" health={playerHealth} energy={playerEnergy} align="left" />
      </div>
      <div className="absolute right-4 top-4 rounded-lg border border-accent/15 bg-bg-primary/75 p-3 backdrop-blur-sm shadow-[0_0_28px_rgba(var(--accent-rgb),0.08)]">
        <StatBlock label="ENEMY" health={enemyHealth} align="right" />
      </div>
      <div className="absolute bottom-4 left-1/2 w-[46%] -translate-x-1/2 rounded-lg border border-accent/15 bg-bg-primary/75 p-2 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] font-black tracking-[0.22em] text-accent/45 uppercase">TIME REMAINING</span>
          <span className="text-[8px] font-black tracking-[0.16em] text-accent/65">{remainingTicks} TICKS</span>
        </div>
        <div className="h-2 rounded-full border border-accent/10 bg-bg-primary/80 overflow-hidden">
          <div className="h-full bg-accent/70 transition-[width] duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
