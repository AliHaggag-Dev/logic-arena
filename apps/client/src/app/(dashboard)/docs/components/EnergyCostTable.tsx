'use client';

import React, { useMemo } from 'react';
import { Hexagon, Circle, Diamond, Target, ArrowUp } from 'lucide-react';

// ─── Named constants (kept in sync with packages/engine/src/energy-manager.ts) ─
export const MAX_ENERGY = 100;
export const REGEN_PER_TICK = 3;
export const STASIS_ENTRY_THRESHOLD = 0;
export const STASIS_EXIT_THRESHOLD = 20;
/** Largest energy cost — used to scale the mini bar (BURST_FIRE = 18). */
const MAX_BAR_COST = 18;


interface EnergyEntry {
  command: string;
  cost: number;
  unit: string;
  category: 'movement' | 'combat' | 'sensor' | 'cognitive';
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  note?: string;
}

const ENTRIES: EnergyEntry[] = [
  // Cognitive — free
  { command: 'IF / FOR / WHILE', cost: 0, unit: 'free', category: 'cognitive', color: 'var(--docs-orange)', icon: Hexagon, note: 'Control-flow never costs energy' },
  { command: 'FUNCTION/CALL', cost: 0, unit: 'free', category: 'cognitive', color: 'var(--docs-orange)', icon: Hexagon },
  { command: 'SET',           cost: 0, unit: 'free', category: 'cognitive', color: 'var(--docs-orange)', icon: Hexagon, note: 'Executes even during STASIS — ideal for state machine flags' },
  { command: 'WAIT',          cost: 0, unit: 'free', category: 'cognitive', color: 'var(--docs-orange)', icon: Hexagon, note: 'Costs 0 energy. Energy does NOT regenerate during WAIT — regen only occurs in STASIS.' },
  { command: 'STOP',          cost: 0, unit: 'free', category: 'cognitive', color: 'var(--docs-orange)', icon: Hexagon, note: 'Allowed during STASIS' },
  // Movement
  { command: 'MOVE',      cost: 2, unit: '/tick', category: 'movement', color: 'var(--docs-green)', icon: Circle },
  { command: 'BACKUP',    cost: 2, unit: '/tick', category: 'movement', color: 'var(--docs-green)', icon: Circle },
  { command: 'MOVE_FAST', cost: 4, unit: '/tick', category: 'movement', color: 'var(--docs-green)', icon: Circle, note: '2× speed for 2× the cost. Blocked during STASIS.' },
  { command: 'PATHFIND',  cost: 3, unit: '/tick', category: 'movement', color: 'var(--docs-green)', icon: Circle, note: 'A* navigation toward nearest visible target. Blocked during STASIS.' },
  // Sensor
  { command: 'SCAN', cost: 3, unit: '/call', category: 'sensor', color: 'var(--docs-cyan)', icon: Diamond, note: 'BLOCKED during STASIS — use WAIT to pause the script and let STASIS regen energy.' },
  // Combat
  { command: 'FIRE',       cost: 8,  unit: '/shot',  category: 'combat', color: 'var(--docs-orange)', icon: Target, note: '25 HP damage on hit. Only fires if an enemy is within FOV.' },
  { command: 'BURST_FIRE', cost: 18, unit: '/burst', category: 'combat', color: 'var(--docs-red)', icon: Target, note: '3 shots × 8 HP = up to 24 HP total. Requires enemy in FOV.' },
];

const CATEGORY_LABELS: Record<EnergyEntry['category'], string> = {
  cognitive: 'COGNITIVE — FREE',
  sensor:    'SENSORS',
  movement:  'MOVEMENT',
  combat:    'COMBAT',
};

const ORDERED_CATEGORIES: EnergyEntry['category'][] = ['cognitive', 'movement', 'sensor', 'combat'];

export function EnergyCostTable({ isMobile }: { isMobile: boolean }) {
  const grouped = useMemo(
    () =>
      ORDERED_CATEGORIES.map(cat => ({
        cat,
        entries: ENTRIES.filter(e => e.category === cat),
        color: ENTRIES.find(e => e.category === cat)?.color ?? 'var(--accent)',
      })),
    [],
  );

  return (
    <>
      {/* Regen banner */}
      <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl border border-indigo-400/30 bg-indigo-400/[0.06]">
        <ArrowUp size={18} className="text-indigo-400" />
        <div>
          <span className="text-[11px] font-black tracking-[0.2em] text-indigo-400 uppercase">Passive Regen</span>
          <span className="ml-3 text-[13px] font-black text-text-primary">+{REGEN_PER_TICK} energy / tick</span>
        </div>
        <div className="ml-auto text-[10px] text-text-secondary/60 font-mono text-right">
          <span className="font-black text-rose-400">STASIS only</span> · max {MAX_ENERGY}
        </div>
      </div>

      {/* Command cost table */}
      <div className={`flex flex-col ${isMobile ? 'gap-6' : 'gap-8'} mb-10`}>
        {grouped.map(({ cat, entries, color }) => (
          <div key={cat}>
            <div
              className="text-[10px] tracking-[0.5em] font-black uppercase mb-3 pb-2 border-b"
              style={{ color, borderColor: `color-mix(in srgb, ${color} 20%, transparent)` }}
            >
              {CATEGORY_LABELS[cat]}
            </div>
            <div className="flex flex-col gap-1.5">
              {entries.map(e => {
                const Icon = e.icon;
                return (
                  <div
                    key={e.command}
                    className={`${isMobile ? 'flex flex-col gap-1 p-3' : 'grid items-center gap-4 px-4 py-2.5'} rounded-xl border bg-card/40 transition-colors`}
                    style={{
                      gridTemplateColumns: isMobile ? undefined : '160px 100px 1fr',
                      borderColor: `color-mix(in srgb, ${e.color} 13%, transparent)`,
                    }}
                  >
                    {/* Command name */}
                    <div className="flex items-center gap-2">
                      <span style={{ color: e.color }} className="flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" />
                      </span>
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
                          <div className="w-16 h-1.5 rounded-full bg-card/60 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (e.cost / MAX_BAR_COST) * 100)}%`,
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
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Expose ENTRIES and getCost so EnergyDrainSimulator can share the same data. */
export { ENTRIES };
export function getCost(cmd: string): number {
  return ENTRIES.find(e => e.command === cmd)?.cost ?? 0;
}
