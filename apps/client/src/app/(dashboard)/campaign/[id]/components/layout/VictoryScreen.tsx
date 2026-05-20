"use client";

import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";

const STAR_COUNT = 3;
const COUNT_STEPS = 24;
const COUNT_INTERVAL_MS = 28;
const FULL_GLOW_STARS = 3;

interface VictoryScreenProps {
  reward: number;
  stars: number;
  levelTitle: string;
  isMobile: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onBack: () => void;
}

function getStarClass(stars: number, index: number): string {
  if (index > stars) return "text-accent/15";
  if (stars === 1) return "text-accent/45";
  if (stars === 2) return "text-accent/70";
  return "text-accent";
}

export function VictoryScreen({ reward, stars, levelTitle, isMobile, onNextLevel, onReplay, onBack }: VictoryScreenProps) {
  const [displayReward, setDisplayReward] = useState(0);

  useEffect(() => {
    if (reward <= 0) {
      setDisplayReward(0);
      return;
    }

    let currentStep = 0;
    const interval = window.setInterval(() => {
      currentStep++;
      setDisplayReward(Math.round((reward * currentStep) / COUNT_STEPS));
      if (currentStep >= COUNT_STEPS) {
        window.clearInterval(interval);
      }
    }, COUNT_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [reward]);

  return (
    <div className={`${isMobile ? "min-h-screen w-full rounded-none px-5 py-10" : "w-full max-w-[460px] rounded-2xl p-10"} border border-accent/40 bg-bg-primary text-center font-mono shadow-[0_0_64px_rgba(var(--accent-rgb),0.24)]`}>
      <style>{`
        @keyframes victoryStarReveal {
          from { opacity: 0; transform: scale(0.35) rotate(-16deg); }
          to { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes victoryStarPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes victoryStarShimmer {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(var(--accent-rgb),0.55)); }
          50% { filter: drop-shadow(0 0 18px rgba(var(--accent-rgb),0.95)); }
        }
      `}</style>
      <p className="mb-2 text-[9px] font-black tracking-[0.32em] text-accent/45 uppercase">{levelTitle}</p>
      <h2 className="mb-5 text-[18px] font-black tracking-[0.24em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.85)] uppercase">
        MISSION COMPLETE
      </h2>
      <div className="mb-6 flex justify-center gap-3" aria-label={`${stars} stars earned`}>
        {Array.from({ length: STAR_COUNT }, (_, index) => {
          const starNumber = index + 1;
          const isEarned = starNumber <= stars;
          return (
            <Star
              key={starNumber}
              className={`h-11 w-11 ${getStarClass(stars, starNumber)}`}
              fill="currentColor"
              aria-hidden="true"
              style={{
                animation: `${isEarned ? "victoryStarReveal 0.35s ease both, victoryStarPulse 0.42s ease 0.35s both" : "none"}${stars === FULL_GLOW_STARS && isEarned ? ", victoryStarShimmer 1.4s ease-in-out 0.8s infinite" : ""}`,
                animationDelay: `${index * 140}ms`,
              }}
            />
          );
        })}
      </div>
      {stars === FULL_GLOW_STARS && (
        <div className="mx-auto mb-5 w-max rounded-full border border-accent/35 bg-accent/10 px-4 py-1.5 text-[9px] font-black tracking-[0.22em] text-accent uppercase">
          +50% STAR BONUS
        </div>
      )}
      <div className="mx-auto mb-7 w-max rounded-lg border border-accent/20 bg-accent/5 px-7 py-3">
        <span className="mb-1 block text-[9px] font-black tracking-[0.22em] text-accent/60 uppercase">POINTS EARNED</span>
        <span className="text-[24px] font-black tracking-[0.08em] text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.75)]">+{displayReward}</span>
      </div>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onNextLevel} className="h-[44px] rounded-lg border border-accent/50 bg-accent/10 text-[10px] font-black tracking-[0.24em] text-accent uppercase transition-colors hover:bg-accent/20">
          NEXT MISSION
        </button>
        <button type="button" onClick={onReplay} className="h-[44px] rounded-lg border border-accent/25 bg-accent/5 text-[10px] font-black tracking-[0.22em] text-accent/75 uppercase transition-colors hover:bg-accent/10">
          REPLAY
        </button>
        <button type="button" onClick={onBack} className="h-[44px] rounded-lg border border-transparent bg-transparent text-[10px] font-black tracking-[0.22em] text-accent/45 uppercase transition-colors hover:text-accent/70">
          BACK
        </button>
      </div>
    </div>
  );
}
