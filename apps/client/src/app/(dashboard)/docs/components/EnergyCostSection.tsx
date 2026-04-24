'use client';

import React, { useState } from 'react';

// ─── Energy data (kept in sync with packages/engine/src/energy-manager.ts) ────
const REGEN_PER_TICK = 3;
const MAX_ENERGY     = 1000;

interface EnergyEntry {
  command:   string;
  cost:      number;      // per invocation / per tick
  unit:      string;      // label next to cost
  category:  'movement' | 'combat' | 'sensor' | 'cognitive';
  color:     string;
  icon:      string;
  note?:     string;
}

const ENTRIES: EnergyEntry[] = [
  // Cognitive — free
  { command: 'IF / WHILE',   cost: 0,  unit: 'free',    category: 'cognitive', color: '#f59e0b', icon: '⬡', note: 'Control-flow never costs energy' },
  { command: 'FUNCTION/CALL',cost: 0,  unit: 'free',    category: 'cognitive', color: '#f59e0b', icon: '⬡' },
  { command: 'SET',          cost: 0,  unit: 'free',    category: 'cognitive', color: '#f59e0b', icon: '⬡', note: 'Executes even during STASIS' },
  { command: 'WAIT',         cost: 0,  unit: 'free',    category: 'cognitive', color: '#f59e0b', icon: '⬡', note: 'Passively regenerates energy while paused' },
  { command: 'STOP',         cost: 0,  unit: 'free',    category: 'cognitive', color: '#f59e0b', icon: '⬡' },
  // Movement
  { command: 'MOVE',         cost: 1,  unit: '/tick',   category: 'movement', color: '#4ade80', icon: '⦾' },
  { command: 'BACKUP',       cost: 1,  unit: '/tick',   category: 'movement', color: '#4ade80', icon: '⦾' },
  { command: 'MOVE_FAST',    cost: 2,  unit: '/tick',   category: 'movement', color: '#4ade80', icon: '⦾', note: '2× speed for 2× the cost' },
  { command: 'PATHFIND',     cost: 2,  unit: '/tick',   category: 'movement', color: '#4ade80', icon: '⦾', note: 'A* navigation, blocked during STASIS' },
  // Sensor
  { command: 'SCAN',         cost: 1,  unit: '/call',   category: 'sensor',   color: '#22d3ee', icon: '◈', note: 'Works during STASIS — scan even when immobilised' },
  // Combat
  { command: 'FIRE',         cost: 8,  unit: '/shot',   category: 'combat',   color: '#f97316', icon: '◉', note: '25 HP damage on hit' },
  { command: 'BURST_FIRE',   cost: 15, unit: '/burst',  category: 'combat',   color: '#ef4444', icon: '◉', note: '3 shots × 8 HP = up to 24 HP total damage' },
];

const CATEGORY_LABELS: Record<EnergyEntry['category'], string> = {
  cognitive: 'COGNITIVE — FREE',
  sensor:    'SENSORS',
  movement:  'MOVEMENT',
  combat:    'COMBAT',
};

const CATEGORIES: EnergyEntry['category'][] = ['cognitive', 'movement', 'sensor', 'combat'];

// ─── Simulator ─────────────────────────────────────────────────────────────────
const SIMULATE_CMDS: { label: string; cmds: string[] }[] = [
  { label: 'SCAN loop',         cmds: ['SCAN', 'MOVE'] },
  { label: 'PATHFIND + FIRE',   cmds: ['PATHFIND', 'FIRE'] },
  { label: 'BURST sniper',      cmds: ['SCAN', 'PATHFIND', 'BURST_FIRE'] },
  { label: 'Pure movement',     cmds: ['MOVE_FAST'] },
];

function getCost(cmd: string): number {
  return ENTRIES.find(e => e.command === cmd)?.cost ?? 0;
}

