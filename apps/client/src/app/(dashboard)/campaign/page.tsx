"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";

interface LevelInfo {
  id: number;
  name: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "ELITE";
  description: string;
  rewardRank: number;
  unlocked: boolean;
  completed: boolean;
}

const DIFF_COLORS: Record<string, { text: string; border: string; glow: string }> = {
  EASY: { text: "text-emerald-500", border: "border-emerald-500/30", glow: "rgba(16,185,129,0.6)" },
  MEDIUM: { text: "text-yellow-500", border: "border-yellow-500/30", glow: "rgba(234,179,8,0.6)" },
  HARD: { text: "text-orange-500", border: "border-orange-500/30", glow: "rgba(var(--color-orange-500),0.6)" },
  ELITE: { text: "text-red-500", border: "border-red-500/30", glow: "rgba(var(--color-red-500),0.6)" },
};

function SkeletonNode() {
  return (
    <div
      className="w-[270px] h-[120px] rounded-xl animate-[shimmer_1.5s_infinite]"
      style={{
        background: "linear-gradient(90deg, rgba(var(--accent-rgb),0.03) 0%, rgba(var(--accent-rgb),0.08) 50%, rgba(var(--accent-rgb),0.03) 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

export default function CampaignPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/campaign/levels")
      .then((r) => setLevels(r.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const currentLevel = levels.find((l) => l.unlocked && !l.completed);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(var(--accent-rgb),0.5), 0 0 30px rgba(var(--accent-rgb),0.2); }
          50%       { box-shadow: 0 0 24px rgba(var(--accent-rgb),0.9), 0 0 55px rgba(var(--accent-rgb),0.4); }
        }
        @keyframes dash-flow {
          to { stroke-dashoffset: -20; }
        }
        .level-node { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .level-node:hover { transform: translateY(-3px); }
      `}</style>

      <div className="min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
        {/* Grid bg */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="max-w-[860px] mx-auto px-6 pt-12 pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]">
          {/* Header */}
          <div className="border-b border-accent/10 pb-7 mb-12">
            <p className="text-[10px] tracking-[0.4em] text-accent/30 mb-2.5 uppercase">
              // NEURAL_COMBAT_TRAINING_SEQUENCE
            </p>
            <h1 className="m-0 text-[clamp(28px,5vw,46px)] font-black tracking-[0.22em] text-accent drop-shadow-[0_0_14px_rgba(var(--accent-rgb),0.9)] leading-none">
              CAMPAIGN_MODE
            </h1>
            <p className="mt-3 text-[11px] text-accent/35 tracking-[0.15em]">
              Defeat all 10 enemy bots to prove your AliScript mastery.
            </p>

            {/* Progress bar */}
            {!loading && (
              <div className="mt-5 flex items-center gap-4">
                <span className="text-[10px] tracking-[0.2em] text-accent/40">PROGRESS</span>
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
                  className={`flex mb-6 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                  <SkeletonNode />
                </div>
              ))
              : levels.map((level, idx) => {
                const isLeft = idx % 2 === 0;
                const isCurrent = currentLevel?.id === level.id;
                const dc = DIFF_COLORS[level.difficulty];

                return (
                  <div key={level.id} className="relative">
                    {/* Connector line */}
                    {idx < levels.length - 1 && (
                      <div
                        className={`absolute ${isLeft ? "left-[135px]" : "right-[135px]"} bottom-0 translate-y-full w-[1px] h-6 z-0`}
                        style={{
                          background: level.unlocked
                            ? "linear-gradient(to bottom, rgba(var(--accent-rgb),0.5), rgba(var(--accent-rgb),0.1))"
                            : "rgba(var(--accent-rgb),0.08)",
                        }}
                      />
                    )}

                    <div className={`flex mb-6 ${isLeft ? "justify-start" : "justify-end"} relative z-10`}>
                      <button
                        disabled={!level.unlocked}
                        onClick={() => level.unlocked && router.push(`/campaign/${level.id}`)}
                        className={`level-node w-[280px] text-left p-5 rounded-xl border font-mono relative ${level.unlocked
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-40"
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
                        {/* Level number + status */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] tracking-[0.3em] text-accent/40">
                            LEVEL {String(level.id).padStart(2, "0")}
                          </span>
                          <span className="text-[14px]">
                            {!level.unlocked ? "🔒" : level.completed ? "✓" : isCurrent ? "▶" : "◉"}
                          </span>
                        </div>

                        {/* Name */}
                        <div
                          className={`text-[13px] font-black tracking-[0.18em] mb-2 leading-tight ${level.completed ? "text-accent/50" : "text-accent"
                            }`}
                          style={level.unlocked && !level.completed ? { textShadow: "0 0 8px rgba(var(--accent-rgb),0.5)" } : {}}
                        >
                          {level.name}
                        </div>

                        {/* Description */}
                        <p className="text-[10px] text-accent/35 tracking-[0.08em] mb-3 leading-relaxed">
                          {level.description}
                        </p>

                        {/* Footer: difficulty + reward */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold tracking-[0.22em] border rounded px-2 py-0.5 ${dc.text} ${dc.border}`}>
                            {level.difficulty}
                          </span>
                          <span className="text-[10px] text-accent/45 tracking-[0.1em]">
                            +{level.rewardRank} <span className="text-accent/25">RANK</span>
                          </span>
                        </div>

                        {/* Current level indicator */}
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

          {/* All done */}
          {!loading && levels.every((l) => l.completed) && (
            <div className="mt-6 text-center p-8 border border-accent/20 rounded-xl bg-accent/5">
              <div className="text-3xl mb-3">🏆</div>
              <p className="text-accent font-black tracking-[0.2em] text-[13px]">CAMPAIGN COMPLETE</p>
              <p className="text-accent/40 text-[10px] mt-1 tracking-[0.1em]">All enemy units eliminated. You are the Overlord.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
