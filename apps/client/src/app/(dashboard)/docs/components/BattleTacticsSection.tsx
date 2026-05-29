import React from "react";
import { SectionLabel } from "./SectionLabel";
import { TACTICS_DATA } from "../constants/docsData";
import { CopyButton } from "./CopyButton";

export function BattleTacticsSection({ onLoadScript, isMobile }: { onLoadScript: (code: string) => void, isMobile: boolean }) {
  return (
    <section className={isMobile ? "mb-10" : "mb-[60px]"}>
      <SectionLabel text="PRESET SCRIPTS" isMobile={isMobile} />
      <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5"} mt-5`}>
        {TACTICS_DATA.map((tactic) => (
          <div
            key={tactic.title}
            className="bg-card/60 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
            style={{ border: `1px solid color-mix(in srgb, ${tactic.color} 20%, transparent)` }}
          >
            <div className="absolute top-0 left-0 w-1 h-full opacity-50" style={{ backgroundColor: tactic.color }} />

            <div className="text-[11px] font-black tracking-[0.2em] mb-2 uppercase" style={{ color: tactic.color }}>
              {tactic.title}
            </div>
            <div className="text-[10px] text-text-primary/70 mb-4 leading-relaxed tracking-wide font-medium">
              {tactic.desc}
            </div>
            <div className="relative bg-bg-primary/50 p-4 rounded-xl font-mono text-[10px] text-accent leading-relaxed whitespace-pre-wrap border border-accent/10 shadow-inner overflow-x-auto docs-scrollbar">
              {tactic.code}
              <CopyButton code={tactic.code} themeColor={tactic.color} />
            </div>
            <button
              type="button"
              onClick={() => onLoadScript(tactic.code)}
              className="mt-4 w-full py-3 bg-transparent text-[9px] font-bold tracking-[0.2em] uppercase cursor-pointer rounded-xl transition-all hover:bg-white/5 hover:opacity-90 border border-white/10 active:scale-[0.98]"
              style={{
                borderColor: `color-mix(in srgb, ${tactic.color} 20%, transparent)`,
                color: tactic.color,
              }}
            >
              ▶ LOAD_TO_CORE
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
