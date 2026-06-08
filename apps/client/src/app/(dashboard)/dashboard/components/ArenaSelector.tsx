"use client";
import React, { useRef, useState, useEffect } from 'react';
import { GameMode } from '../hooks/useScripts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

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
    const modesRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const handleScroll = () => {
        if (modesRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = modesRef.current;
            setCanScrollLeft(scrollLeft > 20);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
        }
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, []);

    const scroll = (dir: 'left' | 'right') => {
        if (modesRef.current) {
            const scrollAmount = dir === 'left' ? -350 : 350;
            modesRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const currentMode = MODES.find(m => m.value === selectedMode) || MODES[0];
    const currentTheme = THEMES.find(t => t.value === selectedTheme) || THEMES[0];

    return (
        <section className="flex flex-col gap-6 p-1 relative w-full">
            {/* 1. Hero Presentation Box */}
            <div className={`relative w-full shrink-0 h-56 md:h-[340px] rounded-[24px] overflow-hidden border transition-all duration-700 bg-black ${currentTheme.borderClass} ${currentTheme.glowClass}`}>
                {/* Background Image */}
                <Image 
                    key={currentMode.value}
                    src={currentMode.image} 
                    alt={currentMode.label}
                    fill
                    className="absolute inset-0 w-full h-full object-cover filter brightness-[1.15] saturate-[1.2] animate-in fade-in zoom-in-[0.98] duration-700"
                />
                
                {/* Ambient Theme Glow over the image */}
                <div className={`absolute inset-0 opacity-40 mix-blend-overlay transition-colors duration-700 ${currentTheme.bgClass}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/90 via-[#030712]/20 to-transparent" />

                {/* Content inside Hero */}
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col gap-1.5 z-10">
                    <div className="flex items-center gap-2 mb-1 animate-in fade-in slide-in-from-left-4 duration-500 delay-100 fill-mode-both">
                        <span className={`w-2 h-2 rounded-full animate-pulse bg-current shadow-[0_0_8px_currentcolor] ${currentTheme.colorClass}`} />
                        <span className={`text-[10px] md:text-xs font-black tracking-[0.3em] uppercase ${currentTheme.colorClass}`}>
                            {currentTheme.label} ENVIRONMENT
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-[0.15em] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both leading-none">
                        {currentMode.label}
                    </h2>
                    <p className="text-xs md:text-sm text-text-secondary font-medium tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] max-w-md mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                        {currentMode.description}
                    </p>
                </div>

                {/* Top Right "Campaign Nexus" badge inside Hero */}
                <div className="absolute top-5 right-5 z-10 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                    <span className="text-[9px] font-black tracking-[0.2em] text-white uppercase">Campaign Nexus</span>
                </div>
            </div>

            {/* 2. Scrollable Selection Areas */}
            <div className="flex flex-col gap-6 w-full pb-4">
                
                {/* Game Modes Horizontal Carousel */}
                <div className="flex flex-col gap-3 w-full group/carousel">
                    <h4 className="text-[10px] font-black text-accent tracking-[0.2em] uppercase ml-1 flex items-center gap-3">
                        SELECT GAME MODE
                        <span className="h-px bg-accent/20 flex-1" />
                    </h4>
                    
                    <div className="relative w-full">
                        {/* Left Arrow Overlay */}
                        <div 
                            className={`hidden md:flex absolute top-0 bottom-0 left-0 w-24 items-center justify-start z-10 transition-all duration-300 pointer-events-none pb-8 ${canScrollLeft ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                            style={{
                                backgroundImage: 'linear-gradient(to right, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 80%, transparent) 60%, transparent 100%)'
                            }}
                        >
                            <button type="button" aria-label="Scroll left" onClick={() => scroll('left')} className="pointer-events-auto ml-1 p-2.5 rounded-full bg-black/60 hover:bg-accent/20 text-white/70 hover:text-white border border-white/10 hover:border-accent shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all hover:scale-110 active:scale-95 group/arrow cursor-pointer">
                                <ChevronLeft size={24} strokeWidth={3} className="drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] group-hover/arrow:drop-shadow-[0_0_8px_currentColor]" />
                            </button>
                        </div>
                        
                        {/* Right Arrow Overlay */}
                        <div 
                            className={`hidden md:flex absolute top-0 bottom-0 right-0 w-24 items-center justify-end z-10 transition-all duration-300 pointer-events-none pb-8 ${canScrollRight ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                            style={{
                                backgroundImage: 'linear-gradient(to left, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 80%, transparent) 60%, transparent 100%)'
                            }}
                        >
                            <button type="button" aria-label="Scroll right" onClick={() => scroll('right')} className="pointer-events-auto mr-1 p-2.5 rounded-full bg-black/60 hover:bg-accent/20 text-white/70 hover:text-white border border-white/10 hover:border-accent shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all hover:scale-110 active:scale-95 group/arrow cursor-pointer">
                                <ChevronRight size={24} strokeWidth={3} className="drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] group-hover/arrow:drop-shadow-[0_0_8px_currentColor]" />
                            </button>
                        </div>

                        <div ref={modesRef} onScroll={handleScroll} className="flex gap-4 overflow-x-auto pt-3 pb-8 px-4 w-full snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
                        {MODES.map(mode => {
                            const isSelected = selectedMode === mode.value;
                            return (
                                <button
                                    key={mode.value}
                                    type="button"
                                    onClick={() => setSelectedMode(mode.value)}
                                    className={`relative flex-shrink-0 w-[160px] md:w-[200px] aspect-[16/10] rounded-[20px] overflow-hidden snap-start transition-all duration-300 group border text-left cursor-pointer ${
                                        isSelected 
                                        ? 'border-accent shadow-[0_0_25px_rgba(var(--accent-rgb),0.25)] scale-[1.02] bg-accent/5' 
                                        : 'border-white/10 hover:border-accent/40 opacity-60 hover:opacity-100 hover:bg-white/5'
                                    }`}
                                >
                                    <Image fill src={mode.image} alt={mode.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-[1.1] saturate-[1.2]" />
                                    <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300 ${isSelected ? 'from-[#030712] via-[#030712]/50 to-transparent' : 'from-black/95 via-black/60 to-black/30 group-hover:from-black/90 group-hover:via-black/50'}`} />
                                    
                                    <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-0.5">
                                        <span className={`text-xs md:text-sm font-black tracking-[0.15em] uppercase transition-colors flex items-center gap-2 ${isSelected ? 'text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]' : 'text-white'}`}>
                                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentcolor]" />}
                                            {mode.label}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

                {/* Environments Horizontal Carousel */}
                <div className="flex flex-col gap-3 w-full">
                    <h4 className="text-[10px] font-black text-accent tracking-[0.2em] uppercase ml-1 flex items-center gap-3">
                        SELECT ENVIRONMENT
                        <span className="h-px bg-accent/20 flex-1" />
                    </h4>
                    <div className="flex gap-4 overflow-x-auto pt-3 pb-8 px-4 w-full snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
                        {THEMES.map(theme => {
                            const isSelected = selectedTheme === theme.value;
                            return (
                                <button
                                    key={theme.value}
                                    type="button"
                                    onClick={() => setSelectedTheme(theme.value)}
                                    className={`relative flex-shrink-0 w-[140px] md:w-[180px] aspect-video rounded-[16px] overflow-hidden snap-start transition-all duration-300 group border text-left cursor-pointer ${
                                        isSelected 
                                        ? `${theme.borderClass} ${theme.glowClass} scale-[1.02] ${theme.bgClass}` 
                                        : 'border-white/10 hover:border-white/40 opacity-60 hover:opacity-100 hover:bg-white/5'
                                    }`}
                                >
                                    <Image fill src={theme.image} alt={theme.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-[1.1] saturate-[1.2]" />
                                    <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300 ${isSelected ? 'from-[#030712] via-[#030712]/40 to-transparent' : 'from-black/95 via-black/50 to-black/20 group-hover:from-black/90 group-hover:via-black/40'}`} />
                                    
                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                        <span className={`text-[10px] md:text-xs font-black tracking-[0.15em] uppercase transition-colors ${isSelected ? theme.colorClass : 'text-white'}`}>
                                            {theme.label}
                                        </span>
                                        {isSelected && (
                                            <div className={`flex items-center justify-center w-4 h-4 rounded-full border border-current ${theme.colorClass} bg-[#030712]/95 shadow-[0_0_8px_currentcolor]`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                
            </div>
        </section>
    );
};
