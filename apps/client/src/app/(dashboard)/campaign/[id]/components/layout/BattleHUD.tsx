"use client";

import React from "react";
import { Skull } from "lucide-react";

const MAX_STAT_VALUE = 100;
const CRITICAL_HEALTH_PERCENT = 30;
const PERCENT_SCALE = 100;
const BOSS_HEALTH_SEGMENTS = 18;
const BOSS_WARNING_DURATION_MS = 2600;

interface BattleHUDProps {
  playerHealth: number;
  enemyHealth: number;
  playerEnergy: number;
  tick: number;
  maxTicks: number;
  isMobile: boolean;
  isBossLevel?: boolean;
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
          className="h-full w-full origin-left bg-accent transition-[transform,box-shadow] duration-300 ease-out"
          style={{
            transform: `scaleX(${healthPercent / PERCENT_SCALE})`,
            boxShadow: isCritical ? "0 0 14px rgba(var(--accent-rgb),0.85)" : "0 0 8px rgba(var(--accent-rgb),0.35)",
          }}
        />
      </div>
      {energyPercent !== null && (
        <div className="mt-1 h-1 rounded-full border border-accent/10 bg-bg-primary/70 overflow-hidden">
          <div
            className="h-full w-full origin-left bg-accent/60 transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${energyPercent / PERCENT_SCALE})` }}
          />
        </div>
      )}
    </div>
  );
}

function BossWarning({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`boss-warning flex items-center justify-center gap-2 rounded-md border border-[var(--sem-danger)] bg-[rgba(var(--sem-danger-rgb),0.12)] px-3 ${compact ? "py-1" : "py-1.5"} text-[var(--sem-danger)] shadow-[0_0_18px_rgba(var(--sem-danger-rgb),0.22)]`}
      style={{ animationDuration: `${BOSS_WARNING_DURATION_MS}ms` }}
      aria-live="polite"
    >
      <Skull className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="text-[8px] font-black uppercase tracking-[0.24em]">WARNING: BOSS ENCOUNTER</span>
    </div>
  );
}

function BossHealthBar({ health }: { health: number }) {
  const healthPercent = clampPercent(health);
  const activeSegments = Math.ceil((healthPercent / PERCENT_SCALE) * BOSS_HEALTH_SEGMENTS);

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[var(--sem-danger)]">
          <Skull className="h-4 w-4 drop-shadow-[0_0_8px_rgba(var(--sem-danger-rgb),0.7)]" aria-hidden="true" />
          <span className="text-[8px] font-black uppercase tracking-[0.26em]">BOSS</span>
        </div>
        <span className="text-[10px] font-black tracking-[0.12em] text-[var(--sem-danger)]">{Math.ceil(health)}</span>
      </div>
      <div
        className="grid h-4 gap-[2px] rounded-md border border-[var(--sem-danger)] bg-bg-primary/85 p-[2px] shadow-[0_0_22px_rgba(var(--sem-danger-rgb),0.16)]"
        style={{ gridTemplateColumns: `repeat(${BOSS_HEALTH_SEGMENTS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: BOSS_HEALTH_SEGMENTS }, (_, index) => (
          <span
            key={index}
            className={`h-full rounded-[2px] transition-colors duration-200 ${
              index < activeSegments
                ? "bg-[var(--sem-danger)] shadow-[0_0_8px_rgba(var(--sem-danger-rgb),0.55)]"
                : "bg-[rgba(var(--sem-danger-rgb),0.12)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function BattleHUD({ playerHealth, enemyHealth, playerEnergy, tick, maxTicks, isMobile, isBossLevel = false }: BattleHUDProps) {
  const boundedMaxTicks = Math.max(1, maxTicks);
  const progressPercent = clampPercent(tick, boundedMaxTicks);
  const remainingTicks = Math.max(0, boundedMaxTicks - tick);
  const warningStyles = (
    <style>{`
      @keyframes bossWarningFlash {
        0%, 100% { opacity: 0; transform: translateY(-4px) scale(0.98); }
        10%, 28%, 46%, 64% { opacity: 1; transform: translateY(0) scale(1); }
        19%, 37%, 55% { opacity: 0.35; transform: translateY(0) scale(1); }
        82% { opacity: 1; }
      }

      .boss-warning {
        animation: bossWarningFlash ease-out both;
      }
    `}</style>
  );

  if (isMobile) {
    return (
      <div className="mb-2 rounded-lg border border-accent/15 bg-bg-primary/85 px-3 py-2 shadow-[0_0_24px_rgba(var(--accent-rgb),0.08)]">
        {warningStyles}
        {isBossLevel && <div className="mb-2"><BossWarning compact /></div>}
        <div className="grid grid-cols-2 gap-3">
          <StatBlock label="ALLY" health={playerHealth} energy={playerEnergy} align="left" />
          {isBossLevel ? (
            <div className="text-right">
              <BossHealthBar health={enemyHealth} />
            </div>
          ) : (
            <StatBlock label="ENEMY" health={enemyHealth} align="right" />
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[8px] font-black tracking-[0.18em] text-accent/70 uppercase">TIME</span>
          <div className="h-1.5 flex-1 rounded-full border border-accent/10 bg-bg-primary/80 overflow-hidden">
            <div className="h-full w-full origin-left bg-accent/70 transition-transform duration-300 ease-out" style={{ transform: `scaleX(${progressPercent / PERCENT_SCALE})` }} />
          </div>
          <span className="min-w-[42px] text-right text-[8px] font-black tracking-[0.12em] text-accent/60">{remainingTicks}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-3 gap-6 px-4 py-3 bg-bg-primary backdrop-blur-sm z-20">
      {warningStyles}
      <div className="flex flex-col justify-center">
        <StatBlock label="ALLY" health={playerHealth} energy={playerEnergy} align="left" />
      </div>

      <div className="flex flex-col items-center justify-center">
        {isBossLevel && <div className="mb-2 w-full max-w-[200px]"><BossWarning compact /></div>}
        <div className="w-full max-w-[220px] flex items-center gap-3">
          <span className="text-[8px] font-black tracking-[0.2em] text-accent/70 uppercase">TIME</span>
          <div className="h-1.5 flex-1 rounded-full border border-accent/10 bg-bg-primary/80 overflow-hidden">
            <div className="h-full w-full origin-left bg-accent/70 transition-transform duration-300 ease-out" style={{ transform: `scaleX(${progressPercent / PERCENT_SCALE})` }} />
          </div>
          <span className="min-w-[28px] text-right text-[8px] font-black tracking-[0.12em] text-accent/60">{remainingTicks}</span>
        </div>
      </div>

      <div className="flex flex-col justify-center items-end">
        {isBossLevel ? (
          <BossHealthBar health={enemyHealth} />
        ) : (
          <StatBlock label="ENEMY" health={enemyHealth} align="right" />
        )}
      </div>
    </div>
  );
}
