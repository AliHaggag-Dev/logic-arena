import React from 'react';
import { GameMode } from '../hooks/useScripts';

interface ArenaSelectorProps {
    selectedMode: GameMode;
    setSelectedMode: (mode: GameMode) => void;
    selectedTheme: string;
    setSelectedTheme: (theme: string) => void;
}

const MODES: { value: GameMode; label: string; description: string; image: string }[] = [
    { value: 'COMBAT', label: 'DEATHMATCH', description: 'Classic 1v1 destruction', image: '/thumbnails/mode-combat.png' },
    { value: 'SURVIVAL', label: 'SURVIVAL', description: 'Outlast endless waves', image: '/thumbnails/mode-survival.png' },
    { value: 'CAPTURE_THE_FLAG', label: 'CTF', description: 'Infiltrate & Extract', image: '/thumbnails/mode-ctf.png' },
    { value: 'KING_OF_THE_HILL', label: 'KOTH', description: 'Control the center zone', image: '/thumbnails/mode-koth.png' },
    { value: 'RACING', label: 'RACING', description: 'High-speed circuits', image: '/thumbnails/mode-racing.png' },
    { value: 'TRAINING_SOLO', label: 'TRAINING', description: 'Test your logic', image: '/thumbnails/mode-training.png' },
];

const THEMES: { value: string; label: string; colorClass: string; borderClass: string; bgClass: string; glowClass: string; image: string }[] = [
    { 
        value: 'CYBER', 
        label: 'NEO-CYBER', 
        colorClass: 'text-[var(--accent)]', 
        borderClass: 'border-[var(--accent)]/50',
        bgClass: 'bg-[var(--accent)]/5',
        glowClass: 'shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]',
        image: '/thumbnails/env-cyber.png'
    },
    { 
        value: 'LAVA', 
        label: 'MAGMA CORE', 
        colorClass: 'text-[#f97316]', 
        borderClass: 'border-[#f97316]/50',
        bgClass: 'bg-[#f97316]/5',
        glowClass: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
        image: '/thumbnails/env-lava.png'
    },
    { 
        value: 'ICE', 
        label: 'GLACIAL TUNDRA', 
        colorClass: 'text-[#22d3ee]', 
        borderClass: 'border-[#22d3ee]/50',
        bgClass: 'bg-[#22d3ee]/5',
        glowClass: 'shadow-[0_0_15px_rgba(34,211,238,0.15)]',
        image: '/thumbnails/env-ice.png'
    },
];

export const ArenaSelector: React.FC<ArenaSelectorProps> = ({
    selectedMode,
    setSelectedMode,
    selectedTheme,
    setSelectedTheme
}) => {
    return (
        <section className="flex flex-col gap-5 p-5 md:p-6 rounded-[24px] border border-accent/15 bg-card/45 backdrop-blur-xl relative overflow-hidden shadow-[var(--card-shadow)]">
            {/* Background dynamic ambient glow element */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent opacity-[0.03] rounded-full blur-[64px] pointer-events-none translate-x-1/4 -translate-y-1/4" />
            
            <header className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-[0.18em] text-text-primary flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-accent rounded-sm animate-pulse" />
                    CAMPAIGN NEXUS
                </h3>
                <p className="text-[10px] text-text-secondary tracking-wide uppercase ml-3.5">
                    Select your game mode and environment
                </p>
            </header>

            <div className="flex flex-col gap-5">
                {/* Mode Selector */}
                <div className="flex flex-col gap-2">
                    <h4 className="text-[10px] font-bold text-accent/80 tracking-widest uppercase ml-1">
                        1. Select Game Mode
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                        {MODES.map(mode => (
                            <button
                                key={mode.value}
                                type="button"
                                aria-label={`Select Mode: ${mode.label}`}
                                onClick={() => setSelectedMode(mode.value)}
                                className={`relative overflow-hidden flex flex-col justify-end p-3 rounded-2xl border transition-all duration-500 hover:scale-[1.02] aspect-[16/10] md:h-[85px] group text-left ${
                                    selectedMode === mode.value 
                                    ? 'border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.25)] text-text-primary' 
                                    : 'border-accent/15 hover:border-accent/35 text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                {/* Background environment/mode image with YouTube thumbnail CSS filters */}
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={mode.image}
                                        alt={mode.label}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108 filter brightness-[1.1] contrast-[1.2] saturate-[1.3]"
                                    />
                                    {/* Dark gradient overlay for text readability */}
                                    <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10 transition-opacity duration-300 ${
                                        selectedMode === mode.value ? 'opacity-85' : 'opacity-90 group-hover:opacity-75'
                                    }`} />
                                </div>

                                {/* Content overlay */}
                                <div className="relative z-10 flex flex-col gap-0.5">
                                    <span className={`font-black tracking-wider text-xs md:text-sm transition-all duration-300 flex items-center gap-1.5 ${
                                        selectedMode === mode.value ? 'text-accent drop-shadow-[0_0_4px_rgba(var(--accent-rgb),0.4)]' : 'text-text-primary'
                                    }`}>
                                        {selectedMode === mode.value && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />}
                                        {mode.label}
                                    </span>
                                    <span className="text-[8.5px] opacity-75 line-clamp-1">
                                        {mode.description}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Theme Selector */}
                <div className="flex flex-col gap-2">
                    <h4 className="text-[10px] font-bold text-accent/80 tracking-widest uppercase ml-1">
                        2. Select Environment
                    </h4>
                    <div className="grid grid-cols-3 gap-2.5">
                        {THEMES.map(theme => (
                            <button
                                key={theme.value}
                                type="button"
                                aria-label={`Select Theme: ${theme.label}`}
                                onClick={() => setSelectedTheme(theme.value)}
                                className={`relative overflow-hidden flex items-end justify-between p-3.5 rounded-2xl border transition-all duration-500 hover:scale-[1.02] md:h-[85px] group text-left ${
                                    selectedTheme === theme.value 
                                    ? `${theme.borderClass} ${theme.glowClass}` 
                                    : 'border-accent/15 hover:border-accent/35'
                                }`}
                            >
                                {/* Background environment image with YouTube thumbnail CSS filters */}
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={theme.image}
                                        alt={theme.label}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108 filter brightness-[1.1] contrast-[1.2] saturate-[1.3]"
                                    />
                                    {/* Dark gradient overlay */}
                                    <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10 transition-opacity duration-300 ${
                                        selectedTheme === theme.value ? 'opacity-85' : 'opacity-90 group-hover:opacity-75'
                                    }`} />
                                </div>
                                
                                <span className={`text-xs md:text-sm font-black tracking-[0.1em] uppercase z-10 transition-colors relative ${
                                    selectedTheme === theme.value ? theme.colorClass : 'text-text-secondary group-hover:text-text-primary'
                                }`}>
                                    {theme.label}
                                </span>
                                
                                {selectedTheme === theme.value ? (
                                    <div className={`flex items-center justify-center w-4 h-4 rounded-full border border-current ${theme.colorClass} bg-bg-primary/95 z-10 shadow-[0_0_8px_currentcolor]`}>
                                        <div className="w-1 h-1 rounded-full bg-current" />
                                    </div>
                                ) : (
                                    <div className="w-4 h-4 rounded-full border border-accent/25 bg-bg-primary/50 group-hover:border-accent/40 z-10 transition-colors" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
