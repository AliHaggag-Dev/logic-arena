"use client";
import React from "react";

interface StasisWarningProps {
  isInStasis: boolean;
}

export const StasisWarning = ({ isInStasis }: StasisWarningProps) => {
  if (!isInStasis) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none text-center">
      <div className="text-[#ffcc00] font-mono font-black text-2xl tracking-[0.3em] drop-shadow-[0_0_10px_#ffcc00] animate-pulse">
        ENERGY DEPLETED
      </div>
      <div className="text-[#ffcc00] font-mono font-bold text-sm tracking-[0.2em] mt-2 opacity-80">
        SYSTEM RECHARGING
      </div>
    </div>
  );
};
