'use client';

import React from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import type { RotationExample } from '../../constants/docsData';

const splitTitle = (title: string) => {
    const parts = title.split(/--|---| - |â€”/);
    return {
        name: parts[0]?.trim() ?? title,
        detail: parts.slice(1).join(' - ').trim() || 'Example',
    };
};

interface ExampleCardProps {
    example: RotationExample;
    onLoadScript: (code: string) => void;
    isExpanded: boolean;
    onToggle: () => void;
    isMobile: boolean;
    index: number;
}

export const ExampleCard = ({
    example,
    onLoadScript,
    isExpanded,
    onToggle,
    isMobile,
    index,
}: ExampleCardProps) => {
    const color = 'var(--docs-orange)';
    const codeColor = 'var(--docs-yellow)';
    const title = splitTitle(example.title);

    return (
        <div
            className={`border bg-card/60 backdrop-blur-sm transition-all duration-300 rounded-xl overflow-hidden ${isExpanded ? 'ring-1 ring-accent/20' : ''}`}
            style={{
                borderColor: isExpanded ? `color-mix(in srgb, ${color} 40%, transparent)` : `color-mix(in srgb, ${color} 14%, transparent)`,
                boxShadow: isExpanded ? `0 0 20px color-mix(in srgb, ${color} 13%, transparent)` : 'none',
            }}
        >
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center justify-between ${isMobile ? 'px-4 py-4' : 'px-5 py-4'} text-left transition-colors hover:bg-text-primary/[0.02]`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <Lightbulb className="w-4 h-4 shrink-0" style={{ color }} />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span
                                className="text-[10px] font-bold tracking-widest uppercase"
                                style={{ color: `color-mix(in srgb, ${color} 62%, transparent)` }}
                            >
                                EX_{String(index + 1).padStart(2, '0')}
                            </span>
                            <h3
                                className={`${isMobile ? 'text-[11px]' : 'text-sm'} font-black tracking-[0.1em] uppercase truncate`}
                                style={{ color }}
                            >
                                {title.name}
                            </h3>
                        </div>
                        <p className="text-[9px] text-text-primary/40 tracking-wider font-bold uppercase mt-1">
                            {title.detail}
                        </p>
                    </div>
                </div>
                <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 opacity-40 ${isExpanded ? 'rotate-180' : ''}`}
                    style={{ color }}
                />
            </button>

            {isExpanded && (
                <div
                    className={`${isMobile ? 'px-4' : 'px-5'} pb-5 border-t animate-in fade-in slide-in-from-top-1 duration-200`}
                    style={{ borderColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
                >
                    <p className="text-[11px] text-text-primary/60 mt-4 mb-4 leading-relaxed tracking-wide font-medium">
                        {example.description}
                    </p>

                    <div
                        className="mb-4 p-3 rounded-lg border"
                        style={{
                            background: `color-mix(in srgb, ${color} 5%, transparent)`,
                            borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                        }}
                    >
                        <span className="text-[9px] font-black tracking-widest uppercase block mb-1" style={{ color }}>
                            Result:
                        </span>
                        <span className="text-[11px] leading-relaxed font-medium" style={{ color: `color-mix(in srgb, ${color} 82%, var(--text-primary))` }}>
                            {example.result}
                        </span>
                    </div>

                    <div className="relative">
                        <div
                            className="absolute inset-0 opacity-5 rounded-lg pointer-events-none"
                            style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
                        />
                        <pre
                            className={`text-[10px] leading-relaxed p-4 rounded-lg overflow-x-auto font-mono bg-card/60 backdrop-blur-md docs-scrollbar border ${isMobile ? 'max-h-[200px]' : ''}`}
                            style={{
                                color: codeColor,
                                borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                            }}
                        >
                            {example.code}
                        </pre>
                    </div>

                    <button
                        type="button"
                        onClick={() => onLoadScript(example.code)}
                        className="mt-4 w-full py-3 text-[10px] font-black tracking-[0.3em] uppercase transition-all border rounded-lg active:scale-[0.98] hover:opacity-90 cursor-pointer"
                        style={{
                            color,
                            borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                            background: `color-mix(in srgb, ${color} 5%, transparent)`,
                        }}
                    >
                        LOAD_TO_CORE
                    </button>
                </div>
            )}
        </div>
    );
};
