import React from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LevelInfo, DIFF_COLORS } from "../types";
import { SkeletonNode } from "./CampaignSkeletons";

interface CampaignDesktopLayoutProps {
  levels: LevelInfo[];
  loading: boolean;
  currentLevel: LevelInfo | undefined;
  router: AppRouterInstance;
}

export function CampaignDesktopLayout({ levels, loading, currentLevel, router }: CampaignDesktopLayoutProps) {
  return (
    <div className="max-w-[860px] mx-auto px-6 pt-16 pb-[120px] drop-shadow-xl relative z-10 animate-[fadeIn_0.35s_ease]">
      {/* Header */}
      <div className="border-b border-accent/20 pb-7 mb-12">
        <h1 className="m-0 text-[clamp(28px,5vw,46px)] font-black tracking-[0.22em] text-accent drop-shadow-[0_0_14px_rgba(var(--accent-rgb),0.9)] leading-none break-words">
          CAMPAIGN_MODE
        </h1>
        <p className="mt-3 text-[11px] text-accent/35 tracking-[0.15em]">
          Defeat all 10 enemy bots to prove your AliScript mastery.
        </p>

        {/* Progress bar */}
        {!loading && (
          <div className="mt-5 flex items-center gap-4">
            <span className="text-[10px] tracking-[0.2em] text-accent/70">PROGRESS</span>
            <div className="flex-1 h-[3px] bg-accent/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700"
                style={{ width: `${(levels.filter((l) => l.completed).length / 10) * 100}%`, boxShadow: "0 0 8px rgba(var(--accent-rgb),0.6)" }}
              />
            </div>
            <span className="text-[10px] tracking-[0.1em] text-accent/60 font-bold">
              {levels.filter((l) => l.completed).length}/10
            </span>
          </div>
        )}
      </div>

      {/* Level Map */}
      <div className="flex flex-col gap-0">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`flex mb-10 justify-center ${i % 2 === 0 ? "justify-start" : "justify-end"} relative`}
            >
              {i < 9 && (
                <div className={`absolute -translate-x-1/2 translate-x-0 ${i % 2 === 0 ? "left-[135px]" : "left-auto right-[135px]"} bottom-0 translate-y-full w-[1px] h-10 z-0 bg-accent/10`} />
              )}
              <div className="relative z-10 w-auto flex justify-center">
                <SkeletonNode />
              </div>
            </div>
          ))
          : levels.map((level, idx) => {
            const isLeft = idx % 2 === 0;
            const isCurrent = currentLevel?.id === level.id;
            const dc = DIFF_COLORS[level.difficulty];

            return (
              <div key={level.id} className="relative">
                {idx < levels.length - 1 && (
                  <div
                    className={`absolute -translate-x-1/2 translate-x-0 ${isLeft ? "left-[135px]" : "left-auto right-[135px]"} bottom-0 translate-y-full w-[1px] h-10 z-0`}
                    style={{
                      background: level.unlocked
                        ? "linear-gradient(to bottom, rgba(var(--accent-rgb),0.6), rgba(var(--accent-rgb),0.15))"
                        : "rgba(var(--accent-rgb),0.15)",
                    }}
                  />
                )}

                <div className={`flex mb-10 justify-center ${isLeft ? "justify-start" : "justify-end"} relative z-10`}>
                  <button
                    disabled={!level.unlocked}
                    onClick={() => level.unlocked && router.push(`/campaign/${level.id}`)}
                    className={`level-node w-[280px] max-w-none text-left p-5 rounded-xl border font-mono relative ${level.unlocked
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50 backdrop-blur-sm"
                      } ${isCurrent
                        ? "bg-accent/10 border-accent/60"
                        : level.completed
                          ? "bg-accent/[0.04] border-accent/20"
                          : level.unlocked
                            ? "bg-bg-primary border-accent/25 hover:bg-accent/[0.06] hover:border-accent/50"
                            : "bg-bg-primary border-accent/10"
                      }`}
                    style={
                      isCurrent
                        ? { animation: "pulse-glow 2s ease-in-out infinite" }
                        : level.completed
                          ? { boxShadow: "0 0 10px rgba(var(--accent-rgb),0.12)" }
                          : {}
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] tracking-[0.3em] text-accent/70">
                        LEVEL {String(level.id).padStart(2, "0")}
                      </span>
                      <span className="text-[14px]">
                        {!level.unlocked ? "🔒" : level.completed ? "✓" : isCurrent ? "▶" : "◉"}
                      </span>
                    </div>

                    <div
                      className={`text-[13px] font-black tracking-[0.18em] mb-2 leading-tight ${level.completed ? "text-accent/50" : "text-accent"
                        }`}
                      style={level.unlocked && !level.completed ? { textShadow: "0 0 8px rgba(var(--accent-rgb),0.5)" } : {}}
                    >
                      {level.name}
                    </div>

                    <p className="text-[10px] text-accent/35 tracking-[0.08em] mb-3 leading-relaxed">
                      {level.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold tracking-[0.22em] border rounded px-2 py-0.5 ${dc.text} ${dc.border}`}>
                        {level.difficulty}
                      </span>
                      <span className="text-[10px] text-accent/45 tracking-[0.1em]">
                        +{level.rewardRank} <span className="text-accent/25">RANK</span>
                      </span>
                    </div>

                    {isCurrent && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] text-accent bg-bg-primary px-2 py-0.5 border border-accent/40 rounded-full whitespace-nowrap">
                        CURRENT
                      </div>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {!loading && levels.every((l) => l.completed) && (
        <div className="mt-6 text-center p-8 border border-accent/20 rounded-xl bg-accent/5">
          <div className="text-3xl mb-3">🏆</div>
          <p className="text-accent font-black tracking-[0.2em] text-[13px]">CAMPAIGN COMPLETE</p>
          <p className="text-accent/70 text-[10px] mt-1 tracking-[0.1em]">All enemy units eliminated. You are the Overlord.</p>
        </div>
      )}
    </div>
  );
}
