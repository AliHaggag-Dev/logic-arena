import React, { useEffect, useRef } from "react";

interface ChallengeModalProps {
  challenge: {
    challengerId: string;
    challengerName: string;
  };
  onAccept: (id: string) => void;
  onDecline: () => void;
}

export function ChallengeModal({ challenge, onAccept, onDecline }: ChallengeModalProps) {
  const acceptButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    acceptButtonRef.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDecline();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previousFocusRef.current?.focus();
    };
  }, [onDecline]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-card/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="challenge-modal-title">
      <div
        className="border border-accent/30 bg-bg-primary rounded-xl p-8 max-w-sm w-full mx-4 font-mono"
        style={{
          boxShadow: "0 0 40px rgba(var(--accent-rgb),0.15)",
          animation: "modalIn 0.2s ease",
        }}
      >
        <p className="text-[9px] tracking-[0.28em] text-accent/35 mb-2">
          // INCOMING_TRANSMISSION
        </p>
        <h2 id="challenge-modal-title" className="text-accent font-black tracking-[0.18em] text-xl mb-2">
          COMBAT REQUEST
        </h2>
        <p className="text-accent/60 text-[11px] tracking-[0.12em] mb-6">
          <span className="text-accent">{challenge.challengerName}</span>
          {" "}challenges you to combat.
        </p>
        <div className="flex gap-3">
          <button
            ref={acceptButtonRef}
            onClick={() => onAccept(challenge.challengerId)}
            className="flex-1 py-2 text-[11px] tracking-[0.18em] font-bold border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-all"
          >
            ACCEPT
          </button>
          <button
            onClick={onDecline}
            className="flex-1 py-2 text-[11px] tracking-[0.18em] font-bold border border-red-500/30 bg-red-500/5 text-red-500/70 hover:bg-red-500/15 rounded-lg transition-all"
          >
            DECLINE
          </button>
        </div>
      </div>
    </div>
  );
}
