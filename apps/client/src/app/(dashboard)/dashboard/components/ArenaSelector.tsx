import React from 'react';
import { GameMode } from '../hooks/useScripts';
import { Swords, Shield, Flag, Crown, Car, Target } from 'lucide-react';

interface ArenaSelectorProps {
    selectedMode: GameMode;
    setSelectedMode: (mode: GameMode) => void;
    selectedTheme: string;
    setSelectedTheme: (theme: string) => void;
}

const MODES: { value: GameMode; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'COMBAT', label: 'DEATHMATCH', icon: <Swords size={24} />, description: 'Classic 1v1 destruction' },
    { value: 'SURVIVAL', label: 'SURVIVAL', icon: <Shield size={24} />, description: 'Outlast endless waves' },
    { value: 'CAPTURE_THE_FLAG', label: 'CTF', icon: <Flag size={24} />, description: 'Infiltrate & Extract' },
    { value: 'KING_OF_THE_HILL', label: 'KOTH', icon: <Crown size={24} />, description: 'Control the center zone' },
    { value: 'RACING', label: 'RACING', icon: <Car size={24} />, description: 'High-speed circuits' },
    { value: 'TRAINING_SOLO', label: 'TRAINING', icon: <Target size={24} />, description: 'Test your logic' },
];

const THEMES: { value: string; label: string; colorClass: string; borderClass: string; bgClass: string; glowClass: string }[] = [
    { 
        value: 'CYBER', 
        label: 'NEO-CYBER', 
        colorClass: 'text-[var(--accent)]', 
        borderClass: 'border-[var(--accent)]',
        bgClass: 'bg-[var(--accent)]/10',
        glowClass: 'shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]'
    },
    { 
        value: 'LAVA', 
        label: 'MAGMA CORE', 
        colorClass: 'text-[#f97316]', 
        borderClass: 'border-[#f97316]',
        bgClass: 'bg-[#f97316]/10',
        glowClass: 'shadow-[0_0_20px_rgba(249,115,22,0.4)]'
    },
    { 
        value: 'ICE', 
        label: 'GLACIAL TUNDRA', 
        colorClass: 'text-[#22d3ee]', 
        borderClass: 'border-[#22d3ee]',
        bgClass: 'bg-[#22d3ee]/10',
        glowClass: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]'
    },
];

export const ArenaSelector: React.FC<ArenaSelectorProps> = ({
    selectedMode,
    setSelectedMode,
    selectedTheme,
    setSelectedTheme
}) => {
    return (
        <section className="flex flex-col gap-6 p-6 md:p-8 rounded-2xl border border-[var(--accent)]/30 bg-bg-secondary/40 backdrop-blur-md relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)] opacity-[0.03] rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
            
            <header>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] text-text-primary mb-2 flex items-center gap-3">
                    <span className="w-2 h-6 bg-[var(--accent)] rounded-sm" />
                    CAMPAIGN NEXUS
                </h3>
                <p className="text-[10px] md:text-xs text-text-secondary tracking-[0.1em] uppercase ml-5">
                    Select your engagement protocol and environmental parameters
                </p>
            </header>

            <div className="flex flex-col gap-8 md:gap-10">
                {/* Mode Selector */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold text-text-secondary tracking-widest uppercase ml-1">
                        1. Select Protocol
                    </h4>
                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 -mx-1 snap-x scrollbar-hide">
                        {MODES.map(mode => (
                            <button
                                key={mode.value}
                                type="button"
                                aria-label={`Select Mode: ${mode.label}`}
                                onClick={() => setSelectedMode(mode.value)}
                                className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-300 min-w-[200px] snap-center shrink-0 group hover:scale-[1.02] ${
                                    selectedMode === mode.value 
                                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]' 
                                    : 'border-transparent bg-bg-primary hover:bg-[var(--accent)]/5 hover:border-[var(--accent)]/40'
                                }`}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <span className="text-2xl drop-shadow-md">{mode.icon}</span>
                                    <span className={`font-black tracking-[0.15em] text-sm md:text-base ${
                                        selectedMode === mode.value ? 'text-[var(--accent)] drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]' : 'text-text-primary'
                                    }`}>
                                        {mode.label}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-medium tracking-wide mt-1 ${
                                    selectedMode === mode.value ? 'text-text-primary' : 'text-text-secondary'
                                }`}>
                                    {mode.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Theme Selector */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold text-text-secondary tracking-widest uppercase ml-1">
                        2. Select Environment
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {THEMES.map(theme => (
                            <button
                                key={theme.value}
                                type="button"
                                aria-label={`Select Theme: ${theme.label}`}
                                onClick={() => setSelectedTheme(theme.value)}
                                className={`relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all duration-300 hover:scale-[1.03] group ${
                                    selectedTheme === theme.value 
                                    ? `${theme.borderClass} ${theme.bgClass} ${theme.glowClass}` 
                                    : 'border-[var(--accent)]/10 bg-bg-primary hover:border-[var(--accent)]/30'
                                }`}
                            >
                                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-black/50 to-transparent pointer-events-none" />
                                
                                <h4 className={`text-lg font-black tracking-[0.25em] uppercase z-10 transition-colors ${
                                    selectedTheme === theme.value ? theme.colorClass : 'text-text-secondary group-hover:text-text-primary'
                                }`}>
                                    {theme.label}
                                </h4>
                                
                                {selectedTheme === theme.value && (
                                    <div className={`absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full border border-current ${theme.colorClass} bg-bg-primary`}>
                                        <div className="w-2 h-2 rounded-full bg-current shadow-[0_0_8px_currentcolor]" />
                                    </div>
                                )}
                                
                                {/* Background glow accent for unselected on hover */}
                                <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl transition-opacity duration-500 opacity-0 ${
                                    selectedTheme !== theme.value ? 'group-hover:opacity-20' : ''
                                }`} style={{ backgroundColor: theme.colorClass.replace('text-[', '').replace(']', '') }} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
