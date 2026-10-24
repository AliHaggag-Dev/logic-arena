import { MarketItem } from "../../black-market/types";

export interface RarityVisual {
  name: MarketItem["rarity"];
  color: string;
  glowColor: string;
  badgeClass: string;
  borderClass: string;
  cardGlow: string;
  accentGradient: string;
  pedestalGlow: string;
  pedestalRing: string;
  isHighTier: boolean;
  iconSymbol: string;
}

export const RARITY_THEMES: Record<MarketItem["rarity"], RarityVisual> = {
  COMMON: {
    name: "COMMON",
    color: "#22d3ee",
    glowColor: "rgba(34, 211, 238, 0.4)",
    badgeClass: "text-accent bg-accent/10 border-accent/30 shadow-[0_0_10px_rgba(var(--accent-rgb),0.25)]",
    borderClass: "border-accent/20 hover:border-accent/50",
    cardGlow: "shadow-[0_0_15px_rgba(var(--accent-rgb),0.06)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.2)]",
    accentGradient: "from-accent/20 via-accent/5 to-transparent",
    pedestalGlow: "rgba(var(--accent-rgb), 0.5)",
    pedestalRing: "border-accent/40 shadow-[0_0_25px_rgba(var(--accent-rgb),0.3)]",
    isHighTier: false,
    iconSymbol: "●",
  },
  RARE: {
    name: "RARE",
    color: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.5)",
    badgeClass: "text-blue-400 bg-blue-500/15 border-blue-500/40 shadow-[0_0_14px_rgba(59,130,246,0.35)]",
    borderClass: "border-blue-500/30 hover:border-blue-400/70",
    cardGlow: "shadow-[0_0_18px_rgba(59,130,246,0.08)] hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]",
    accentGradient: "from-blue-500/25 via-blue-500/5 to-transparent",
    pedestalGlow: "rgba(59, 130, 246, 0.6)",
    pedestalRing: "border-blue-400/50 shadow-[0_0_28px_rgba(59,130,246,0.4)]",
    isHighTier: false,
    iconSymbol: "◆",
  },
  EPIC: {
    name: "EPIC",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.65)",
    badgeClass: "text-purple-300 bg-purple-500/20 border-purple-400/60 shadow-[0_0_18px_rgba(168,85,247,0.55)] animate-pulse",
    borderClass: "border-purple-500/45 hover:border-purple-400/90",
    cardGlow: "shadow-[0_0_22px_rgba(168,85,247,0.15)] hover:shadow-[0_0_35px_rgba(168,85,247,0.4)]",
    accentGradient: "from-purple-500/35 via-purple-500/10 to-transparent",
    pedestalGlow: "rgba(168, 85, 247, 0.75)",
    pedestalRing: "border-purple-400/65 shadow-[0_0_35px_rgba(168,85,247,0.55)]",
    isHighTier: true,
    iconSymbol: "✦",
  },
  LEGENDARY: {
    name: "LEGENDARY",
    color: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.75)",
    badgeClass: "text-amber-300 bg-amber-500/20 border-amber-400/60 shadow-[0_0_22px_rgba(245,158,11,0.65)] animate-pulse",
    borderClass: "border-amber-500/50 hover:border-amber-400",
    cardGlow: "shadow-[0_0_26px_rgba(245,158,11,0.18)] hover:shadow-[0_0_40px_rgba(245,158,11,0.45)]",
    accentGradient: "from-amber-500/40 via-amber-500/10 to-transparent",
    pedestalGlow: "rgba(245, 158, 11, 0.85)",
    pedestalRing: "border-amber-400/75 shadow-[0_0_40px_rgba(245,158,11,0.65)]",
    isHighTier: true,
    iconSymbol: "★",
  },
  ELITE: {
    name: "ELITE",
    color: "#ff3344",
    glowColor: "rgba(255, 51, 68, 0.85)",
    badgeClass: "text-red-300 bg-red-500/25 border-red-500/70 shadow-[0_0_25px_rgba(255,51,68,0.75)] animate-pulse",
    borderClass: "border-red-500/55 hover:border-red-400",
    cardGlow: "shadow-[0_0_30px_rgba(255,51,68,0.22)] hover:shadow-[0_0_45px_rgba(255,51,68,0.55)]",
    accentGradient: "from-red-600/45 via-red-500/15 to-transparent",
    pedestalGlow: "rgba(255, 51, 68, 0.9)",
    pedestalRing: "border-red-500/85 shadow-[0_0_45px_rgba(255,51,68,0.75)]",
    isHighTier: true,
    iconSymbol: "🔥",
  },
};

export function getRarityTheme(rarity?: MarketItem["rarity"]): RarityVisual {
  return RARITY_THEMES[rarity ?? "COMMON"] ?? RARITY_THEMES.COMMON;
}
