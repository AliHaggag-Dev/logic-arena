import React from "react";
import { SectionLabel } from "./SectionLabel";
import { QUICK_REF } from "../constants/docsData";

export function QuickReferenceSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section className={isMobile ? "mb-10" : "mb-[60px]"}>
      <SectionLabel text="QUICK_REFERENCE" isMobile={isMobile} />
      <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4"} mt-5`}>
        {QUICK_REF.map((card) => (
          <div
            key={card.title}
            className="quick-card bg-card/60 rounded-xl p-5 backdrop-blur-md"
            style={{
              boxShadow: 'var(--card-shadow)',
              border: `1px solid ${card.color}22`,
            }}
          >
            {/* Card header */}
            <div
              className={`flex items-center gap-2.5 ${isMobile ? "mb-3 pb-2.5" : "mb-[18px] pb-3.5"}`}
              style={{ borderBottom: `1px solid ${card.color}18` }}
            >
              <span
                className={isMobile ? "text-base" : "text-lg"}
                style={{ color: card.color, textShadow: `0 0 10px ${card.color}88` }}
              >
                {card.icon}
              </span>
              <span
                className="text-[10px] font-black tracking-[0.28em]"
                style={{ color: card.color, textShadow: `0 0 8px ${card.color}66` }}
              >
                {card.title}
              </span>
            </div>

            {/* Commands list */}
            <div className={`flex ${isMobile ? "flex-row flex-wrap gap-1.5" : "flex-col gap-2"}`}>
              {card.commands.map((cmd) => (
                <div
                  key={cmd}
                  className={`px-3 py-2 rounded-md text-[11px] font-semibold tracking-[0.06em] font-mono ${isMobile ? "bg-accent/5" : ""}`}
                  style={{
                    backgroundColor: isMobile ? undefined : `${card.color}08`,
                    border: `1px solid ${card.color}15`,
                    color: `${card.color}cc`,
                  }}
                >
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
