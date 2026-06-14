"use client";

import React, { useState } from "react";
import { CheckCircle, Loader2, Zap, Eye } from "lucide-react";
import { MarketItem } from "../../black-market/types";
import { RARITY_STYLES } from "../../black-market/constants";
import Image from "next/image";

// ── Rarity dot ────────────────────────────────────────────────────────────────

const RARITY_DOT_COLORS: Record<MarketItem["rarity"], string> = {
  COMMON: "bg-accent/60",
  RARE: "bg-blue-400",
  EPIC: "bg-purple-400",
  LEGENDARY: "bg-amber-400",
  ELITE: "bg-elite-red",
};

function RarityDot({ rarity }: { rarity: MarketItem["rarity"] }) {
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${RARITY_DOT_COLORS[rarity]}`} />
  );
}

// ── Item Card ─────────────────────────────────────────────────────────────────

export interface VaultItemCardProps {
  item: MarketItem;
  isEquipped: boolean;
  isPreviewed: boolean;
  isEquipping: boolean;
  onEquip: (item: MarketItem) => void;
  onPreview: (item: MarketItem) => void;
  /** Controls card width: mobile uses fixed snap-width, desktop uses full block width */
  isMobile: boolean;
}

export function VaultItemCard({
  item,
  isEquipped,
  isPreviewed,
  isEquipping,
  onEquip,
  onPreview,
  isMobile,
}: VaultItemCardProps) {
  const styles = RARITY_STYLES[item.rarity];
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = `/thumbnails/${item.id}.png`;

  return (
    <div
      onClick={() => onPreview(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onPreview(item); }}
      className={`
        relative flex-shrink-0 flex flex-col p-4 rounded-2xl backdrop-blur-sm
        transition-all duration-200 border cursor-pointer
        ${styles.border} ${!isMobile ? styles.glow : ""}
        ${
          isEquipped
            ? "bg-emerald-500/10 ring-1 ring-emerald-500/50 shadow-[0_0_24px_rgba(16,185,129,0.15)]"
            : isPreviewed
            ? "bg-accent/15 ring-1 ring-accent/60 shadow-[0_0_24px_rgba(var(--accent-rgb),0.2)]"
            : "bg-[rgba(var(--accent-rgb),0.03)] hover:bg-[rgba(var(--accent-rgb),0.06)]"
        }
        ${isMobile ? "w-[72vw] max-w-[280px]" : "w-full"}
      `}
    >
      {/* Equipped accent line */}
      {isEquipped && (
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-accent to-transparent" />
      )}

      {/* Thumbnail + rarity */}
      <div className="flex items-center gap-3 mb-3">
        {item.category === "chassis" && !imgError ? (
          <Image
            src={thumbnailUrl}
            alt={item.name}
            width={56}
            height={56}
            onError={() => setImgError(true)}
            className="w-14 h-14 rounded-xl object-contain bg-accent/5 border border-white/5"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl border border-white/10 flex-shrink-0"
            style={{
              background: item.color === "DEFAULT" ? "rgba(var(--accent-rgb),0.2)" : item.color,
              boxShadow: `0 0 12px ${item.glowColor}50`,
            }}
          />
        )}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <RarityDot rarity={item.rarity} />
            <span
              className={`text-[8px] font-bold tracking-[0.22em] px-1.5 py-0.5 rounded border ${styles.badge}`}
            >
              {item.rarity}
            </span>
          </div>
          {isEquipped && <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5" />}
        </div>
        
        {isPreviewed && !isEquipped && (
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded bg-accent/20 border border-accent/30 text-[9px] font-bold tracking-widest text-accent">
            <Eye className="w-3 h-3" />
            <span>PREVIEW</span>
          </div>
        )}
        
        {isEquipped && (
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </div>

      {/* Name + description */}
      <h3 className="text-[11px] font-black tracking-[0.18em] text-accent/90 mb-1 leading-tight">
        {item.name}
      </h3>
      <p className="text-[9px] text-accent/40 tracking-[0.06em] leading-relaxed flex-1 mb-4">
        {item.description}
      </p>

      {/* Equip button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isEquipped) onEquip(item);
        }}
        disabled={isEquipped || isEquipping}
        aria-label={isEquipped ? `${item.name} is equipped` : `Equip ${item.name}`}
        className={`
          flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
          text-[9px] font-black tracking-[0.18em] transition-all duration-150
          border font-mono w-full min-h-[44px]
          ${
            isEquipped
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
              : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/60 active:scale-95 cursor-pointer"
          }
        `}
      >
        {isEquipping ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isEquipped ? (
          <>
            <CheckCircle className="w-3 h-3" />
            EQUIPPED
          </>
        ) : (
          <>
            <Zap className="w-3 h-3" />
            EQUIP
          </>
        )}
      </button>
    </div>
  );
}
