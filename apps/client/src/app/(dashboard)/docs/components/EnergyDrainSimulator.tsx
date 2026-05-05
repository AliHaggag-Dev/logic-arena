'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Zap } from 'lucide-react';
import {
  getCost,
  MAX_ENERGY,
  REGEN_PER_TICK,
  STASIS_ENTRY_THRESHOLD,
  STASIS_EXIT_THRESHOLD,
} from './EnergyCostTable';

/** ms between simulator ticks. */
const SIM_TICK_MS = 120;

const SIMULATE_CMDS: { label: string; cmds: string[] }[] = [
  { label: 'SCAN loop',        cmds: ['SCAN', 'MOVE'] },
  { label: 'PATHFIND + FIRE',  cmds: ['PATHFIND', 'FIRE'] },
  { label: 'BURST sniper',     cmds: ['SCAN', 'PATHFIND', 'BURST_FIRE'] },
  { label: 'Pure movement',    cmds: ['MOVE_FAST'] },
];

export function EnergyDrainSimulator({ isMobile }: { isMobile: boolean }) {
  const [simIndex, setSimIndex] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [running, setRunning] = useState(false);
  const [tickCount, setTickCount] = useState(0);

  const pct = Math.max(0, Math.min(100, (energy / MAX_ENERGY) * 100));
  const inStasis = energy <= STASIS_ENTRY_THRESHOLD;
  const exitingStasis = energy > STASIS_ENTRY_THRESHOLD && energy < STASIS_EXIT_THRESHOLD;

  const barColor =
    inStasis || exitingStasis ? 'var(--docs-red)' :
    pct > 60               ? 'var(--docs-green)' :
    pct > 30               ? 'var(--docs-orange)' :
                             'var(--docs-red)';

  const tickCost = SIMULATE_CMDS[simIndex].cmds.reduce(
    (sum, cmd) => sum + getCost(cmd),
    0,
  );

  // Net per tick: regen only applies DURING STASIS, never when active.
  const netPerTick = inStasis ? REGEN_PER_TICK : -tickCost;

  const handleTick = useCallback(() => {
    setEnergy(prev => {
      const isInStasis = prev <= STASIS_ENTRY_THRESHOLD;
      if (isInStasis) {
        // STASIS: regen only, no commands execute
        return Math.min(MAX_ENERGY, prev + REGEN_PER_TICK);
      }
      // Active: drain from commands, no passive regen
      const cost = SIMULATE_CMDS[simIndex].cmds.reduce(
        (sum, cmd) => sum + getCost(cmd),
        0,
      );
      return Math.max(STASIS_ENTRY_THRESHOLD, prev - cost);
    });
    setTickCount(t => t + 1);
  }, [simIndex]);

  const handleReset = useCallback(() => {
    setEnergy(MAX_ENERGY);
    setTickCount(0);
    setRunning(false);
  }, []);

  // FIX: deps array prevents interval churn on every render
  useEffect(() => {
    if (!running) return;
    const id = setInterval(handleTick, SIM_TICK_MS);
    return () => clearInterval(id);
  }, [running, handleTick]);

  return (
    <div className="rounded-2xl border border-indigo-400/25 bg-card/30 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-5">
        <Zap className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-black tracking-[0.2em] uppercase text-indigo-400">Drain Simulator</span>
        <span className="ml-auto text-[10px] text-text-secondary/50 font-mono">tick #{tickCount}</span>
      </div>

      {/* Energy bar */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <span style={{ color: inStasis ? 'var(--docs-red)' : barColor }} className="font-black tracking-widest uppercase">
            {inStasis       ? '⚠ STASIS — REGEN ACTIVE'  :
             exitingStasis  ? '↑ EXITING STASIS…'         :
                              'ENERGY'}
          </span>
          <span className="text-text-secondary/60">{Math.round(energy)} / {MAX_ENERGY}</span>
        </div>
        <div className="h-3 rounded-full bg-card/60 border border-text-secondary/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${barColor} 60%, transparent), ${barColor})` }}
          />
        </div>
        {exitingStasis && (
          <p className="text-[9px] text-text-secondary/40 mt-1 font-mono tracking-wider">
            Exit STASIS at {STASIS_EXIT_THRESHOLD} energy
          </p>
        )}
      </div>

      {/* Preset selector */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2 mb-4`}>
        {SIMULATE_CMDS.map((p, i) => (
          <button
            key={p.label}
            type="button"
            onClick={() => { setSimIndex(i); handleReset(); }}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${i === simIndex ? 'bg-card' : 'bg-transparent'} hover:opacity-75 cursor-pointer`}
            style={{
              borderColor: i === simIndex ? 'var(--docs-indigo)' : 'color-mix(in srgb, var(--text-primary) 10%, transparent)',
              transform:   i === simIndex ? 'scale(1.05)' : 'scale(1)',
              color:       i === simIndex ? 'var(--docs-indigo)' : 'var(--text-secondary)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tick cost breakdown */}
      <div className="flex items-center gap-3 mb-4 text-[11px] font-mono flex-wrap">
        <span className="text-text-secondary/60">Per tick:</span>
        {SIMULATE_CMDS[simIndex].cmds.map(cmd => {
          const cost = getCost(cmd);
          return (
            <span key={cmd} className="flex items-center gap-1">
              <code className="font-black text-accent">{cmd}</code>
              <span className="text-text-secondary/50">−{cost}</span>
            </span>
          );
        })}
        {inStasis && (
          <>
            <span className="text-text-secondary/40">→</span>
            <span>
              <code className="text-indigo-400 font-black">REGEN</code>
              {' '}
              <span className="text-text-secondary/50">+{REGEN_PER_TICK}</span>
            </span>
          </>
        )}
        <span 
          className="font-mono text-sm tracking-widest font-black ml-auto"
          style={{ color: netPerTick >= 0 ? 'var(--docs-green)' : 'var(--docs-orange)' }}
        >
          NET {netPerTick >= 0 ? '+' : ''}{netPerTick} / tick
        </span>
      </div>

      {/* Note about regen rule */}
      {!inStasis && (
        <p className="text-[9px] text-text-secondary/40 mb-4 font-mono tracking-wider">
          ⚡ Active robots do not regenerate. Run out of energy to enter STASIS and regen.
        </p>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          className="flex-1 py-3 rounded-lg border font-black tracking-widest hover:opacity-75 uppercase transition-all cursor-pointer"
          style={{
            borderColor: running ? 'var(--docs-red)' : 'var(--docs-indigo)',
            background:  running ? 'color-mix(in srgb, var(--docs-red) 5%, transparent)' : 'color-mix(in srgb, var(--docs-indigo) 5%, transparent)',
            color:       running ? 'var(--docs-red)' : 'var(--docs-indigo)',
          }}
          onClick={() => setRunning(!running)}
        >
          {running ? '⏸ PAUSE' : '▶ SIMULATE'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-5 py-2.5 rounded-xl font-black text-[11px] tracking-[0.2em] uppercase transition-all border border-text-secondary/20 text-text-secondary/60 hover:border-text-secondary/40 cursor-pointer"
        >
          RESET
        </button>
      </div>
    </div>
  );
}
