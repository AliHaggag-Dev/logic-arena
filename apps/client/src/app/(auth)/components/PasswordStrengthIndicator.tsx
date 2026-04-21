import React from "react";

interface Props {
  score: number;
  checks: {
    length: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    special: boolean;
  };
  strengthColor: string;
  strengthLabel: string;
  isMobile: boolean;
}

export function PasswordStrengthIndicator({ score, checks, strengthColor, strengthLabel, isMobile }: Props) {
  return (
    <div className="mt-2 space-y-3 px-0.5 animate-[fadeInScale_0.2s_ease]">
      {/* Strength bars + label */}
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] font-black text-accent/30 tracking-widest uppercase shrink-0">STRENGTH:</span>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full transition-all duration-500"
            style={{
              background: i <= score ? strengthColor : "rgba(var(--accent-rgb),0.06)",
              boxShadow: i <= score ? `0 0 8px ${strengthColor}60` : "none",
            }}
          />
        ))}
        <span
          className="text-[8px] font-black tracking-[0.2em] shrink-0 transition-colors duration-300 ml-1"
          style={{ color: strengthColor }}
        >
          {strengthLabel}
        </span>
      </div>

      {/* Per-rule checklist */}
      <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-x-4 gap-y-1`}>
        {[
          { ok: checks.length, label: "8+ CHARACTERS" },
          { ok: checks.upper, label: "UPPERCASE_CHAR" },
          { ok: checks.lower, label: "LOWERCASE_CHAR" },
          { ok: checks.number, label: "NUMERIC_CHAR" },
          { ok: checks.special, label: "SPEC_SYMBOL" },
        ].map(({ ok, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 transition-all duration-300"
          >
            <div className={`w-1 h-1 rounded-full ${ok ? "bg-accent shadow-[0_0_5px_var(--accent)]" : "bg-white/10"}`} />
            <span
              className={`text-[8px] font-black tracking-widest transition-colors duration-200 ${ok ? "text-accent/80" : "text-white/20"}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
