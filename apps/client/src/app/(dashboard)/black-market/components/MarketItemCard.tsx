"use client";

import React, { useState } from "react";
import { Zap, Lock, CheckCircle, ShoppingCart, UserX } from "lucide-react";
import { MarketItem } from "../types";
import { RARITY_STYLES } from "../constants";

const GUEST_LOCK_TOOLTIP = "Create an account to equip and customise your robot.";

interface MarketItemCardProps {
  item: MarketItem;
  isGuest: boolean;
  isOwned: boolean;
  isEquipped: boolean;
  isPreview: boolean;
  canAfford: boolean;
  onPreview: (item: MarketItem) => void;
  onPurchase: (item: MarketItem) => void;
}

export const MarketItemCard = React.memo(function MarketItemCard({
  item,
  isGuest,
  isOwned,
  isEquipped,
  isPreview,
  canAfford,
  onPreview,
  onPurchase,
}: MarketItemCardProps) {
  const styles = RARITY_STYLES[item.rarity];
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = `/thumbnails/${item.id}.png`;
  
  const handlePreview = () => onPreview(item);
  const handlePreviewKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPreview(item);
    }
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest) return;
    onPurchase(item);
  };

  const isActionDisabled =
    isGuest ||
    (isOwned && isEquipped) ||
    (!canAfford && item.price > 0 && !isOwned);

  const buttonClass = isGuest
    ? "bg-accent/[0.03] border-accent/10 text-accent/25 cursor-not-allowed opacity-50"
    : isOwned && isEquipped
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
      : isOwned && !isEquipped
        ? "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/60 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.2)] cursor-pointer"
        : !canAfford && item.price > 0
          ? "bg-red-500/5 border-red-500/20 text-red-500/40 cursor-not-allowed opacity-60"
          : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/60 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.2)] cursor-pointer";

  return (
    <div
      className={`
        relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
        bg-[rgba(var(--accent-rgb),0.02)] backdrop-blur-sm
        ${styles.border} ${styles.glow}
        ${isPreview ? "ring-1 ring-[rgba(var(--accent-rgb),0.6)] shadow-[0_0_24px_rgba(var(--accent-rgb),0.15)]" : ""}
      `}
      onClick={handlePreview}
      onKeyDown={handlePreviewKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Preview ${item.name}`}
    >
      {/* Top scanline accent */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(var(--accent-rgb),0.012) 4px,rgba(var(--accent-rgb),0.012) 5px)",
        }}
      />

      {/* Preview indicator */}
      {isPreview && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
      )}

      <div className="relative z-10 p-4">
        {/* Thumbnail + rarity */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {!imgError ? (
              <img
                src={thumbnailUrl}
                alt={item.name}
                onError={() => setImgError(true)}
                className="w-12 h-12 rounded-xl object-contain bg-accent/5 border border-white/5"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl border border-white/10 flex-shrink-0"
                style={{
                  background: item.color === "DEFAULT" ? "rgba(var(--accent-rgb),0.2)" : item.color,
                  boxShadow: `0 0 10px ${item.glowColor}60`,
                }}
              />
            )}
            <span
              className={`text-[8px] font-bold tracking-[0.22em] px-1.5 py-0.5 rounded border ${styles.badge}`}
            >
              {item.rarity}
            </span>
          </div>

          {isGuest ? (
            <UserX className="w-4 h-4" style={{ color: "rgba(var(--accent-rgb),0.25)" }} />
          ) : isOwned ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : item.price === 0 ? (
            <Zap className="w-4 h-4 text-accent/50" />
          ) : !canAfford ? (
            <Lock className="w-4 h-4 text-red-500/50" />
          ) : (
            <Zap className="w-4 h-4 text-accent/50" />
          )}
        </div>

        {/* Name */}
        <h3 className="text-[11px] font-black tracking-[0.18em] text-accent/90 mb-1 leading-tight">
          {item.name}
        </h3>

        {/* Description */}
        <p className="text-[9px] text-accent/35 tracking-[0.08em] leading-relaxed mb-3">
          {item.description}
        </p>

        {/* Price + Action */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-black tracking-[0.15em]"
            style={{ color: item.glowColor, textShadow: `0 0 8px ${item.glowColor}80` }}
          >
            {item.price === 0 ? "FREE" : `${item.price.toLocaleString()} PTS`}
          </span>

          <button
            type="button"
            onClick={handleAction}
            disabled={isActionDisabled}
            title={isGuest ? GUEST_LOCK_TOOLTIP : undefined}
            aria-label={
              isGuest
                ? GUEST_LOCK_TOOLTIP
                : isEquipped
                  ? `${item.name} is currently equipped`
                  : isOwned
                    ? `Equip ${item.name}`
                    : `Purchase ${item.name}`
            }
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black tracking-[0.18em]
              transition-all duration-200 border font-mono
              ${buttonClass}
            `}
          >
            {isGuest ? (
              <>
                <Lock className="w-3 h-3" />
                LOCKED
              </>
            ) : isOwned && isEquipped ? (
              <>
                <CheckCircle className="w-3 h-3" />
                EQUIPPED
              </>
            ) : isOwned ? (
              <>
                <Zap className="w-3 h-3" />
                EQUIP
              </>
            ) : item.price === 0 ? (
              <>
                <Zap className="w-3 h-3" />
                EQUIP
              </>
            ) : !canAfford ? (
              <>
                <Lock className="w-3 h-3" />
                LOCKED
              </>
            ) : (
              <>
                <ShoppingCart className="w-3 h-3" />
                PURCHASE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

