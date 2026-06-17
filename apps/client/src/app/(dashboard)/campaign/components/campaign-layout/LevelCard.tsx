"use client";

import React, { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Info, Lock, Zap, Star } from "lucide-react";

import { DIFFICULTY_CONFIG } from "../../constants/difficulty.constants";
import type { ApiLevelInfo } from "../../types/campaign.types";
import { useCampaignPrefetch } from "../../hooks/useCampaignPrefetch";


// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_STARS   = 3;
const ORDER_PAD   = 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function StarDisplay({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-[2px]" role="img" aria-label={`${count} of ${MAX_STARS} stars`}>
      {Array.from({ length: MAX_STARS }).map((_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < count ? "rgba(var(--accent-rgb), 1)" : "transparent"}
          strokeWidth={i < count ? 0 : 1.5}
          style={
            i < count
              ? { color: "rgba(var(--accent-rgb),1)", filter: "drop-shadow(0 0 4px rgba(var(--accent-rgb),0.7))" }
              : { color: "rgba(var(--accent-rgb),0.2)" }
          }
        />
      ))}
    </span>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
export interface LevelCardProps {
  level: ApiLevelInfo;
  isMobile: boolean;
  onInfoClick: (level: ApiLevelInfo) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const LevelCard = memo(function LevelCard({
  level,
  isMobile,
  onInfoClick,
}: LevelCardProps) {
  const router = useRouter();
  const { prefetchLevel } = useCampaignPrefetch();
  const dc = DIFFICULTY_CONFIG[level.difficulty] ?? DIFFICULTY_CONFIG.EASY;

  const handlePrefetch = useCallback((): void => {
    if (!level.unlocked) return;
    void prefetchLevel(level.id);
  }, [level.id, level.unlocked, prefetchLevel]);

  const handleCardClick = useCallback(() => {
    if (!level.unlocked) return;
    router.push(`/campaign/${level.id}`);
  }, [level.id, level.unlocked, router]);

  const handleInfoClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onInfoClick(level);
    },
    [level, onInfoClick],
  );

  // ── Locked state ────────────────────────────────────────────────────────────
  if (!level.unlocked) {
    return (
      <div
        className={`level-card level-card--locked ${isMobile ? "level-card--mobile" : "level-card--desktop"}`}
        style={{ "--diff-color": dc.color } as React.CSSProperties}
      >
        {/* Difficulty accent bar */}
        <div className="level-card__diff-bar" />

        <div className="level-card__body">
          <div className="level-card__top-row">
            <span className="level-card__order">
              #{String(level.order).padStart(ORDER_PAD, "0")}
            </span>
            <Lock className="level-card__lock-icon" aria-hidden="true" />
          </div>

          <h3 className="level-card__title level-card__title--locked">
            {level.title}
          </h3>

          {isMobile && (
            <p className="level-card__description">
              {level.description}
            </p>
          )}

          <div className="level-card__footer">
            <span className={`level-card__badge ${dc.text} ${dc.border} ${dc.bg}`}>
              {level.difficulty}
            </span>
            <span className="level-card__points level-card__points--locked">
              <Zap className="level-card__points-icon" aria-hidden="true" />
              +{level.pointsReward}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Unlocked state ──────────────────────────────────────────────────────────
  return (
    <div
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      className={`level-card level-card--unlocked ${level.completed ? "level-card--completed" : "level-card--active"} ${isMobile ? "level-card--mobile" : "level-card--desktop"} group`}
      style={{ "--diff-color": dc.color } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={handleCardClick}
        aria-label={`${level.title} — ${level.difficulty} — ${level.completed ? "Completed" : "Not completed"}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0, cursor: "pointer" }}
      />

      {/* Difficulty accent bar */}
      <div className="level-card__diff-bar level-card__diff-bar--glow" />

      <div className="level-card__body" style={{ pointerEvents: "none" }}>
        <div className="level-card__top-row">
          <span className="level-card__order">
            #{String(level.order).padStart(ORDER_PAD, "0")}
          </span>

          <div className="level-card__badges-row">
            {level.completed && (
              <span className="level-card__clear-badge">
                <Check className="w-2.5 h-2.5" aria-hidden="true" />
                CLEAR
              </span>
            )}
            {/* Info button — opens detail modal */}
            <button
              type="button"
              aria-label={`View details for ${level.title}`}
              onClick={handleInfoClick}
              className="level-card__info-btn"
              style={{ pointerEvents: "auto" }}
            >
              <Info className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        </div>

        <h3 className={`level-card__title ${level.completed ? "level-card__title--completed" : ""}`}>
          {level.title}
        </h3>

        {isMobile && (
          <p className="level-card__description">
            {level.description}
          </p>
        )}

        <div className="level-card__footer">
          <span className={`level-card__badge ${dc.text} ${dc.border} ${dc.bg}`}>
            {level.difficulty}
          </span>

          <div className="level-card__right-row">
            <StarDisplay count={level.bestStars} />
            <span className="level-card__points">
              <Zap className="level-card__points-icon level-card__points-icon--lit" aria-hidden="true" />
              +{level.pointsReward}
            </span>
          </div>
        </div>
      </div>

      {/* Hover glow overlay */}
      <div className="level-card__hover-glow" aria-hidden="true" />
    </div>
  );
});
