"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X, Lock, ChevronDown, ChevronUp, Zap, Trophy, Cpu, Shield,
} from "lucide-react";
import type { ApiLevelInfo } from "../types/campaign.types";
import { DIFFICULTY_CONFIG } from "../constants/difficulty.constants";
import { LevelArenaPreview } from "../[id]/components/arena/LevelArenaPreview";

interface LevelDetailModalProps {
  level: ApiLevelInfo | null;
  onClose: () => void;
}

export function LevelDetailModal({ level, onClose }: LevelDetailModalProps) {
  const router = useRouter();
  const [hintState, setHintState] = useState<{ levelId?: string; isOpen: boolean }>({
    isOpen: false,
  });
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const hintOpen = hintState.levelId === level?.id && hintState.isOpen;

  // Close on Escape key + restore focus
  useEffect(() => {
    if (!level) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      previousFocusRef.current?.focus();
    };
  }, [level, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleEngage = useCallback(() => {
    if (!level) return;
    router.push(`/campaign/${level.id}`);
  }, [level, router]);

  if (!level) return null;

  const dc = DIFFICULTY_CONFIG[level.difficulty] ?? DIFFICULTY_CONFIG.EASY;

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`level-title-${level.id}`}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={handleBackdropClick}
    >
      {/* Modal Card — uses bg-bg-primary for proper theme support */}
      <div
        className="relative w-full max-w-[540px] rounded-2xl border border-accent/20 font-mono overflow-hidden bg-bg-primary"
        style={{
          boxShadow: `0 0 60px rgba(var(--accent-rgb),0.12), 0 0 0 1px rgba(var(--accent-rgb),0.08)`,
          animation: "modalSlideIn 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${dc.color}, transparent)`,
            opacity: 0.8,
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1 min-w-0 pr-4">
            {/* Breadcrumb */}
            <p className="text-[9px] tracking-[0.3em] text-accent/50 uppercase mb-2 font-bold">
              {level.tabId.replace('-', ' ')} · LEVEL {String(level.order).padStart(2, '0')}
            </p>

            {/* Title */}
            <h2 id={`level-title-${level.id}`} className="text-[20px] font-black tracking-[0.18em] text-accent leading-tight mb-3">
              {level.title}
            </h2>

            {/* Difficulty + Points */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 text-[9px] font-black tracking-[0.25em] border rounded-full px-2.5 py-1 ${dc.text} ${dc.border} ${dc.bg}`}
              >
                <Shield className="w-2.5 h-2.5" />
                {level.difficulty}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.15em]">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-500 font-black">+{level.pointsReward}</span>
                <span className="text-accent/50 font-bold">PTS</span>
              </span>
              {level.completed && (
                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-500 tracking-[0.15em] font-bold">
                  <Trophy className="w-3 h-3" />
                  CLEARED
                </span>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close level details"
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border border-accent/20 text-accent/60 hover:text-accent hover:border-accent/40 hover:bg-accent/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-accent/15" />

        {/* Level Arena Preview — live animated battle */}
        <div className="px-6 pt-4">
          <LevelArenaPreview levelId={level.id} mode="preview" compact />
        </div>

        {/* Description — ICPC riddle */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-3.5 h-3.5 text-accent/60" />
            <span className="text-[9px] tracking-[0.3em] text-accent/50 uppercase font-bold">Mission Details</span>
          </div>
          <p className="text-[12px] leading-[1.85] text-accent/80 tracking-[0.04em]">
            {level.description}
          </p>
        </div>

        {/* Collapsible Hint */}
        <div className="mx-6 mb-4 rounded-xl border border-accent/15 overflow-hidden">
          <button
            type="button"
            id={`hint-toggle-${level.id}`}
            aria-expanded={hintOpen}
            aria-controls={`hint-content-${level.id}`}
            onClick={() =>
              setHintState((state) => ({
                levelId: level.id,
                isOpen: state.levelId === level.id ? !state.isOpen : true,
              }))
            }
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/5 transition-colors cursor-pointer"
          >
            <span className="text-[9px] tracking-[0.3em] text-accent/60 uppercase font-bold flex items-center gap-2">
              <Shield className="w-3 h-3 text-yellow-500/70" />
              SHOW HINT
            </span>
            {hintOpen
              ? <ChevronUp className="w-3.5 h-3.5 text-accent/50" />
              : <ChevronDown className="w-3.5 h-3.5 text-accent/50" />
            }
          </button>

          <div
            id={`hint-content-${level.id}`}
            style={{
              maxHeight: hintOpen ? '200px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <div className="px-4 pb-4 pt-0">
              <div className="h-px bg-accent/10 mb-3" />
              <p className="text-[11px] leading-[1.8] text-accent/65 tracking-[0.03em]">
                {level.hints[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-6">
          {level.completed ? (
            <button
              type="button"
              onClick={handleEngage}
              className="w-full py-3 rounded-xl border border-accent/25 text-accent/70 text-[10px] tracking-[0.3em] font-black uppercase hover:bg-accent/8 hover:border-accent/40 transition-all cursor-pointer"
            >
              REPLAY (NO REWARD)
            </button>
          ) : level.unlocked ? (
            <button
              type="button"
              onClick={handleEngage}
              className="w-full py-3.5 rounded-xl text-[11px] tracking-[0.3em] font-black uppercase transition-all relative overflow-hidden group cursor-pointer"
              style={{
                background: `linear-gradient(135deg, rgba(var(--accent-rgb),0.2), rgba(var(--accent-rgb),0.1))`,
                border: `1px solid rgba(var(--accent-rgb),0.4)`,
                color: `rgb(var(--accent-rgb))`,
                boxShadow: `0 0 20px rgba(var(--accent-rgb),0.15)`,
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                START BATTLE
              </span>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `rgba(var(--accent-rgb),0.08)` }}
              />
            </button>
          ) : (
            <div
              className="w-full py-3.5 rounded-xl border border-accent/15 flex items-center justify-center gap-2 text-accent/40 text-[10px] tracking-[0.3em] font-black uppercase"
              style={{ background: 'rgba(var(--accent-rgb),0.03)' }}
            >
              <Lock className="w-3.5 h-3.5" />
              COMPLETE PREVIOUS LEVEL TO UNLOCK
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
