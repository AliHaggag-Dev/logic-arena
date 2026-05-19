'use client';

import React from 'react';
import { Activity, Battery, Pause, Play, RotateCcw, Zap } from 'lucide-react';
import { getCost, MAX_ENERGY, REGEN_PER_TICK } from '../EnergyCostTable';
import { SIMULATE_CMDS } from './constants';

interface MobileViewProps {
    energy: number;
    tickCount: number;
    simIndex: number;
    running: boolean;
    pct: number;
    inStasis: boolean;
    barColor: string;
    netPerTick: number;
    statusLabel: string;
    statusColor: string;
    activePreset: { label: string; cmds: string[] };
    onToggleRunning: () => void;
    onReset: () => void;
    onChangePreset: (index: number) => void;
}

export function MobileView({
    energy,
    tickCount,
    simIndex,
    running,
    pct,
    inStasis,
    barColor,
    netPerTick,
    statusLabel,
    statusColor,
    activePreset,
    onToggleRunning,
    onReset,
    onChangePreset,
}: MobileViewProps) {
    return (
        <div className="relative overflow-hidden rounded-[28px] border border-text-primary/10 bg-card/80 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <div
                className="absolute inset-x-10 -top-20 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ background: barColor }}
            />

            <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border"
                        style={{
                            color: 'var(--docs-indigo)',
                            borderColor: 'color-mix(in srgb, var(--docs-indigo) 22%, transparent)',
                            background: 'color-mix(in srgb, var(--docs-indigo) 8%, transparent)',
                        }}
                    >
                        <Zap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--docs-indigo)' }}>
                            Drain Simulator
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-text-secondary/55">
                            <Activity className="h-3 w-3" />
                            <span>tick #{tickCount}</span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="font-mono text-[20px] leading-none text-text-primary/80">
                        {Math.round(energy)}
                        <span className="text-[11px] text-text-secondary/45">/{MAX_ENERGY}</span>
                    </div>
                    <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em]" style={{ color: statusColor }}>
                        {statusLabel}
                    </div>
                </div>
            </div>

            <div className="relative mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-text-primary/10">
                    <div
                        className="h-full rounded-full transition-all duration-100"
                        style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, color-mix(in srgb, ${barColor} 62%, transparent), ${barColor})`,
                        }}
                    />
                </div>
            </div>

            <div className="mt-4 overflow-x-auto docs-scrollbar">
                <div className="flex min-w-max gap-2 pb-1">
                    {SIMULATE_CMDS.map((p, i) => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() => onChangePreset(i)}
                            className="h-10 rounded-full border px-4 text-[11px] font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                            style={{
                                borderColor: i === simIndex ? 'var(--docs-indigo)' : 'color-mix(in srgb, var(--text-primary) 10%, transparent)',
                                background: i === simIndex ? 'color-mix(in srgb, var(--docs-indigo) 12%, transparent)' : 'color-mix(in srgb, var(--text-primary) 3%, transparent)',
                                color: i === simIndex ? 'var(--docs-indigo)' : 'var(--text-secondary)',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="min-w-0 rounded-2xl border border-text-primary/10 bg-text-primary/[0.03] px-3 py-2">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-text-secondary/45">
                        <Battery className="h-3 w-3" />
                        Per tick
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono">
                        {activePreset.cmds.map(cmd => (
                            <span key={cmd} className="text-text-secondary/65">
                                <code className="font-black text-accent">{cmd}</code>
                                <span className="text-text-secondary/45"> -{getCost(cmd)}</span>
                            </span>
                        ))}
                        {inStasis && (
                            <span className="text-text-secondary/65">
                                <code className="font-black" style={{ color: 'var(--docs-indigo)' }}>REGEN</code>
                                <span className="text-text-secondary/45"> +{REGEN_PER_TICK}</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-text-secondary/40">Net</div>
                    <div className="font-mono text-[14px] font-black tracking-wider" style={{ color: netPerTick >= 0 ? 'var(--docs-green)' : 'var(--docs-orange)' }}>
                        {netPerTick >= 0 ? '+' : ''}{netPerTick}
                    </div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_48px] gap-2">
                <button
                    type="button"
                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border text-[12px] font-black uppercase tracking-[0.18em] transition-all active:scale-[0.98] cursor-pointer"
                    style={{
                        borderColor: running ? 'var(--docs-red)' : 'var(--docs-indigo)',
                        background: running ? 'color-mix(in srgb, var(--docs-red) 10%, transparent)' : 'color-mix(in srgb, var(--docs-indigo) 12%, transparent)',
                        color: running ? 'var(--docs-red)' : 'var(--docs-indigo)',
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
                    className="grid h-12 place-items-center rounded-2xl border border-text-secondary/15 text-text-secondary/60 transition-all active:scale-95 hover:border-text-secondary/35 cursor-pointer"
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
            </div>

            {!inStasis && (
                <p className="mt-3 text-[9px] leading-relaxed text-text-secondary/45 font-mono">
                    Active robots do not regenerate. Drain to STASIS to recover.
                </p>
            )}
        </div>
    );
}
