'use client';

import React, { useState } from 'react';
import { ROTATION_SYSTEM_GUIDE } from '../../constants/docsData';
import { SectionLabel } from '../SectionLabel';
import { ExampleCard } from './ExampleCard';

interface RotationSystemSectionProps {
    onLoadScript: (code: string) => void;
    isMobile: boolean;
}

export const RotationSystemSection = ({ onLoadScript, isMobile }: RotationSystemSectionProps) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
    const color = 'var(--docs-orange)';

    return (
        <section className={isMobile ? 'mb-10' : 'mb-16'}>
            <SectionLabel text="ROTATION SYSTEM v2.3" isMobile={isMobile} />

            <div className={`flex flex-col ${isMobile ? 'gap-6' : 'gap-10'} mt-5`}>
                <div>
                    <SectionLabel text="THE_3_CONTROLS" isMobile={isMobile} />
                    <div className="grid gap-3 mt-4">
                        {ROTATION_SYSTEM_GUIDE.controls.map((ctrl) => (
                            <div
                                key={ctrl.name}
                                className={`${isMobile ? 'flex flex-col p-4' : 'grid grid-cols-[140px_1fr_1fr] items-center p-4'} gap-4 rounded-xl border bg-card/40 transition-colors hover:bg-text-primary/[0.02]`}
                                style={{ borderColor: `color-mix(in srgb, ${color} 20%, transparent)` }}
                            >
                                <div className="flex flex-col gap-1">
                                    <code className="text-xs font-black tracking-wider" style={{ color: 'var(--docs-yellow)' }}>
                                        {ctrl.name}
                                    </code>
                                    {ctrl.alias && (
                                        <span className="text-[9px] text-text-secondary/50 font-mono tracking-tighter">
                                            alias: {ctrl.alias.join(', ')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: `color-mix(in srgb, ${color} 74%, var(--text-primary))` }}>
                                        {ctrl.controls}
                                    </span>
                                    <div className="flex gap-2 text-[9px] font-mono">
                                        <span className={ctrl.affectsMovement ? 'text-green-400' : 'text-text-secondary/30'}>
                                            [MOVE {ctrl.affectsMovement ? 'YES' : 'NO'}]
                                        </span>
                                        <span className={ctrl.affectsVision ? 'text-cyan-400' : 'text-text-secondary/30'}>
                                            [VISION {ctrl.affectsVision ? 'YES' : 'NO'}]
                                        </span>
                                    </div>
                                </div>
                                <span className={`${isMobile ? 'text-[10px]' : 'text-[11px]'} text-text-secondary leading-relaxed opacity-80`}>
                                    {ctrl.description}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <SectionLabel text="COMMON_ANGLES" isMobile={isMobile} />
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                        {ROTATION_SYSTEM_GUIDE.angleReference.map((angle) => (
                            <div
                                key={angle.value}
                                className="flex flex-col items-center justify-center p-3 rounded-lg border bg-card/30"
                                style={{ borderColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
                            >
                                <span className="text-2xl mb-1" style={{ color }}>
                                    {angle.direction}
                                </span>
                                <code className="text-[11px] font-black" style={{ color: 'var(--docs-yellow)' }}>
                                    {angle.value}
                                </code>
                                <span className="text-[9px] font-bold tracking-wider text-text-secondary/60 mt-1 uppercase text-center">
                                    {angle.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <SectionLabel text="CONFLICT_RESOLUTION" isMobile={isMobile} />
                    <div
                        className="mt-4 rounded-xl border bg-card/40 overflow-hidden"
                        style={{ borderColor: `color-mix(in srgb, ${color} 20%, transparent)` }}
                    >
                        <div className="grid grid-cols-1 divide-y divide-text-primary/5">
                            {ROTATION_SYSTEM_GUIDE.conflictRules.map((rule, idx) => (
                                <div key={idx} className={`${isMobile ? 'flex flex-col p-3 gap-2' : 'grid grid-cols-[260px_1fr] p-3 gap-6 items-center'} hover:bg-text-primary/[0.02]`}>
                                    <div className="text-[10px] font-mono" style={{ color: `color-mix(in srgb, ${color} 84%, var(--text-primary))` }}>
                                        {rule.scenario}
                                    </div>
                                    <div className="text-[11px] text-text-secondary/80 leading-relaxed">{rule.outcome}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <SectionLabel text="EXAMPLE_SCRIPTS" isMobile={isMobile} />
                    <div className="flex flex-col gap-3 mt-4">
                        {ROTATION_SYSTEM_GUIDE.examples.map((example, i) => (
                            <ExampleCard
                                key={example.title}
                                example={example}
                                index={i}
                                onLoadScript={onLoadScript}
                                isExpanded={expandedIndex === i}
                                onToggle={() => setExpandedIndex(prev => (prev === i ? null : i))}
                                isMobile={isMobile}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
