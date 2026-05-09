"use client";

import React from "react";
import { Diamond } from "lucide-react";

interface Swatch {
  hex: string;
  label: string;
  description?: string;
}

const PALETTE: Swatch[] = [
  { hex: "DEFAULT", label: "DEFAULT", description: "Original robot materials" },
  { hex: "#22d3ee", label: "CYAN" },
  { hex: "#a855f7", label: "PURPLE" },
  { hex: "#10b981", label: "GREEN" },
  { hex: "#ef4444", label: "RED" },
  { hex: "#f97316", label: "ORANGE" },
  { hex: "#eab308", label: "YELLOW" },
  { hex: "#ffffff", label: "WHITE" },
  { hex: "#1e293b", label: "STEEL" },
];

/** Neutral grey for the DEFAULT swatch ring and label */
const DEFAULT_SWATCH_COLOR = "#94a3b8";
/** Background for the DEFAULT swatch — a two-tone grey grid */
const DEFAULT_SWATCH_BG = "linear-gradient(135deg, #475569 50%, #1e293b 50%)";
/** Inner ring gap between swatch and active ring */
const RING_GAP_COLOR = "#030712";

interface ColorPickerProps {
  selected: string;
  onChange: (hex: string) => void;
  isMobile?: boolean;
}

export function ColorPicker({ selected, onChange, isMobile }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Section heading */}
      <div className="flex flex-col gap-1 px-1">
        <p className="text-[9px] tracking-[0.28em] text-accent/35 uppercase font-bold">
          // NEURAL_TINT_SELECTION
        </p>
        <p className="text-[8px] tracking-[0.12em] text-accent/25 uppercase font-bold">
          SELECT A PAINT COAT — DEFAULT RESTORES ORIGINAL MATERIALS
        </p>
      </div>

      <div className={`flex flex-wrap ${isMobile ? "gap-4 justify-between" : "gap-3"}`}>
        {PALETTE.map(({ hex, label, description }) => {
          const isActive = selected.toLowerCase() === hex.toLowerCase();
          const isDefault = hex === "DEFAULT";
          const ringColor = isDefault ? DEFAULT_SWATCH_COLOR : hex;
          const swatchSize = isMobile ? "w-11 h-11" : "w-10 h-10";

          return (
            <button
              key={hex}
              type="button"
              title={description ?? label}
              aria-label={`Color: ${label}${description ? ` — ${description}` : ""}`}
              aria-pressed={isActive}
              onClick={() => onChange(hex)}
              className="relative group flex flex-col items-center gap-2 focus:outline-none active:scale-95 transition-transform"
            >
              {/* Swatch circle */}
              <span
                className={`block ${swatchSize} rounded-xl transition-all duration-300 relative overflow-hidden`}
                style={{
                  background: isDefault ? DEFAULT_SWATCH_BG : hex,
                  boxShadow: isActive
                    ? `0 0 0 2px ${RING_GAP_COLOR}, 0 0 0 4px ${ringColor}, 0 0 20px ${ringColor}66`
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
                style={{ color: isActive ? ringColor : "rgba(var(--accent-rgb),0.3)" }}
              >
                {label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full z-10 border border-white/20"
                  style={{
                    background: ringColor,
                    boxShadow: `0 0 10px ${ringColor}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* DEFAULT explanation chip */}
      {selected === "DEFAULT" && (
        <p className="text-[8px] tracking-[0.12em] text-accent/30 uppercase font-bold px-1 italic flex items-center gap-1">
          <Diamond className="w-2.5 h-2.5 fill-current" /> ORIGINAL GLB MATERIALS ACTIVE — NO TINT APPLIED
        </p>
      )}
    </div>
  );
}
