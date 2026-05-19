"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SectionHeader } from "./shared";

const THEME_CARDS = [
  {
    id: "cyberpunk",
    label: "CYBERPUNK",
    palette: ["#030712", "#22d3ee", "#f8fafc"],
    desc: "Dark neon — the default operative environment",
  },
  {
    id: "light",
    label: "VIOLET SOVEREIGN",
    palette: ["#f0f2fa", "#5b21b6", "#0b0d1a"],
    desc: "Premium light — cool slate canvas, deep violet command",
  },
  {
    id: "desert",
    label: "OBSIDIAN EMBER",
    palette: ["#0e0a04", "#f59e0b", "#fcd34d"],
    desc: "Volcanic darkness forged in liquid gold fire",
  },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return (
    <div className="flex flex-col gap-6 opacity-50">
      <SectionHeader>APPEARANCE</SectionHeader>
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-full h-[92px] rounded-xl border border-accent/10 bg-bg-secondary"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader>APPEARANCE</SectionHeader>
      <div className="grid grid-cols-1 gap-3">
        {THEME_CARDS.map(({ id, label, palette, desc }) => {
          const isActive = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={`w-full text-left p-5 rounded-xl border transition-all duration-200 group cursor-pointer ${isActive
                ? "border-accent bg-accent/[0.07] shadow-[0_0_20px_rgba(var(--accent-rgb),0.12),inset_0_0_30px_rgba(var(--accent-rgb),0.04)]"
                : "border-accent/10 bg-bg-secondary hover:border-accent/30 hover:bg-accent/[0.03]"
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-black tracking-[0.25em] ${isActive ? "text-accent [text-shadow:0_0_8px_rgba(var(--accent-rgb),0.6)]" : "text-text-secondary group-hover:text-text-primary"} transition-colors`}>
                  {label}
                </span>
                <div className="flex gap-1.5 items-center">
                  {palette.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  {isActive && (
                    <span className="ml-2 text-accent text-[10px] font-bold tracking-widest">ACTIVE</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-text-secondary/60 tracking-[0.06em]">{desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