export function EnergyCostSection({ isMobile }: { isMobile: boolean }) {
  const [simIndex, setSimIndex]   = useState(0);
  const [energy, setEnergy]       = useState(MAX_ENERGY);
  const [running, setRunning]     = useState(false);
  const [tickCount, setTickCount] = useState(0);

  const pct = Math.max(0, Math.min(100, (energy / MAX_ENERGY) * 100));
  const inStasis = energy <= 0;

  const barColor =
    pct > 60 ? '#4ade80' :
    pct > 30 ? '#f59e0b' :
               '#ef4444';

  const handleTick = () => {
    const preset = SIMULATE_CMDS[simIndex];
    const tickCost = preset.cmds.reduce((sum, cmd) => sum + getCost(cmd), 0);
    setEnergy(prev => {
      const next = inStasis ? Math.min(MAX_ENERGY, prev + REGEN_PER_TICK) : Math.max(0, prev - tickCost + REGEN_PER_TICK);
      return next;
    });
    setTickCount(t => t + 1);
  };

  const handleReset = () => {
    setEnergy(MAX_ENERGY);
    setTickCount(0);
    setRunning(false);
  };

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(handleTick, 120);
    return () => clearInterval(id);
  });

  return (
    <section className={isMobile ? 'mb-10' : 'mb-16'}>
      {/* Section header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#818cf8]/30" />
        <h2 className={`${isMobile ? 'text-base' : 'text-xl'} font-black tracking-[0.15em] text-text-primary uppercase text-center`}>
          ⚡ Energy System
          <span className="ml-2 text-[10px] tracking-[0.4em] text-[#818cf8]/80 align-middle">v2.0</span>
        </h2>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#818cf8]/30" />
      </div>

      {/* Regen banner */}
      <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl border border-[#818cf8]/30 bg-[#818cf8]/[0.06]">
        <span className="text-[#818cf8] text-lg">↑</span>
        <div>
          <span className="text-[11px] font-black tracking-[0.2em] text-[#818cf8] uppercase">Passive Regen</span>
          <span className="ml-3 text-[13px] font-black text-text-primary">+{REGEN_PER_TICK} energy / tick</span>
        </div>
        <div className="ml-auto text-[10px] text-text-secondary/60 font-mono">60 ticks ≈ 1 second · max {MAX_ENERGY}</div>
      </div>

      {/* Command cost table */}
      <div className={`flex flex-col ${isMobile ? 'gap-6' : 'gap-8'} mb-10`}>
        {CATEGORIES.map(cat => {
          const entries = ENTRIES.filter(e => e.category === cat);
          const catColor = entries[0]?.color ?? 'var(--accent)';
          return (
            <div key={cat}>
              <div
                className="text-[10px] tracking-[0.5em] font-black uppercase mb-3 pb-2 border-b"
                style={{ color: catColor, borderColor: `${catColor}33` }}
              >
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="flex flex-col gap-1.5">
                {entries.map(e => (
                  <div
                    key={e.command}
                    className={`${isMobile ? 'flex flex-col gap-1 p-3' : 'grid items-center gap-4 px-4 py-2.5'} rounded-xl border bg-card/40 transition-colors hover:bg-[${e.color}]/[0.04]`}
                    style={{
                      gridTemplateColumns: isMobile ? undefined : '160px 100px 1fr',
                      borderColor: `${e.color}22`,
                    }}
                  >
                    {/* Command name */}
                    <div className="flex items-center gap-2">
                      <span style={{ color: e.color }} className="text-xs">{e.icon}</span>
                      <code className="text-xs font-black tracking-wider" style={{ color: e.color }}>
                        {e.command}
                      </code>
                    </div>

                    {/* Cost badge */}
                    <div className="flex items-center gap-1.5">
                      {e.cost === 0 ? (
                        <span className="text-[10px] font-black tracking-widest text-text-secondary/50 uppercase border border-text-secondary/20 rounded px-2 py-0.5">
                          FREE
                        </span>
                      ) : (
                        <>
                          {/* Mini energy bar */}
                          <div className="w-16 h-1.5 rounded-full bg-card/60 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (e.cost / 15) * 100)}%`,
                                background: e.color,
                                opacity: 0.85,
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-black tabular-nums" style={{ color: e.color }}>
                            −{e.cost}
                          </span>
                          <span className="text-[10px] text-text-secondary/50 font-mono">{e.unit}</span>
                        </>
                      )}
                    </div>

                    {/* Note */}
                    {e.note && (
                      <span className={`${isMobile ? 'text-[10px]' : 'text-[11px]'} text-text-secondary/70 leading-relaxed`}>
                        {e.note}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Interactive Drain Simulator ───────────────────────────────────── */}
      <div className="rounded-2xl border border-[#818cf8]/25 bg-card/30 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[#818cf8]">⚡</span>
          <span className="text-xs font-black tracking-[0.2em] uppercase text-[#818cf8]">Drain Simulator</span>
          <span className="ml-auto text-[10px] text-text-secondary/50 font-mono">tick #{tickCount}</span>
        </div>

        {/* Energy bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] font-mono mb-1.5">
            <span style={{ color: inStasis ? '#ef4444' : barColor }} className="font-black tracking-widest uppercase">
              {inStasis ? '⚠ STASIS' : 'ENERGY'}
            </span>
            <span className="text-text-secondary/60">{Math.round(energy)} / {MAX_ENERGY}</span>
          </div>
          <div className="h-3 rounded-full bg-card/60 border border-text-secondary/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}99, ${barColor})` }}
            />
          </div>
        </div>

        {/* Preset selector */}
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2 mb-4`}>
          {SIMULATE_CMDS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => { setSimIndex(i); handleReset(); }}
              className="px-3 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all border"
              style={{
                borderColor: i === simIndex ? '#818cf8' : 'rgba(255,255,255,0.1)',
                background:  i === simIndex ? 'rgba(129,140,248,0.15)' : 'transparent',
                color:        i === simIndex ? '#818cf8' : 'var(--text-secondary)',
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
            const entry = ENTRIES.find(e => e.command === cmd);
            return (
              <span key={cmd} className="flex items-center gap-1">
                <code style={{ color: entry?.color ?? 'var(--accent)' }} className="font-black">{cmd}</code>
                <span className="text-text-secondary/50">−{cost}</span>
              </span>
            );
          })}
          <span className="text-text-secondary/40">+</span>
          <span><code className="text-[#818cf8] font-black">REGEN</code> <span className="text-text-secondary/50">+{REGEN_PER_TICK}</span></span>
          <span className="ml-auto font-black" style={{
            color: (() => {
              const net = REGEN_PER_TICK - SIMULATE_CMDS[simIndex].cmds.reduce((s, c) => s + getCost(c), 0);
              return net >= 0 ? '#4ade80' : '#f97316';
            })()
          }}>
            NET {(() => {
              const net = REGEN_PER_TICK - SIMULATE_CMDS[simIndex].cmds.reduce((s, c) => s + getCost(c), 0);
              return (net >= 0 ? '+' : '') + net;
            })()} / tick
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setRunning(r => !r)}
            className="flex-1 py-2.5 rounded-xl font-black text-[11px] tracking-[0.2em] uppercase transition-all border"
            style={{
              borderColor: running ? '#ef4444' : '#818cf8',
              background:  running ? 'rgba(239,68,68,0.12)' : 'rgba(129,140,248,0.12)',
              color:        running ? '#ef4444' : '#818cf8',
            }}
          >
            {running ? '⏸ PAUSE' : '▶ SIMULATE'}
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl font-black text-[11px] tracking-[0.2em] uppercase transition-all border border-text-secondary/20 text-text-secondary/60 hover:border-text-secondary/40"
          >
            RESET
          </button>
        </div>
      </div>
    </section>
  );
}
