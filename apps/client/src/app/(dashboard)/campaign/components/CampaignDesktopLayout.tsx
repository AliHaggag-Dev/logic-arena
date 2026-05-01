import React from "react";
import { Lock, Check, Play, Hexagon, Trophy } from 'lucide-react';
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LevelInfo } from "../types";
import { DIFFICULTY_CONFIG } from "../constants/difficulty.constants";
import { SkeletonNode } from "./CampaignSkeletons";

interface CampaignDesktopLayoutProps {
  levels: LevelInfo[];
  loading: boolean;
  currentLevel: LevelInfo | undefined;
  router: AppRouterInstance;
  isGuest?: boolean;
}

export const CAMPAIGN_LEVEL_COUNT = 10;

export function CampaignDesktopLayout({ levels, loading, currentLevel, router, isGuest }: CampaignDesktopLayoutProps) {
  const completedCount = React.useMemo(() => levels.filter((l) => l.completed).length, [levels]);
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
                style={{ width: `${(completedCount / CAMPAIGN_LEVEL_COUNT) * 100}%`, boxShadow: "0 0 8px rgba(var(--accent-rgb),0.6)" }}
              />
            </div>
            <span className="text-[10px] tracking-[0.1em] text-accent/60 font-bold">
              {completedCount}/{CAMPAIGN_LEVEL_COUNT}
            </span>
          </div>
        )}
      </div>

      {/* Level Map */}
      <div className="flex flex-col gap-0">
        {loading
          ? Array.from({ length: CAMPAIGN_LEVEL_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`flex mb-10 justify-center ${i % 2 === 0 ? "justify-start" : "justify-end"} relative`}
            >
              {i < CAMPAIGN_LEVEL_COUNT - 1 && (
                <div className={`absolute -translate-x-1/2 translate-x-0 ${i % 2 === 0 ? "left-[140px]" : "left-auto right-[140px]"} bottom-0 translate-y-full w-[1px] h-10 z-0 bg-accent/10`} />
              )}
              <div className="relative z-10 w-auto flex justify-center">
                <SkeletonNode />
              </div>
            </div>
          ))
          : levels.length === 0 && isGuest ? (
            <div className="text-center py-20 border border-dashed border-accent/20 rounded-2xl bg-accent/[0.02]">
              <Lock className="w-10 h-10 mx-auto mb-4 text-accent/60 opacity-50" />
              <h3 className="text-accent font-black tracking-widest text-lg mb-2 uppercase">Account Required</h3>
              <p className="text-accent/40 text-xs tracking-wide max-w-[400px] mx-auto uppercase">
                You must log in to access the campaign and track your progress.
              </p>
            </div>
          ) : levels.map((level, idx) => {
            const isLeft = idx % 2 === 0;
            const isCurrent = !isGuest && currentLevel?.id === level.id;
            const dc = DIFFICULTY_CONFIG[level.difficulty];
            return (
              <div key={level.id} className="relative">
                {idx < levels.length - 1 && (
                  <div
                    className={`absolute -translate-x-1/2 translate-x-0 ${isLeft ? "left-[140px]" : "left-auto right-[140px]"} bottom-0 translate-y-full w-[1px] h-10 z-0`}
                    style={{
                      background: level.unlocked && !isGuest
                        ? "linear-gradient(to bottom, rgba(var(--accent-rgb),0.6), rgba(var(--accent-rgb),0.15))"
                        : "rgba(var(--accent-rgb),0.15)",
                    }}
                  />
                )}

                <div className={`flex mb-10 justify-center ${isLeft ? "justify-start" : "justify-end"} relative z-10`}>
                  <button
                    type="button"
                    disabled={!level.unlocked || isGuest}
                    onClick={() => level.unlocked && !isGuest && router.push(`/campaign/${level.id}`)}
                    className={`level-node w-[280px] max-w-none text-left p-5 rounded-xl border font-mono relative ${level.unlocked && !isGuest
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50 backdrop-blur-sm"
                      } ${isCurrent
                        ? "bg-accent/10 border-accent/60"
                        : level.completed
                          ? "bg-accent/[0.04] border-accent/20"
                          : level.unlocked && !isGuest
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
                      <span className="text-[14px] flex items-center justify-center">
                        {(!level.unlocked || isGuest) ? <Lock className="w-3.5 h-3.5 text-accent/30" /> : level.completed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : isCurrent ? <Play className="w-3.5 h-3.5 text-accent animate-pulse" /> : <Hexagon className="w-3.5 h-3.5 text-accent/50" />}
                      </span>
                    </div>

                    <div
                      className={`text-[13px] font-black tracking-[0.18em] mb-2 leading-tight ${level.completed ? "text-accent/50" : "text-accent"
                        }`}
                      style={level.unlocked && !level.completed && !isGuest ? { textShadow: "0 0 8px rgba(var(--accent-rgb),0.5)" } : {}}
                    >
                      {level.name}
                      {level.completed && <span className="block text-[8px] text-accent/30 mt-1 uppercase tracking-[0.2em] font-bold">REPLAY (NO REWARD)</span>}
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

      {!loading && !isGuest && levels.length > 0 && completedCount === CAMPAIGN_LEVEL_COUNT && (
        <div className="mt-6 text-center p-8 border border-accent/20 rounded-xl bg-accent/5">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto" />
          <p className="text-accent font-black tracking-[0.2em] text-[13px]">CAMPAIGN COMPLETE</p>
          <p className="text-accent/70 text-[10px] mt-1 tracking-[0.1em]">All enemy bots defeated.</p>
        </div>
      )}
    </div>
  );
}
