'use client';

import React from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import { getCost, MAX_ENERGY, REGEN_PER_TICK, STASIS_EXIT_THRESHOLD } from '../EnergyCostTable';
import { SIMULATE_CMDS } from './constants';

interface DesktopViewProps {
    energy: number;
    tickCount: number;
    simIndex: number;
    running: boolean;
    pct: number;
    inStasis: boolean;
    exitingStasis: boolean;
    barColor: string;
    netPerTick: number;
    statusLabel: string;
    activePreset: { label: string; cmds: string[] };
    onToggleRunning: () => void;
    onReset: () => void;
    onChangePreset: (index: number) => void;
}

export function DesktopView({
    energy,
    tickCount,
    simIndex,
    running,
    pct,
    inStasis,
    exitingStasis,
    barColor,
    netPerTick,
    statusLabel,
    activePreset,
    onToggleRunning,
    onReset,
    onChangePreset,
}: DesktopViewProps) {
    return (
        <div className="rounded-xl border border-text-primary/10 bg-card/35 p-4 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-3">
                <div
                    className="grid h-8 w-8 place-items-center rounded-lg border"
                    style={{
                        color: 'var(--docs-indigo)',
                        borderColor: 'color-mix(in srgb, var(--docs-indigo) 25%, transparent)',
                        background: 'color-mix(in srgb, var(--docs-indigo) 7%, transparent)',
                    }}
                >
                    <Zap className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-black tracking-[0.2em] uppercase" style={{ color: 'var(--docs-indigo)' }}>
                    Drain Simulator
                </span>
                <span className="ml-auto text-[10px] text-text-secondary/45 font-mono">tick #{tickCount}</span>
            </div>

            <div className="mb-3">
                <div className="flex items-end justify-between mb-2">
                    <span style={{ color: barColor }} className="text-sm font-black tracking-widest uppercase">
                        {statusLabel}
                    </span>
                    <span className="font-mono text-sm text-text-secondary/65">{Math.round(energy)} / {MAX_ENERGY}</span>
                </div>
                <div className="h-2.5 rounded-full bg-text-primary/10 overflow-hidden">
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

            <div className="grid grid-cols-4 gap-2 mb-3">
                {SIMULATE_CMDS.map((p, i) => (
                    <button
                        key={p.label}
                        type="button"
                        onClick={() => onChangePreset(i)}
                        className="min-h-12 rounded-lg border px-3 py-2 text-[12px] font-medium transition-all hover:opacity-80 cursor-pointer"
                        style={{
                            borderColor: i === simIndex ? 'var(--docs-indigo)' : 'color-mix(in srgb, var(--text-primary) 10%, transparent)',
                            background:  i === simIndex ? 'color-mix(in srgb, var(--docs-indigo) 8%, transparent)' : 'transparent',
                            color:       i === simIndex ? 'var(--docs-indigo)' : 'var(--text-secondary)',
                        }}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3 mb-3 text-[11px] font-mono flex-wrap">
                <span className="text-text-secondary/60">Per tick:</span>
                {activePreset.cmds.map(cmd => {
                    const cost = getCost(cmd);
                    return (
                        <span key={cmd} className="flex items-center gap-1">
                            <code className="font-black text-accent">{cmd}</code>
                            <span className="text-text-secondary/50">-{cost}</span>
                        </span>
                    );
                })}
                {inStasis && (
                    <>
                        <span className="text-text-secondary/40">-&gt;</span>
                        <span>
                            <code className="font-black" style={{ color: 'var(--docs-indigo)' }}>REGEN</code>
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

            {!inStasis && (
                <p className="text-[9px] text-text-secondary/40 mb-3 font-mono tracking-wider">
                    Active robots do not regenerate. Run out of energy to enter STASIS and regen.
                </p>
            )}

            <div className="flex gap-2">
                <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-black tracking-widest hover:opacity-75 uppercase transition-all cursor-pointer"
                    style={{
                        borderColor: running ? 'var(--docs-red)' : 'var(--docs-indigo)',
                        background:  running ? 'color-mix(in srgb, var(--docs-red) 5%, transparent)' : 'color-mix(in srgb, var(--docs-indigo) 5%, transparent)',
                        color:       running ? 'var(--docs-red)' : 'var(--docs-indigo)',
                    }}
                    onClick={onToggleRunning}
                >
                    {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {running ? 'Pause' : 'Simulate'}
                </button>
                <button
                    type="button"
                    onClick={onReset}
                    aria-label="Reset simulator"
                    title="Reset simulator"
                    className="grid w-11 place-items-center rounded-lg transition-all border border-text-secondary/20 text-text-secondary/60 hover:border-text-secondary/40 cursor-pointer"
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
