"use client";

import React, { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";

interface ProtocolFormProps {
    newScriptTitle: string;
    setNewScriptTitle: (val: string) => void;
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    isGuest?: boolean;
}

export const ProtocolForm = ({ newScriptTitle, setNewScriptTitle, isLoading, onSubmit, isGuest }: ProtocolFormProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="z-30">
            {/* Mobile Layout */}
            <div className={`md:hidden bg-card/45 backdrop-blur-xl border border-accent/25 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out shadow-lg ${isExpanded ? "max-h-[300px]" : "max-h-[60px]"}`}>
                {!isExpanded ? (
                    <button
                        type="button"
                        aria-label="Expand create script form"
                        onClick={() => setIsExpanded(true)}
                        className="w-full h-[60px] flex items-center justify-between px-5 text-accent font-black tracking-[0.18em] text-xs group"
                    >
                        <span className="flex items-center gap-3">
                            <Plus size={16} className="text-accent" />
                            CREATE NEW SCRIPT
                        </span>
                        <ChevronDown size={16} className="text-text-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                ) : (
                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-accent font-black tracking-[0.18em] uppercase">Script Creation</span>
                            <button 
                                type="button" 
                                aria-label="Collapse create script form" 
                                onClick={() => setIsExpanded(false)} 
                                className="p-1 cursor-pointer"
                            >
                                <ChevronDown size={16} className="text-text-secondary rotate-180 transition-transform duration-300" />
                            </button>
                        </div>
                        <form onSubmit={(e) => { onSubmit(e); setIsExpanded(false); }} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label htmlFor="mobile-script-name-input" className="sr-only">
                                    Script Name
                                </label>
                                <input
                                    id="mobile-script-name-input"
                                    type="text"
                                    value={newScriptTitle}
                                    onChange={(e) => setNewScriptTitle(e.target.value)}
                                    placeholder="Enter script name..."
                                    className="w-full bg-bg-primary/30 border border-accent/25 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 focus:bg-accent/5 transition-colors font-mono"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || isGuest || !newScriptTitle.trim()}
                                className="w-full py-3 bg-accent/10 border border-accent/25 rounded-xl text-accent text-xs font-black tracking-[0.18em] uppercase active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isGuest ? "LOGIN REQUIRED" : isLoading ? "CREATING..." : "GENERATE SCRIPT"}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block bg-bg-primary/25 border border-accent/15 rounded-[18px] p-3.5 shadow-inner relative overflow-hidden">
                <form onSubmit={onSubmit} className="flex gap-3 items-end">
                    <div className="flex-1 flex flex-col gap-1.5">
                        <label htmlFor="desktop-script-name-input" className="text-[9px] text-text-secondary uppercase tracking-[0.18em] font-black ml-1">
                            NEW SCRIPT NAME
                        </label>
                        <input
                            id="desktop-script-name-input"
                            type="text"
                            placeholder="Enter script name..."
                            className="w-full bg-bg-primary/30 border border-accent/15 rounded-xl p-2.5 px-3 text-text-primary text-xs outline-none focus:border-accent/40 focus:bg-accent/5 focus:shadow-[0_0_12px_rgba(var(--accent-rgb),0.1)] transition-all placeholder:text-text-secondary/40 font-mono tracking-wide"
                            value={newScriptTitle}
                            onChange={(e) => setNewScriptTitle(e.target.value)}
                            required
                            disabled={isLoading || isGuest}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || isGuest || !newScriptTitle.trim()}
                        className="h-[38px] px-5 bg-accent/10 border border-accent/30 text-accent font-black text-xs hover:bg-accent/20 hover:border-accent/50 hover:text-text-primary transition-all duration-300 rounded-xl uppercase tracking-[0.18em] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {isGuest ? "LOCKED" : isLoading ? "CREATING..." : "CREATE"}
                    </button>
                </form>
            </div>
        </div>
    );
};
