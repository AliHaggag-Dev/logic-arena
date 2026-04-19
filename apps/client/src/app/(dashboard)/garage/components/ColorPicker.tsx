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
}

export function ColorPicker({ selected, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[9px] tracking-[0.28em] text-accent/35 uppercase">
        // SELECT_TINT
      </p>

      <div className="flex flex-wrap gap-3">
        {PALETTE.map(({ hex, label }) => {
          const isActive = selected.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              title={label}
              onClick={() => onChange(hex)}
              className="relative group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              {/* Swatch */}
              <span
                className="block w-9 h-9 rounded-md transition-all duration-200"
                style={{
                  background: hex === "DEFAULT" ? "linear-gradient(135deg, #475569 50%, #1e293b 50%)" : hex,
                  boxShadow: isActive
                    ? `0 0 0 2px #030712, 0 0 0 4px ${hex === "DEFAULT" ? "#94a3b8" : hex}, 0 0 16px ${hex === "DEFAULT" ? "#94a3b8" : hex}88`
                    : "0 0 0 1px rgba(var(--accent-rgb),0.15)",
                  transform: isActive ? "scale(1.15)" : "scale(1)",
                }}
              />
              {/* Label */}
              <span
                className="text-[9px] tracking-[0.18em] transition-colors duration-200"
                style={{ color: isActive ? (hex === "DEFAULT" ? "#94a3b8" : hex) : "rgba(var(--accent-rgb),0.3)" }}
              >
                {label}
              </span>

              {/* Active dot */}
              {isActive && (
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                  style={{
                    background: hex === "DEFAULT" ? "#94a3b8" : hex,
                    boxShadow: `0 0 6px ${hex === "DEFAULT" ? "#94a3b8" : hex}`,
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
