"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lightbulb, Lock } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

const HINT_COSTS: Record<1 | 2, number> = { 1: 10, 2: 25 };
const TYPEWRITER_SPEED_MS = 18;
const PRIMARY_HAPTIC_MS = 50;

// ── Types ──────────────────────────────────────────────────────────────────────

interface HintPanelProps {
  hints: string[];
  revealedCount: number;
  conceptTaught: string;
  onReveal: (index: number) => Promise<void>;
  isMobile: boolean;
  isRevealing: boolean;
}

type ConfirmState = "idle" | "confirming" | "loading" | "error";

// ── Typewriter hook ────────────────────────────────────────────────────────────

function useTypewriter(text: string, active: boolean): string {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, TYPEWRITER_SPEED_MS);
    return () => clearInterval(interval);
  }, [text, active]);

  return displayed;
}

// ── Sub-component: revealed hint card ─────────────────────────────────────────

interface RevealedHintCardProps {
  index: number;
  text: string;
  animate: boolean;
}

function RevealedHintCard({ index, text, animate }: RevealedHintCardProps) {
  const displayed = useTypewriter(text, animate);

  return (
    <div
      className="hint-card hint-card--revealed"
      style={{
        animation: animate ? "hintReveal 0.4s ease forwards" : undefined,
      }}
    >
      <div className="hint-card__badge">
        <Lightbulb size={14} className="mr-1 inline-block" /> HINT {index + 1}
        {index > 0 && (
          <span className="hint-card__cost-badge">
            -{HINT_COSTS[index as 1 | 2]} PTS
          </span>
        )}
      </div>
      <p className="hint-card__text">{displayed}</p>
    </div>
  );
}

// ── Sub-component: locked hint slot ───────────────────────────────────────────

interface LockedHintSlotProps {
  index: 1 | 2;
  onReveal: (index: number) => Promise<void>;
  isRevealing: boolean;
  isGloballyRevealing: boolean;
}

