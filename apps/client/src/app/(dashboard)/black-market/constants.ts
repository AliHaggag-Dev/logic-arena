import type { ItemCategory, MarketItem } from "./types";

export const INITIAL_POINTS = 1500;
export const CATEGORIES: ItemCategory[] = ["chassis", "paint", "tracer"];
export const STARTER_ITEM_IDS = ["chassis-unit-01", "chassis-unit-02", "paint-default", "tracer-pulse"] as const;

export const DEFAULT_LOADOUT: Record<ItemCategory, string> = {
  chassis: "chassis-unit-01",
  paint: "paint-default",
  tracer: "tracer-pulse",
};

/** Guest default: factory spec paint (no colour override) so the raw GLB colour shows through. */
export const GUEST_LOADOUT: Record<ItemCategory, string> = {
  chassis: "chassis-unit-01",
  paint: "paint-default",
  tracer: "tracer-pulse",
};

export const MARKET_ITEMS: MarketItem[] = [
  // ── ROBOTS ──────────────────────────────────────────────
  {
    id: "chassis-unit-01",
    name: "UNIT-01",
    category: "chassis",
    price: 0,
    color: "#ffffff",
    glowColor: "#ffffff",
    rarity: "COMMON",
    description: "Starter robot. Balanced and reliable.",
  },
  {
    id: "chassis-unit-02",
    name: "UNIT-02",
    category: "chassis",
    price: 400,
    color: "#ffffff",
    glowColor: "#ffffff",
    rarity: "COMMON",
    description: "Backup robot. Fast and light.",
  },

  {
    id: "chassis-titan",
    name: "ARMORED MECH",
    category: "chassis",
    price: 1800,
    color: "#f59e0b",
    glowColor: "#f59e0b",
    rarity: "LEGENDARY",
    description: "Heavy armor. Built for survival.",
  },
  {
    id: "chassis-sandman",
    name: "SANDMAN",
    category: "chassis",
    price: 2400,
    color: "#a3a3a3",
    glowColor: "#ffffff",
    rarity: "LEGENDARY",
    description: "Advanced prototype mech.",
  },
  {
    id: "chassis-iron-mecha",
    name: "IRON MECHA",
    category: "chassis",
    price: 700,
    color: "#3b82f6",
    glowColor: "#3b82f6",
    rarity: "RARE",
    description: "A rugged, iron-clad mech designed for heavy frontline skirmishes and reliability.",
  },
  {
    id: "chassis-sentinel",
    name: "SENTINEL",
    category: "chassis",
    price: 1200,
    color: "#a855f7",
    glowColor: "#a855f7",
    rarity: "EPIC",
    description: "An advanced security warden engineered for high-altitude scanning and defense.",
  },
  {
    id: "chassis-crimson-titan",
    name: "CRIMSON TITAN",
    category: "chassis",
    price: 3000,
    color: "#8b0000",
    glowColor: "#ff3355",
    rarity: "ELITE",
    description: "A devastating warmachine forged in reinforced crimson plating and high-output cores.",
  },

  // ── COLORS ────────────────────────────────────────────────
  {
    id: "paint-default",
    name: "Original",
    description: "Clean factory white.",
    price: 0,
    category: "paint",
    rarity: "COMMON",
    color: "DEFAULT",
    glowColor: "#888888",
  },
  {
    id: "paint-crimson",
    name: "Red",
    category: "paint",
    price: 300,
    color: "#ef4444",
    glowColor: "#ef4444",
    rarity: "COMMON",
    description: "Bright red neon paint.",
  },
  {
    id: "paint-void",
    name: "Dark Blue",
    category: "paint",
    price: 500,
    color: "#1e1b4b",
    glowColor: "#818cf8",
    rarity: "RARE",
    description: "Deep space blue finish.",
  },
  {
    id: "paint-aurora",
    name: "Green",
    category: "paint",
    price: 700,
    color: "#10b981",
    glowColor: "#10b981",
    rarity: "RARE",
    description: "Bright neon green.",
  },
  {
    id: "paint-solar",
    name: "Orange",
    category: "paint",
    price: 1200,
    color: "#f97316",
    glowColor: "#f97316",
    rarity: "LEGENDARY",
    description: "Glowing orange magma.",
  },

  // ── LASERS ──────────────────────────────────────────────
  {
    id: "tracer-pulse",
    name: "Cyan Laser",
    category: "tracer",
    price: 200,
    color: "#22d3ee",
    glowColor: "#22d3ee",
    rarity: "COMMON",
    description: "Classic cyan energy beam.",
  },
  {
    id: "tracer-inferno",
    name: "Orange Laser",
    category: "tracer",
    price: 450,
    color: "#fb923c",
    glowColor: "#fb923c",
    rarity: "RARE",
    description: "Burning orange tracer.",
  },
  {
    id: "tracer-ghost",
    name: "Purple Laser",
    category: "tracer",
    price: 600,
    color: "#c084fc",
    glowColor: "#c084fc",
    rarity: "LEGENDARY",
    description: "Bright purple spectral beam.",
  },
];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  chassis: "Robots",
  paint: "Colors",
  tracer: "Lasers",
};

export const RARITY_ORDER = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3, ELITE: 4 } as const;

export const RARITY_STYLES: Record<MarketItem["rarity"], { badge: string; border: string; glow: string; textColor: string; glowColor: string }> = {
  COMMON: {
    badge: "text-accent/70 bg-accent/10 border-accent/20",
    border: "border-accent/15 hover:border-accent/40",
    glow: "hover:shadow-[0_0_18px_rgba(var(--accent-rgb),0.12)]",
    textColor: "text-accent/70",
    glowColor: "rgba(var(--accent-rgb), 0.6)",
  },
  RARE: {
    badge: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    border: "border-blue-500/20 hover:border-blue-400/60",
    glow: "hover:shadow-[0_0_18px_rgba(59,130,246,0.18)]",
    textColor: "text-blue-400",
    glowColor: "rgba(59, 130, 246, 0.6)",
  },
  EPIC: {
    badge: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    border: "border-purple-500/20 hover:border-purple-400/60",
    glow: "hover:shadow-[0_0_18px_rgba(168,85,247,0.18)]",
    textColor: "text-purple-400",
    glowColor: "rgba(168, 85, 247, 0.6)",
  },
  LEGENDARY: {
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    border: "border-amber-500/20 hover:border-amber-400/60",
    glow: "hover:shadow-[0_0_22px_rgba(245,158,11,0.22)]",
    textColor: "text-amber-400",
    glowColor: "rgba(245, 158, 11, 0.6)",
  },
  ELITE: {
    badge: "text-elite-red bg-elite-red/10 border-elite-red/30 shadow-[0_0_10px_rgba(var(--elite-red-rgb),0.5)] animate-pulse",
    border: "border-elite-red/40 hover:border-elite-red/80",
    glow: "hover:shadow-[0_0_26px_rgba(var(--elite-red-rgb),0.4)] hover:scale-[1.01] transition-transform duration-300",
    textColor: "text-elite-red",
    glowColor: "rgba(var(--elite-red-rgb), 0.95)",
  },
};
