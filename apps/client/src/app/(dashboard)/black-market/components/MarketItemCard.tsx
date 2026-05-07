"use client";

import React from "react";
import { Zap, Lock, CheckCircle, ShoppingCart } from "lucide-react";
import { MarketItem } from "../types";

const RARITY_STYLES: Record<MarketItem["rarity"], { badge: string; border: string; glow: string }> = {
  COMMON: {
    badge: "text-accent/70 bg-accent/10 border-accent/20",
    border: "border-accent/15 hover:border-accent/40",
    glow: "hover:shadow-[0_0_18px_rgba(var(--accent-rgb),0.12)]",
  },
  RARE: {
    badge: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    border: "border-purple-500/20 hover:border-purple-400/60",
    glow: "hover:shadow-[0_0_18px_rgba(168,85,247,0.18)]",
  },
  LEGENDARY: {
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    border: "border-amber-500/20 hover:border-amber-400/60",
    glow: "hover:shadow-[0_0_22px_rgba(245,158,11,0.22)]",
  },
};

interface MarketItemCardProps {
  item: MarketItem;
  isOwned: boolean;
  isEquipped: boolean;
  isPreview: boolean;
  canAfford: boolean;
  onPreview: (item: MarketItem) => void;
  onPurchase: (item: MarketItem) => void;
}

export const MarketItemCard = React.memo(function MarketItemCard({
  item,
  isOwned,
  isEquipped,
  isPreview,
  canAfford,
  onPreview,
  onPurchase,
}: MarketItemCardProps) {
  const styles = RARITY_STYLES[item.rarity];
  const handlePreview = () => onPreview(item);
  const handlePreviewKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPreview(item);
    }
  };

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
        {/* Color swatch + rarity */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md border border-white/10 flex-shrink-0"
              style={{
                background: item.color,
                boxShadow: `0 0 10px ${item.glowColor}60`,
              }}
            />
            <span
              className={`text-[8px] font-bold tracking-[0.22em] px-1.5 py-0.5 rounded border ${styles.badge}`}
            >
              {item.rarity}
            </span>
          </div>

          {isOwned ? (
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
            onClick={(e) => {
              e.stopPropagation();
              onPurchase(item);
            }}
            disabled={(isOwned && isEquipped) || (!canAfford && item.price > 0 && !isOwned)}
            aria-label={
              isEquipped
                ? `${item.name} is currently equipped`
                : isOwned
                  ? `Equip ${item.name}`
                  : `Purchase ${item.name}`
            }
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black tracking-[0.18em]
              transition-all duration-200 border font-mono
              ${isOwned && isEquipped
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
                : isOwned && !isEquipped
                  ? "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/60 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.2)] cursor-pointer"
                  : !canAfford && item.price > 0
                    ? "bg-red-500/5 border-red-500/20 text-red-500/40 cursor-not-allowed opacity-60"
                    : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/60 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.2)] cursor-pointer"
              }
            `}
          >
            {isOwned && isEquipped ? (
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
