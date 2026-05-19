"use client";

import React from "react";

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-1.5 h-1.5 border-t-[1.5px] border-l-[1.5px] border-accent/60 -mb-1" />
      <span className="text-[10px] font-black tracking-[0.4em] uppercase text-accent">
        {children}
      </span>
      <div className="w-1.5 h-1.5 border-b-[1.5px] border-r-[1.5px] border-accent/60 mt-1" />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  id,
  ariaLabel,
  disabled,
  isGuest,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  ariaLabel?: string;
  disabled?: boolean;
  isGuest?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`relative inline-flex items-center min-w-[44px] min-h-[44px] justify-center ${disabled || isGuest ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${isGuest ? "grayscale" : ""}`}
    >
      <input
        aria-label={ariaLabel || id}
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => !disabled && !isGuest && onChange(e.target.checked)}
        disabled={disabled || isGuest}
      />
      <div
        className={`w-11 h-6 rounded-full border transition-all duration-200 relative ${checked
          ? "bg-accent/20 border-accent/60"
          : "bg-bg-secondary border-accent/10"
          } ${isGuest ? "border-dashed opacity-40" : ""}`}
      >
        <div
          className={`absolute top-[3px] w-[18px] h-[18px] rounded-full transition-all duration-200 ${checked ? "left-[22px] bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" : "left-[3px] bg-text-secondary/30"
            }`}
        />
      </div>
    </label>
  );
}
