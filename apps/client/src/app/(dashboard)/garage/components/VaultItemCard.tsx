"use client";

import React, { useState } from "react";
import { CheckCircle, Loader2, Zap, Eye, Bot } from "lucide-react";
import { MarketItem } from "../../black-market/types";
import { RARITY_STYLES } from "../../black-market/constants";
import { getRarityTheme } from "../constants/rarity.constants";
import Image from "next/image";

// ── Rarity dot ────────────────────────────────────────────────────────────────

const RARITY_DOT_COLORS: Record<MarketItem["rarity"], string> = {
  COMMON: "bg-accent/70",
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

  // ── 1. COLOR / PAINT CARD ──────────────────────────────────────────────────
  if (item.category === "paint") {
    const isDefault = item.color === "DEFAULT";
    const swatchBg = isDefault
      ? "linear-gradient(135deg, #475569 50%, #1e293b 50%)"
      : item.color;

    return (
      <div
        onClick={() => onPreview(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") onPreview(item); }}
        className={`
          relative flex items-center justify-between gap-3 p-3 rounded-2xl backdrop-blur-md
          transition-all duration-200 border cursor-pointer group
          ${styles.border} ${!isMobile ? styles.glow : ""}
          ${
            isEquipped
              ? "bg-emerald-500/10 ring-1 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : isPreviewed
              ? "bg-accent/15 ring-1 ring-accent/60 shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]"
              : "bg-bg-secondary/60 hover:bg-bg-secondary/90"
          }
          ${isMobile ? "w-[72vw] max-w-[270px] flex-shrink-0" : "w-full"}
        `}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Swatch Orb */}
          <div
            className="w-10 h-10 rounded-full border-2 border-white/20 flex-shrink-0 relative overflow-hidden shadow-inner flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              background: swatchBg,
              boxShadow: isDefault ? undefined : `0 0 14px ${item.glowColor}50`,
            }}
          >
            {isEquipped && (
              <CheckCircle className="w-5 h-5 text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text-primary tracking-wide truncate">
                {item.name}
              </span>
              <RarityDot rarity={item.rarity} />
            </div>
            <p className="text-[10px] text-text-secondary truncate font-sans">
              {item.description}
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isEquipped) onEquip(item);
          }}
          disabled={isEquipped || isEquipping}
          aria-label={isEquipped ? `${item.name} is applied` : `Apply ${item.name}`}
          className={`
            flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl
            text-[10px] font-bold tracking-wider transition-all duration-150 border flex-shrink-0
            ${
              isEquipped
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
                : "bg-accent/10 border-accent/30 text-accent hover:bg-accent hover:text-bg-primary active:scale-95 cursor-pointer"
            }
          `}
        >
          {isEquipping ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isEquipped ? (
            "APPLIED"
          ) : (
            "APPLY"
          )}
        </button>
      </div>
    );
  }

  // ── 2. LASER / TRACER CARD ─────────────────────────────────────────────────
  if (item.category === "tracer") {
    return (
      <div
        onClick={() => onPreview(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") onPreview(item); }}
        className={`
          relative flex items-center justify-between gap-3 p-3.5 rounded-2xl backdrop-blur-md
          transition-all duration-200 border cursor-pointer group
          ${styles.border} ${!isMobile ? styles.glow : ""}
          ${
            isEquipped
              ? "bg-emerald-500/10 ring-1 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : isPreviewed
              ? "bg-accent/15 ring-1 ring-accent/60 shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]"
              : "bg-bg-secondary/60 hover:bg-bg-secondary/90"
          }
          ${isMobile ? "w-[75vw] max-w-[280px] flex-shrink-0" : "w-full"}
        `}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Laser beam preview container */}
          <div className="w-16 h-8 rounded-lg bg-bg-primary/90 border border-border/40 flex items-center justify-center px-2 flex-shrink-0 relative overflow-hidden">
            <div
              className="h-1.5 w-full rounded-full"
              style={{
                backgroundColor: item.color,
                boxShadow: `0 0 10px ${item.glowColor}`,
                animation: "laserBeamPulse 2s ease-in-out infinite",
              }}
            />
          </div>

          {/* Details */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text-primary tracking-wide truncate">
                {item.name}
              </span>
              <RarityDot rarity={item.rarity} />
            </div>
            <p className="text-[10px] text-text-secondary truncate font-sans">
              {item.description}
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isEquipped) onEquip(item);
          }}
          disabled={isEquipped || isEquipping}
          aria-label={isEquipped ? `${item.name} is active` : `Equip ${item.name}`}
          className={`
            flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl
            text-[10px] font-bold tracking-wider transition-all duration-150 border flex-shrink-0
            ${
              isEquipped
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
                : "bg-accent/10 border-accent/30 text-accent hover:bg-accent hover:text-bg-primary active:scale-95 cursor-pointer"
            }
          `}
        >
          {isEquipping ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isEquipped ? (
            "EQUIPPED"
          ) : (
            "EQUIP"
          )}
        </button>
      </div>
    );
  }

  // ── 3. ROBOT / CHASSIS CARD ────────────────────────────────────────────────
  const rarityTheme = getRarityTheme(item.rarity);

  return (
    <div
      onClick={() => onPreview(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onPreview(item); }}
      className={`
        relative flex flex-col p-4 rounded-2xl backdrop-blur-md overflow-hidden
        transition-all duration-300 border cursor-pointer group justify-between
        ${rarityTheme.borderClass}
        ${rarityTheme.cardGlow}
        ${rarityTheme.isHighTier ? "card-shimmer" : ""}
        ${
          isEquipped
            ? "bg-emerald-500/10 ring-1 ring-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.2)]"
            : isPreviewed
            ? "ring-1 ring-accent/60 shadow-[0_0_24px_rgba(var(--accent-rgb),0.25)] bg-bg-secondary/90"
            : "bg-bg-secondary/65 hover:bg-bg-secondary/95"
        }
        ${isMobile ? "w-[75vw] max-w-[280px] flex-shrink-0" : "w-full"}
      `}
    >
      {/* Top rarity aura line */}
      <div
        className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${rarityTheme.accentGradient}`}
      />

      {/* Ambient corner light */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-25 group-hover:opacity-55 transition-opacity"
        style={{ backgroundColor: rarityTheme.color }}
      />

      {/* Top Header: Thumbnail + Info */}
      <div className="flex items-start gap-3 relative z-10">
        {/* Robot Thumbnail with Rarity Glow */}
        <div
          className="w-14 h-14 rounded-xl border flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-inner bg-bg-primary/80 transition-transform duration-300 group-hover:scale-105"
          style={{
            borderColor: `${rarityTheme.color}50`,
            boxShadow: `0 0 16px ${rarityTheme.glowColor}`,
          }}
        >
          {!imgError ? (
            <Image
              src={thumbnailUrl}
              alt={item.name}
              width={56}
              height={56}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <Bot className="w-7 h-7 text-accent/70" />
          )}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span
              className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full border flex items-center gap-1 ${rarityTheme.badgeClass}`}
            >
              <span>{rarityTheme.iconSymbol}</span>
              <span>{item.rarity}</span>
            </span>

            {/* Status Indicator */}
            {isEquipped ? (
              !isMobile ? (
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle className="w-2.5 h-2.5" />
                  EQUIPPED
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              )
            ) : isPreviewed ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-accent bg-accent/20 px-2 py-0.5 rounded-full border border-accent/40">
                <Eye className="w-2.5 h-2.5" />
                PREVIEW
              </span>
            ) : null}
          </div>

          <p className="text-xs font-black tracking-wide text-text-primary leading-tight truncate group-hover:text-accent transition-colors">
            {item.name}
          </p>

          <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-2 mt-1 font-sans">
            {item.description}
          </p>
        </div>
      </div>

      {/* Footer Equip Button */}
      <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center justify-between gap-2 relative z-10">
        {!isMobile && (
          <span className="text-[9px] text-text-secondary tracking-wider font-mono">
            {isPreviewed && !isEquipped ? "Viewing on stage" : "Ready to deploy"}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isEquipped) onEquip(item);
          }}
          disabled={isEquipped || isEquipping}
          aria-label={isEquipped ? `${item.name} is equipped` : `Equip ${item.name}`}
          className={`
            flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl
            text-[11px] font-bold tracking-wider transition-all duration-150 border
            ${isMobile ? "w-full" : ""}
            ${
              isEquipped
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 cursor-default"
                : "bg-accent/15 border-accent/40 text-accent hover:bg-accent hover:text-bg-primary active:scale-95 cursor-pointer"
            }
          `}
        >
          {isEquipping ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isEquipped ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              EQUIPPED
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              EQUIP
            </>
          )}
        </button>
      </div>
    </div>
  );
}



