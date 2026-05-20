"use client";

import React from "react";

interface DrawScreenProps {
  levelTitle: string;
  isMobile: boolean;
  onRetry: () => void;
  onBack: () => void;
}

export function DrawScreen({ levelTitle, isMobile, onRetry, onBack }: DrawScreenProps) {
  return (
    <div className={`${isMobile ? "min-h-screen w-full rounded-none px-5 py-10" : "w-full max-w-[420px] rounded-2xl p-10"} border border-accent/25 bg-bg-primary text-center font-mono shadow-[0_0_56px_rgba(var(--accent-rgb),0.12)]`}>
      <p className="mb-2 text-[9px] font-black tracking-[0.32em] text-accent/35 uppercase">{levelTitle}</p>
      <h2 className="mb-4 text-[18px] font-black tracking-[0.24em] text-accent/70 uppercase">
        STALEMATE
      </h2>
      <p className="mb-8 text-[10px] font-bold tracking-[0.16em] text-accent/45 uppercase">
        Neither system secured dominance.
      </p>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onRetry} className="h-[44px] rounded-lg border border-accent/40 bg-accent/10 text-[10px] font-black tracking-[0.24em] text-accent uppercase transition-colors hover:bg-accent/20">
          RETRY
        </button>
        <button type="button" onClick={onBack} className="h-[44px] rounded-lg border border-transparent bg-transparent text-[10px] font-black tracking-[0.22em] text-accent/45 uppercase transition-colors hover:text-accent/70">
          BACK
        </button>
      </div>
    </div>
  );
}