function LockedHintSlot({ index, onReveal, isGloballyRevealing }: LockedHintSlotProps) {
  const [confirm, setConfirm] = useState<ConfirmState>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const cost = HINT_COSTS[index];

  async function handleConfirm() {
    navigator.vibrate?.(PRIMARY_HAPTIC_MS);
    setConfirm("loading");
    setErrMsg(null);
    try {
      await onReveal(index);
    } catch (e: any) {
      if (e.response?.status === 402) {
        setErrMsg("INSUFFICIENT POINTS");
      } else {
        setErrMsg("ERROR PURCHASING HINT");
      }
      setConfirm("error");
      setTimeout(() => {
        setConfirm("idle");
        setErrMsg(null);
      }, 2500);
    }
  }

  if (confirm === "idle") {
    return (
      <button
        type="button"
        className="hint-slot hint-slot--locked"
        onClick={() => {
          setConfirm("confirming");
        }}
        disabled={isGloballyRevealing}
        aria-label={`Reveal hint ${index + 1} for ${cost} points`}
      >
        <span className="hint-slot__icon"><Lock size={14} /></span>
        <span className="hint-slot__label">HINT {index + 1}</span>
        <span className="hint-slot__action">DECRYPT [{cost} PTS]</span>
      </button>
    );
  }

  if (confirm === "confirming") {
    return (
      <div className="hint-slot hint-slot--confirming" role="group" aria-label={`Confirm reveal hint ${index + 1}`}>
        <span className="hint-slot__confirm-text">
          Spend <strong>{cost} pts</strong> to reveal hint {index + 1}?
        </span>
        <div className="hint-slot__confirm-actions">
          <button
            type="button"
            className="hint-slot__confirm-btn hint-slot__confirm-btn--yes"
            onClick={handleConfirm}
            aria-label={`Confirm spend ${cost} points`}
          >
            CONFIRM
          </button>
          <button
            type="button"
            className="hint-slot__confirm-btn hint-slot__confirm-btn--no"
            onClick={() => {
              setConfirm("idle");
            }}
            aria-label="Cancel hint reveal"
          >
            CANCEL
          </button>
        </div>
      </div>
    );
  }

  if (confirm === "error") {
    return (
      <div className="hint-slot hint-slot--error" role="alert">
        <span className="hint-slot__error-icon" aria-hidden="true">⚠</span>
        <span className="hint-slot__error-text">{errMsg}</span>
      </div>
    );
  }

  return (
    <div className="hint-slot hint-slot--loading" aria-busy="true">
      <span className="hint-slot__spinner" aria-hidden="true" />
      <span className="hint-slot__label">DECRYPTING...</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HintPanel({
  hints,
  revealedCount,
  conceptTaught,
  onReveal,
  isMobile,
  isRevealing,
}: HintPanelProps) {
  // Track which hints were just newly revealed (to animate only those)
  const prevCountRef = useRef(revealedCount);
  const [animateIndex, setAnimateIndex] = useState<number | null>(null);

  useEffect(() => {
    if (revealedCount > prevCountRef.current) {
      setAnimateIndex(revealedCount); // the index of the newly revealed hint (1 or 2)
      prevCountRef.current = revealedCount;
      const timer = setTimeout(() => setAnimateIndex(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [revealedCount]);

  const safeHints = hints.length >= 3 ? hints : [...hints, "", ""];

  return (
    <div className={`hint-panel${isMobile ? " hint-panel--mobile" : ""}`}>
      <style>{`
        @keyframes hintReveal {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hint-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hint-panel__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .hint-panel__label {
          font-size: 9px;
          letter-spacing: 0.3em;
          color: rgba(var(--accent-rgb), 0.35);
          text-transform: uppercase;
        }

        .hint-panel__concept {
          font-size: 8px;
          letter-spacing: 0.15em;
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid rgba(var(--accent-rgb), 0.2);
          background: rgba(var(--accent-rgb), 0.06);
          color: rgba(var(--accent-rgb), 0.6);
          text-transform: uppercase;
          white-space: nowrap;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hint-card {
          border: 1px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 10px;
          padding: 10px 12px;
          min-height: 48px;
          background: rgba(var(--accent-rgb), 0.04);
        }

        .hint-card__badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 8px;
          letter-spacing: 0.25em;
          font-weight: 900;
          color: rgba(var(--accent-rgb), 0.5);
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .hint-card__cost-badge {
          font-size: 7px;
          padding: 1px 5px;
          border-radius: 3px;
          background: rgba(var(--accent-rgb), 0.08);
          border: 1px solid rgba(var(--accent-rgb), 0.15);
          letter-spacing: 0.1em;
          color: rgba(var(--accent-rgb), 0.4);
        }

        .hint-card__text {
          margin: 0;
          font-size: 10px;
          line-height: 1.65;
          letter-spacing: 0.05em;
          color: rgba(var(--accent-rgb), 0.75);
        }

        .hint-slot {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1px dashed rgba(var(--accent-rgb), 0.15);
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          width: 100%;
          transition: border-color 0.2s ease, background 0.2s ease;
          text-align: left;
        }

        .hint-slot:hover:not(:disabled) {
          border-color: rgba(var(--accent-rgb), 0.35);
          background: rgba(var(--accent-rgb), 0.04);
        }

        .hint-slot:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hint-slot__icon {
          font-size: 12px;
          flex-shrink: 0;
        }

        .hint-slot__label {
          font-size: 9px;
          letter-spacing: 0.25em;
          color: rgba(var(--accent-rgb), 0.4);
          text-transform: uppercase;
          flex: 1;
        }

        .hint-slot__action {
          font-size: 8px;
          letter-spacing: 0.15em;
          font-weight: 900;
          color: rgba(var(--accent-rgb), 0.5);
          text-transform: uppercase;
          border: 1px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 4px;
          padding: 2px 7px;
          flex-shrink: 0;
          transition: border-color 0.2s, color 0.2s;
        }

        .hint-slot:hover:not(:disabled) .hint-slot__action {
          border-color: rgba(var(--accent-rgb), 0.45);
          color: rgba(var(--accent-rgb), 0.8);
        }

        .hint-slot--confirming {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          cursor: default;
          border-color: rgba(var(--accent-rgb), 0.3);
          background: rgba(var(--accent-rgb), 0.04);
        }

        .hint-slot__confirm-text {
          font-size: 10px;
          letter-spacing: 0.05em;
          color: rgba(var(--accent-rgb), 0.7);
        }

        .hint-slot__confirm-text strong {
          color: rgba(var(--accent-rgb), 0.9);
          font-weight: 900;
        }

        .hint-slot__confirm-actions {
          display: flex;
          gap: 8px;
        }

        .hint-slot__confirm-btn {
          font-size: 9px;
          letter-spacing: 0.2em;
          font-weight: 900;
          text-transform: uppercase;
          padding: 4px 12px;
          min-height: 48px;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .hint-slot__confirm-btn--yes {
          background: rgba(var(--accent-rgb), 0.15);
          border: 1px solid rgba(var(--accent-rgb), 0.4);
          color: rgba(var(--accent-rgb), 0.9);
        }

        .hint-slot__confirm-btn--yes:hover {
          background: rgba(var(--accent-rgb), 0.25);
        }

        .hint-slot__confirm-btn--no {
          background: transparent;
          border: 1px solid rgba(var(--accent-rgb), 0.15);
          color: rgba(var(--accent-rgb), 0.4);
        }

        .hint-slot__confirm-btn--no:hover {
          border-color: rgba(var(--accent-rgb), 0.3);
          color: rgba(var(--accent-rgb), 0.6);
        }

        .hint-slot--loading {
          cursor: default;
          opacity: 0.7;
        }

        .hint-slot__spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(var(--accent-rgb), 0.2);
          border-top-color: rgba(var(--accent-rgb), 0.7);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .hint-slot--error {
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.08);
          cursor: default;
          justify-content: center;
          animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }

        .hint-slot__error-icon {
          font-size: 11px;
          color: #ef4444;
        }

        .hint-slot__error-text {
          font-size: 9px;
          letter-spacing: 0.2em;
          font-weight: 900;
          color: #ef4444;
          text-transform: uppercase;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
          40%, 60% { transform: translate3d(2px, 0, 0); }
        }
      `}</style>

      <div className="hint-panel__header">
        <p className="hint-panel__label">{"// "}FIELD_INTEL</p>
        <span className="hint-panel__concept">{conceptTaught}</span>
      </div>

      {/* Hint 0 — always free */}
      <RevealedHintCard
        index={0}
        text={safeHints[0] ?? ""}
        animate={false}
      />

      {/* Hint 1 — 10 pts */}
      {revealedCount >= 1 ? (
        <RevealedHintCard
          index={1}
          text={safeHints[1] ?? ""}
          animate={animateIndex === 1}
        />
      ) : (
        <LockedHintSlot
          index={1}
          onReveal={onReveal}
          isRevealing={isRevealing}
          isGloballyRevealing={isRevealing}
        />
      )}

      {/* Hint 2 — 25 pts */}
      {revealedCount >= 2 ? (
        <RevealedHintCard
          index={2}
          text={safeHints[2] ?? ""}
          animate={animateIndex === 2}
        />
      ) : (
        <LockedHintSlot
          index={2}
          onReveal={onReveal}
          isRevealing={isRevealing}
          isGloballyRevealing={isRevealing}
        />
      )}
    </div>
  );
}
