import React from "react";
import { Hexagon, Eye, Move, Zap, Brain, RotateCw, BarChart3 } from 'lucide-react';
import { SectionLabel } from "./SectionLabel";
import { QUICK_REF } from "../constants/docsData";

const REF_ICONS: Record<string, React.ReactNode> = {
  '⬡': <Hexagon className="w-4 h-4" />,
  '◈': <Eye className="w-4 h-4" />,
  '⦾': <Move className="w-4 h-4" />,
  '⚡': <Zap className="w-4 h-4" />,
  '◉': <Brain className="w-4 h-4" />,
  '◎': <RotateCw className="w-4 h-4" />,
  '📊': <BarChart3 className="w-4 h-4" />,
};

export function QuickReferenceSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section className={isMobile ? "mb-10" : "mb-[60px]"}>
      <SectionLabel text="QUICK REFERENCE" isMobile={isMobile} />
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
                className={`${isMobile ? "text-base" : "text-lg"} flex items-center justify-center w-7 h-7 rounded-md shadow-[0_0_15px_rgba(var(--accent-rgb),0.05)]`}
                style={{ color: card.color, border: `1px solid ${card.color}44`, background: `${card.color}10` }}
              >
                {REF_ICONS[card.icon] || card.icon}
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
