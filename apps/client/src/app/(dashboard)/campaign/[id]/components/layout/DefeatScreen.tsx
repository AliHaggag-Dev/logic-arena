"use client";

import React, { useMemo } from "react";

const DEFEAT_MESSAGES = [
  "Analyze the enemy pattern.",
  "Adapt your strategy.",
  "Study the script. Find the weakness.",
  "Every defeat is data.",
];

interface DefeatScreenProps {
  levelTitle: string;
  isMobile: boolean;
  onRetry: () => void;
  onHint: () => void;
  onBack: () => void;
}

export function DefeatScreen({ levelTitle, isMobile, onRetry, onHint, onBack }: DefeatScreenProps) {
  const message = useMemo(() => DEFEAT_MESSAGES[Math.floor(Math.random() * DEFEAT_MESSAGES.length)], []);

  return (
    <div className={`${isMobile ? "min-h-screen w-full rounded-none px-5 py-10" : "w-full max-w-[430px] rounded-2xl p-10"} border border-accent/30 bg-bg-primary text-center font-mono shadow-[0_0_60px_rgba(var(--accent-rgb),0.16)] defeat-border`}>
      <style>{`
        @keyframes defeatBorderGlitch {
          0%, 100% { box-shadow: 0 0 36px rgba(var(--accent-rgb),0.10); }
          18% { box-shadow: 0 0 18px rgba(var(--accent-rgb),0.28); }
          21% { box-shadow: 0 0 52px rgba(var(--accent-rgb),0.18); }
          48% { transform: translateX(0); }
          49% { transform: translateX(1px); }
          50% { transform: translateX(-1px); }
          51% { transform: translateX(0); }
        }
        .defeat-border { animation: defeatBorderGlitch 1.9s steps(2,end) infinite; }
      `}</style>
      <p className="mb-2 text-[9px] font-black tracking-[0.32em] text-accent/35 uppercase">{levelTitle}</p>
      <h2 className="mb-4 text-[18px] font-black tracking-[0.24em] text-accent/80 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.55)] uppercase">
        SYSTEM FAILURE
      </h2>
      <p className="mb-8 text-[10px] font-bold tracking-[0.16em] text-accent/50 uppercase">{message}</p>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onRetry} className="h-[44px] rounded-lg border border-accent/45 bg-accent/10 text-[10px] font-black tracking-[0.24em] text-accent uppercase transition-colors hover:bg-accent/20">
          RETRY
        </button>
        <button type="button" onClick={onHint} className="h-[44px] rounded-lg border border-accent/25 bg-accent/5 text-[10px] font-black tracking-[0.22em] text-accent/75 uppercase transition-colors hover:bg-accent/10">
          SHOW HINT
        </button>
        <button type="button" onClick={onBack} className="h-[44px] rounded-lg border border-transparent bg-transparent text-[10px] font-black tracking-[0.22em] text-accent/45 uppercase transition-colors hover:text-accent/70">
          RETREAT
        </button>
      </div>
    </div>
  );
}
