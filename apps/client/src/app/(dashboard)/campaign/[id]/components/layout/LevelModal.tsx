import React, { useEffect, useState } from 'react';
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LevelDetail, ModalState } from '../../types';
import { VictoryScreen } from './VictoryScreen';
import { DefeatScreen } from './DefeatScreen';
import { DrawScreen } from './DrawScreen';
import { Lightbulb } from 'lucide-react';

interface LevelModalProps {
  modal: ModalState;
  setModal: (v: ModalState) => void;
  reward: number;
  stars: number;
  level: LevelDetail;
  isMobile: boolean;
  router: AppRouterInstance;
}

export function LevelModal({ modal, setModal, reward, stars, level, isMobile, router }: LevelModalProps) {
  const isResultModal = modal === "victory" || modal === "defeat" || modal === "draw";
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!isResultModal) return;

    const handler = (event: KeyboardEvent): void => {
      if (showHint && event.key === "Escape") {
        setShowHint(false);
        return;
      }
      if (event.key === "Escape") setModal("idle");
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isResultModal, setModal, showHint]);

  if (!isResultModal) return null;

  const handleBack = (): void => router.push("/campaign");
  const handleReplay = (): void => setModal("idle");
  const handleHint = (): void => setShowHint(true);

  return (
    <div className={`fixed inset-0 z-[120] flex bg-bg-primary/85 backdrop-blur-md items-center justify-center ${isMobile ? "p-4" : "px-4"}`} role="dialog" aria-modal="true">
      {modal === "victory" && (
        <VictoryScreen
          reward={reward}
          stars={stars}
          levelTitle={level.title}
          isMobile={isMobile}
          onNextLevel={handleBack}
          onReplay={handleReplay}
          onBack={handleBack}
        />
      )}
      {modal === "defeat" && (
        <DefeatScreen
          levelTitle={level.title}
          isMobile={isMobile}
          onRetry={handleReplay}
          onHint={handleHint}
          onBack={handleBack}
        />
      )}
      {modal === "draw" && (
        <DrawScreen
          levelTitle={level.title}
          isMobile={isMobile}
          onRetry={handleReplay}
          onBack={handleBack}
        />
      )}

      {showHint && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-bg-primary/90 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[400px] rounded-xl border border-accent/30 bg-bg-primary p-8 shadow-[0_0_40px_rgba(var(--accent-rgb),0.15)] animate-[fadeIn_0.2s_ease-out]">
            <div className="mb-4 flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-accent" />
              <h3 className="text-[14px] font-black tracking-[0.2em] text-accent uppercase">TACTICAL INTEL</h3>
            </div>
            <p className="mb-8 text-[11px] font-bold tracking-[0.1em] text-accent/70 leading-relaxed uppercase">
              {level.hints && level.hints.length > 0 ? level.hints[0] : "No intel available for this mission."}
            </p>
            <button
              type="button"
              onClick={() => setShowHint(false)}
              className="w-full h-[44px] rounded-lg border border-accent/40 bg-accent/10 text-[10px] font-black tracking-[0.2em] text-accent uppercase transition-colors hover:bg-accent/20"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
