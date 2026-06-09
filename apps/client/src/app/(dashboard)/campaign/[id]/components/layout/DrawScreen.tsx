"use client";

import React from "react";

interface DrawScreenProps {
  levelTitle: string;
  isMobile: boolean;
  onRetry: () => void;
  onBack: () => void;
  message?: string;
}

export function DrawScreen({ levelTitle, isMobile, onRetry, onBack, message = "Time limit reached." }: DrawScreenProps) {
  return (
    <div className={`${isMobile ? "w-full max-w-[95%] rounded-2xl p-6" : "w-full max-w-[430px] rounded-2xl p-10"} border border-[rgba(var(--sem-warning-rgb),0.3)] bg-bg-primary text-center font-mono shadow-[0_0_60px_rgba(var(--sem-warning-rgb),0.16)] draw-border`}>
      <style>{`
        @keyframes drawBorderGlitch {
          0%, 100% { box-shadow: 0 0 36px rgba(var(--sem-warning-rgb),0.10); }
          50% { box-shadow: 0 0 18px rgba(var(--sem-warning-rgb),0.28); }
        }
        .draw-border { animation: drawBorderGlitch 3s ease-in-out infinite; }
      `}</style>
      <p className="mb-2 text-[9px] font-black tracking-[0.32em] text-[rgba(var(--sem-warning-rgb),0.35)] uppercase">{levelTitle}</p>
      <h2 className="mb-4 text-[18px] font-black tracking-[0.24em] text-[rgba(var(--sem-warning-rgb),0.8)] drop-shadow-[0_0_12px_rgba(var(--sem-warning-rgb),0.55)] uppercase">
        MATCH DRAW
      </h2>
      <p className="mb-8 text-[10px] font-bold tracking-[0.16em] text-[rgba(var(--sem-warning-rgb),0.5)] uppercase">{message}</p>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onRetry} className="cursor-pointer h-[44px] rounded-lg border border-[rgba(var(--sem-warning-rgb),0.45)] bg-[rgba(var(--sem-warning-rgb),0.1)] text-[10px] font-black tracking-[0.24em] text-[var(--sem-warning)] uppercase transition-colors hover:bg-[rgba(var(--sem-warning-rgb),0.2)]">
          RETRY
        </button>
        <button type="button" onClick={onBack} className="cursor-pointer h-[44px] rounded-lg border border-transparent bg-transparent text-[10px] font-black tracking-[0.22em] text-[rgba(var(--sem-warning-rgb),0.45)] uppercase transition-colors hover:text-[rgba(var(--sem-warning-rgb),0.7)]">
          BACK TO MAP
        </button>
      </div>
    </div>
  );
}
