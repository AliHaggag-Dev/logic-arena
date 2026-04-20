"use client";

import React from "react";

const PALETTE = [
  { hex: "DEFAULT", label: "DEFAULT" },
  { hex: "#22d3ee", label: "CYAN" },
  { hex: "#a855f7", label: "PURPLE" },
  { hex: "#10b981", label: "GREEN" },
  { hex: "#ef4444", label: "RED" },
  { hex: "#f97316", label: "ORANGE" },
  { hex: "#eab308", label: "YELLOW" },
  { hex: "#ffffff", label: "WHITE" },
  { hex: "#1e293b", label: "STEEL" },
];

interface ColorPickerProps {
  selected: string;
  onChange: (hex: string) => void;
  isMobile?: boolean;
}

export function ColorPicker({ selected, onChange, isMobile }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[9px] tracking-[0.28em] text-accent/35 uppercase font-bold px-1">
        // NEURAL_TINT_SELECTION
      </p>

      <div className={`flex flex-wrap ${isMobile ? "gap-4 justify-between" : "gap-3"}`}>
        {PALETTE.map(({ hex, label }) => {
          const isActive = selected.toLowerCase() === hex.toLowerCase();
          const size = isMobile ? "w-11 h-11" : "w-10 h-10";
          
          return (
            <button
              key={hex}
              title={label}
              onClick={() => onChange(hex)}
              className="relative group flex flex-col items-center gap-2 focus:outline-none active:scale-95 transition-transform"
            >
              {/* Swatch */}
              <span
                className={`block ${size} rounded-xl transition-all duration-300 relative overflow-hidden`}
                style={{
                  background: hex === "DEFAULT" ? "linear-gradient(135deg, #475569 50%, #1e293b 50%)" : hex,
                  boxShadow: isActive
                    ? `0 0 0 2px #030712, 0 0 0 4px ${hex === "DEFAULT" ? "#94a3b8" : hex}, 0 0 20px ${hex === "DEFAULT" ? "#94a3b8" : hex}66`
                    : "0 0 0 1px rgba(var(--accent-rgb),0.15)",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                }}
              >
                {isActive && (
                   <span className="absolute inset-0 bg-white/10 animate-pulse" />
                )}
              </span>

              {/* Label */}
              <span
                className="text-[8px] tracking-[0.1em] font-black uppercase transition-colors duration-200"
                style={{ color: isActive ? (hex === "DEFAULT" ? "#94a3b8" : hex) : "rgba(var(--accent-rgb),0.3)" }}
              >
                {label}
              </span>

              {/* Active Glow Indicator */}
              {isActive && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full z-10 border border-white/20"
                  style={{
                    background: hex === "DEFAULT" ? "#94a3b8" : hex,
                    boxShadow: `0 0 10px ${hex === "DEFAULT" ? "#94a3b8" : hex}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
