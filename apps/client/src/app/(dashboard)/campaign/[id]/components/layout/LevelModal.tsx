import React, { useEffect } from 'react';
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LevelDetail, ModalState } from '../../types';
import { VictoryScreen } from './VictoryScreen';
import { DefeatScreen } from './DefeatScreen';
import { DrawScreen } from './DrawScreen';

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

  useEffect(() => {
    if (!isResultModal) return;

    const handler = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setModal("idle");
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isResultModal, setModal]);

  if (!isResultModal) return null;

  const handleBack = (): void => router.push("/campaign");
  const handleReplay = (): void => setModal("idle");
  const handleHint = (): void => window.alert(level.hint);

  return (
    <div className={`fixed inset-0 z-50 flex bg-bg-primary/75 backdrop-blur-sm ${isMobile ? "items-stretch justify-center p-0" : "items-center justify-center px-4"}`} role="dialog" aria-modal="true">
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
    </div>
  );
}
