"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const GAME_MODE_OPTIONS = ["COMBAT", "RACING", "TRAINING_SOLO"] as const;

export const CustomSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Select */}
            <div className="md:hidden relative w-full z-40">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-bg-secondary border border-accent/50 rounded-xl px-4 py-3 flex items-center justify-between text-accent font-bold tracking-widest text-[10px] active:bg-accent/5 transition-colors"
                >
                    <span className="truncate">MOD: {value}</span>
                    <ChevronDown size={14} className={`text-accent/50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}></div>
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="bg-card border border-accent/30 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
                                <div className="flex flex-col">
                                    {GAME_MODE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => { onChange(opt); setIsOpen(false); }}
                                            className={`w-full px-5 py-4 text-left text-[10px] font-bold tracking-widest transition-colors active:bg-accent/10 border-b border-accent/50/50 last:border-0 ${value === opt ? 'bg-accent/10 text-accent' : 'text-text-secondary'}`}
                                        >
                                            {opt.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Desktop Select */}
            <div className="hidden md:block relative font-mono text-xs tracking-widest z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between gap-4 bg-bg-secondary/80 backdrop-blur-xl border border-accent rounded px-3 py-1.5 text-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)] hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.8)] hover:bg-accent/20 transition-all uppercase w-40"
                >
                    <span className="truncate">{value}</span>
                    <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''} text-[9px]`}>▼</span>
                </button>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                        <div className="absolute top-full right-0 mt-2 w-40 z-50 bg-bg-secondary/90 backdrop-blur-xl border border-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1">
                            {GAME_MODE_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => { onChange(opt); setIsOpen(false); }}
                                    className={`px-3 py-2 text-left uppercase transition-all duration-75 hover:bg-accent/30 hover:text-text-primary hover:tracking-[0.1em] ${value === opt ? 'bg-accent/10 text-accent' : 'text-accent/70'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};
