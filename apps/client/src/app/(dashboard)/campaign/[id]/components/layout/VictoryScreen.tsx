"use client";

import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useSoundEffects } from "../../../../../../hooks/useSoundEffects";
import { useAuthState } from "../../../../../../hooks/useAuthState";

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
  if (index > stars) return "text-[rgba(var(--sem-success-rgb),0.15)]";
  if (stars === 1) return "text-[rgba(var(--sem-success-rgb),0.45)]";
  if (stars === 2) return "text-[rgba(var(--sem-success-rgb),0.7)]";
  return "text-[var(--sem-success)]";
}

export function VictoryScreen({ reward, stars, levelTitle, isMobile, onNextLevel, onReplay, onBack }: VictoryScreenProps) {
  const { playVictory } = useSoundEffects();
  const { isGuest } = useAuthState();
  const [displayReward, setDisplayReward] = useState(0);

  useEffect(() => {
    playVictory();
  }, [playVictory]);

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
    <div className={`${isMobile ? "w-full max-w-[95%] rounded-2xl p-6" : "w-full max-w-[460px] rounded-2xl p-10"} border border-[rgba(var(--sem-success-rgb),0.4)] bg-bg-primary text-center font-mono shadow-[0_0_64px_rgba(var(--sem-success-rgb),0.24)]`}>
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
          0%, 100% { filter: drop-shadow(0 0 8px rgba(var(--sem-success-rgb),0.55)); }
          50% { filter: drop-shadow(0 0 18px rgba(var(--sem-success-rgb),0.95)); }
        }
      `}</style>
      <p className="mb-2 text-[9px] font-black tracking-[0.32em] text-[rgba(var(--sem-success-rgb),0.45)] uppercase">{levelTitle}</p>
      <h2 className="mb-5 text-[18px] font-black tracking-[0.24em] text-[var(--sem-success)] drop-shadow-[0_0_12px_rgba(var(--sem-success-rgb),0.85)] uppercase">
        LEVEL COMPLETED
      </h2>
      <div className="mb-6 flex justify-center gap-3" role="img" aria-label={`${stars} stars earned`}>
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
                animation: isEarned
                  ? `victoryStarReveal 0.35s ease ${index * 0.14}s both, victoryStarPulse 0.42s ease ${0.35 + index * 0.14}s both${stars === FULL_GLOW_STARS ? `, victoryStarShimmer 1.4s ease-in-out ${0.8 + index * 0.14}s infinite` : ""}`
                  : "none",
              }}
            />
          );
        })}
      </div>
      {stars === FULL_GLOW_STARS && (
        <div className="mx-auto mb-5 w-max rounded-full border border-[rgba(var(--sem-success-rgb),0.35)] bg-[rgba(var(--sem-success-rgb),0.1)] px-4 py-1.5 text-[9px] font-black tracking-[0.22em] text-[var(--sem-success)] uppercase">
          PERFECT SCORE
        </div>
      )}
      <div className="mx-auto mb-7 w-max rounded-lg border border-[rgba(var(--sem-success-rgb),0.2)] bg-[rgba(var(--sem-success-rgb),0.05)] px-7 py-3">
        <span className="mb-1 block text-[9px] font-black tracking-[0.22em] text-[rgba(var(--sem-success-rgb),0.6)] uppercase">REWARD POINTS</span>
        <span className="text-[24px] font-black tracking-[0.08em] text-[var(--sem-success)] drop-shadow-[0_0_10px_rgba(var(--sem-success-rgb),0.75)]">+{displayReward}</span>
      </div>

      {isGuest && (
        <div className="mx-auto mb-6 max-w-[90%] text-[10px] font-bold tracking-[0.15em] text-[var(--sem-success)]/80 leading-relaxed uppercase border border-[var(--sem-success)]/20 bg-[var(--sem-success)]/10 p-3 rounded-lg">
          Excellent work! To save your progress and continue to the next mission, you must create a free account.
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button type="button" onClick={onNextLevel} className="cursor-pointer h-[44px] rounded-lg border border-[rgba(var(--sem-success-rgb),0.5)] bg-[rgba(var(--sem-success-rgb),0.1)] text-[10px] font-black tracking-[0.24em] text-[var(--sem-success)] uppercase transition-colors hover:bg-[rgba(var(--sem-success-rgb),0.2)]">
          NEXT LEVEL
        </button>
        <button type="button" onClick={onReplay} className="cursor-pointer h-[44px] rounded-lg border border-[rgba(var(--sem-success-rgb),0.25)] bg-[rgba(var(--sem-success-rgb),0.05)] text-[10px] font-black tracking-[0.22em] text-[rgba(var(--sem-success-rgb),0.75)] uppercase transition-colors hover:bg-[rgba(var(--sem-success-rgb),0.1)]">
          RETRY
        </button>
        <button type="button" onClick={onBack} className="cursor-pointer h-[44px] rounded-lg border border-transparent bg-transparent text-[10px] font-black tracking-[0.22em] text-[rgba(var(--sem-success-rgb),0.45)] uppercase transition-colors hover:text-[rgba(var(--sem-success-rgb),0.7)]">
          BACK TO MAP
        </button>
      </div>
    </div>
  );
}
