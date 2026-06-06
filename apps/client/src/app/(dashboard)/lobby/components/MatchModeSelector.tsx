"use client";

import { Brain, Swords } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { MatchMode } from "../../../../context/SocketContext";

interface MatchModeSelectorProps {
  selectedMode: MatchMode;
  onSelectMode: (mode: MatchMode) => void;
  isMobile: boolean;
}

interface MatchModeOption {
  value: MatchMode;
  label: string;
  description: string[];
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const MATCH_MODE_OPTIONS: MatchModeOption[] = [
  {
    value: "CLASSIC",
    label: "CLASSIC MODE",
    description: ["Write script before match.", "10 live edit tokens."],
    Icon: Swords,
  },
  {
    value: "TACTICAL",
    label: "TACTICAL MODE",
    description: ["3 rounds + breaks.", "Edit code between rounds. No limits."],
    Icon: Brain,
  },
];

export function MatchModeSelector({
  selectedMode,
  onSelectMode,
  isMobile,
}: MatchModeSelectorProps) {
  return (
    <section
      aria-label="Match mode"
      className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2 min-w-[430px]"}`}
    >
      {MATCH_MODE_OPTIONS.map(({ value, label, description, Icon }) => {
        const isSelected = selectedMode === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectMode(value)}
            className={`group cursor-pointer rounded-lg border p-4 text-left font-mono transition-all duration-200 hover:-translate-y-[1px] hover:border-accent/70 hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
              isSelected
                ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(var(--accent-rgb),0.22)]"
                : "border-accent/20 bg-card/45"
            }`}
          >
            <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-accent">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            <span className="mt-4 block min-h-12 text-[10px] uppercase leading-5 tracking-[0.12em] text-accent/60">
              {description.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </span>
            <span
              className={`mt-4 inline-flex h-8 items-center rounded-md border px-3 text-[9px] font-black uppercase tracking-[0.18em] transition-all ${
                isSelected
                  ? "border-accent bg-accent text-bg-primary"
                  : "border-accent/30 bg-accent/5 text-accent/70 group-hover:text-accent"
              }`}
            >
              {isSelected ? "SELECTED" : "SELECT"}
            </span>
          </button>
        );
      })}
    </section>
  );
}
