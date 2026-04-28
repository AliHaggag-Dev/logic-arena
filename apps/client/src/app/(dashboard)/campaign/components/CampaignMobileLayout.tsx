import React from "react";
import { LevelInfo, DIFF_COLORS } from "../types";
import { MobileSkeletonNode } from "./CampaignSkeletons";

interface CampaignMobileLayoutProps {
  levels: LevelInfo[];
  loading: boolean;
  currentLevel: LevelInfo | undefined;
  router: any;
  isGuest?: boolean;
}

export function CampaignMobileLayout({ levels, loading, currentLevel, router, isGuest }: CampaignMobileLayoutProps) {
  return (
    <div className="w-full px-4 pt-4 pb-[env(safe-area-inset-bottom)] relative z-10 animate-[fadeIn_0.35s_ease]">
      {/* Header */}
      <div className="border-b border-accent/20 pb-5 mb-8 text-center pt-2">
        <h1 className="m-0 text-3xl font-black tracking-[0.22em] text-accent drop-shadow-[0_0_14px_rgba(var(--accent-rgb),0.9)] leading-tight break-words">
          CAMPAIGN
        </h1>
        <p className="mt-2 text-[10px] text-accent/35 tracking-[0.15em] max-w-[250px] mx-auto">
          Defeat all 10 enemy bots.
        </p>
        
        {/* Progress bar */}
        {!loading && (
          <div className="mt-5 flex items-center justify-center gap-4 w-full">
            <div className="w-[60%] h-[3px] bg-accent/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700"
                style={{ width: `${(levels.filter((l) => l.completed).length / 10) * 100}%`, boxShadow: "0 0 8px rgba(var(--accent-rgb),0.6)" }}
              />
            </div>
            <span className="text-[10px] tracking-[0.1em] text-accent/60 font-bold shrink-0">
              {levels.filter((l) => l.completed).length}/10
            </span>
          </div>
        )}
      </div>

      {/* Target Spine */}
      <div className="flex flex-col items-center gap-0 w-full relative">
        {loading ? (
            Array.from({ length: 5 }).map((_, i) => <MobileSkeletonNode key={i} />)
        ) : levels.length === 0 && isGuest ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card/20 border-2 border-dashed border-accent/10 rounded-2xl text-center gap-4 w-full">
                    <div className="text-4xl opacity-30">🔒</div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-accent font-bold tracking-widest text-xs uppercase">ACCESS RESTRICTED</h3>
                        <p className="text-[9px] text-accent/40 uppercase tracking-widest">Log in to start the campaign</p>
                    </div>
                </div>
            ) : levels.map((level, idx) => {
              const isCurrent = !isGuest && currentLevel?.id === level.id;
              const dc = DIFF_COLORS[level.difficulty];
              const lockedByGuest = isGuest;

              return (
                <div key={level.id} className="relative flex flex-col items-center w-full mb-[50px]">
                  {/* Vertical line connecting up */}
                  {idx > 0 && (
                      <div className="absolute top-0 -translate-y-full w-[2px] h-[50px] bg-accent/10" 
                        style={{
                          background: level.unlocked && !lockedByGuest
                            ? "linear-gradient(to bottom, rgba(var(--accent-rgb),0.5), rgba(var(--accent-rgb),0.15))"
                            : "rgba(var(--accent-rgb),0.10)",
                        }} />
                  )}

                  {/* Node */}
                  <button 
                    type="button"
                    aria-label="Join campaign"
                    disabled={!level.unlocked || lockedByGuest}
                    onClick={() => level.unlocked && !lockedByGuest && router.push(`/campaign/${level.id}`)}
                    className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border-[2.5px] transition-transform active:scale-95 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${
                      level.unlocked && !lockedByGuest ? "" : "opacity-30 backdrop-blur-sm"
                    } ${
                      isCurrent ? "bg-accent/20 border-accent text-accent glow-node animate-[pulse-glow_2s_ease-in-out_infinite]" 
                      : level.completed ? "bg-accent/5 border-accent/40 text-accent/60"
                      : level.unlocked && !lockedByGuest ? "bg-bg-primary border-accent/50 text-accent/90" 
                      : "bg-bg-primary border-accent/20 text-accent/30"
                    }`}
                  >
                      <span className={`font-black text-sm tracking-widest ${(level.unlocked && !lockedByGuest) ? '' : 'text-transparent text-shadow-none'}`}>
                        {level.completed ? "✓" : String(level.id).padStart(2, "0")}
                      </span>
                      {(!level.unlocked || lockedByGuest) && <span className="absolute text-[15px]">🔒</span>}
                  </button>

                  {/* Info Panel Below */}
                  <div className="flex flex-col items-center mt-3 w-[85%] max-w-[280px] bg-card/40 border border-accent/10 rounded-lg p-3 text-center transition-all">
                      <div className={`text-[12px] font-black tracking-[0.15em] leading-tight mb-2 ${level.completed ? "text-accent/50" : "text-accent"}`}>
                        {level.name}
                      </div>
                      
                      <div className="flex items-center gap-3 w-full justify-center">
                          <span className={`text-[8px] font-bold tracking-[0.2em] border rounded px-1.5 py-0.5 ${dc.text} ${dc.border}`}>
                              {level.difficulty}
                          </span>
                          <span className="text-[9px] text-accent/45 font-bold tracking-widest">+{level.rewardRank} PTS</span>
                      </div>
                  </div>
                </div>
              )
            })
        }
      </div>
      
      {!loading && !isGuest && levels.length > 0 && levels.every((l) => l.completed) && (
        <div className="mt-8 text-center p-6 border border-accent/20 rounded-xl bg-accent/5">
          <div className="text-3xl mb-3">🏆</div>
          <p className="text-accent font-black tracking-[0.2em] text-[12px] uppercase">Campaign Complete</p>
          <p className="text-accent/50 text-[9px] mt-1 tracking-[0.1em] uppercase">All enemy bots defeated.</p>
        </div>
      )}
    </div>
  );
}
