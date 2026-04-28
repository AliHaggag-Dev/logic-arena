import React from 'react';
import { ModalState } from '../types';

interface LevelModalProps {
  modal: ModalState;
  setModal: (v: ModalState) => void;
  reward: number;
  router: any;
}

export function LevelModal({ modal, setModal, reward, router }: LevelModalProps) {
  if (modal !== "victory" && modal !== "defeat") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div
        className={`rounded-2xl border p-6 sm:p-10 text-center max-w-[420px] w-full font-mono ${modal === "victory"
          ? "bg-bg-primary border-accent/40 shadow-[0_0_60px_rgba(var(--accent-rgb),0.25)]"
          : "bg-bg-primary border-red-500/30 shadow-[0_0_60px_rgba(var(--color-red-500),0.2)]"
          }`}
        style={{ animation: "modalIn 0.3s ease" }}
      >
        {modal === "victory" ? (
          <>
            <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">🏆</div>
            <h2 className="text-[16px] sm:text-[18px] font-black tracking-[0.25em] text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.8)] mb-2">
              MISSION COMPLETE
            </h2>
            <p className="text-accent/50 text-[9px] sm:text-[10px] tracking-[0.15em] mb-5 sm:mb-6">
              Enemy bot defeated.
            </p>
            <div className="inline-block border border-accent/20 rounded-lg px-6 py-3 bg-accent/5 mb-6 sm:mb-7">
              <span className="text-accent/70 text-[9px] sm:text-[10px] tracking-[0.2em] block mb-1">RANK EARNED</span>
              <span className="text-accent font-black text-[20px] sm:text-[22px] drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.7)]">+{reward}</span>
            </div>
            <button
              onClick={() => router.push("/campaign")}
              className="w-full h-[44px] sm:py-3 sm:h-auto rounded-lg text-[10px] font-black tracking-[0.25em] bg-accent/10 border border-accent/40 text-accent transition-transform active:scale-95 duration-150 uppercase"
            >
              CONTINUE
            </button>
          </>
        ) : (
          <>
            <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">💀</div>
            <h2 className="text-[16px] sm:text-[18px] font-black tracking-[0.25em] text-red-500 drop-shadow-[0_0_10px_rgba(var(--color-red-500),0.8)] mb-2">
              ROBOT DESTROYED
            </h2>
            <p className="text-red-500/50 text-[9px] sm:text-[10px] tracking-[0.15em] mb-6 sm:mb-7">
              Recalibrate your tactics and retry.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setModal("idle")}
                className="w-full h-[44px] sm:flex-1 sm:py-3 sm:h-auto rounded-lg text-[10px] font-black tracking-[0.2em] bg-accent/10 border border-accent/30 text-accent/70 transition-transform active:scale-95 duration-150 uppercase"
              >
                RETRY
              </button>
              <button
                onClick={() => router.push("/campaign")}
                className="w-full h-[44px] sm:flex-1 sm:py-3 sm:h-auto rounded-lg text-[10px] font-black tracking-[0.2em] bg-red-500/10 border border-red-500/30 text-red-500/70 transition-transform active:scale-95 duration-150 uppercase"
              >
                RETREAT
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
