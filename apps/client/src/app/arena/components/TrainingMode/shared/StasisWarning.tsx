"use client";
import React from "react";

interface StasisWarningProps {
  isInStasis: boolean;
}

export const StasisWarning = ({ isInStasis }: StasisWarningProps) => {
  if (!isInStasis) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none text-center"
    >
      <div className="text-arena-yellow font-mono font-black text-2xl tracking-[0.3em] drop-shadow-[0_0_10px_var(--arena-yellow)] animate-pulse">
        ENERGY DEPLETED
      </div>
      <div className="text-arena-yellow font-mono font-bold text-sm tracking-[0.2em] mt-2 opacity-80">
        SYSTEM RECHARGING
      </div>
    </div>
  );
};
