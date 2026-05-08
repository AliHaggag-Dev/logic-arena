import type { ItemCategory, MarketItem } from "./types";

export const INITIAL_POINTS = 1500;
export const CATEGORIES: ItemCategory[] = ["chassis", "paint", "tracer"];
export const STARTER_ITEM_IDS = ["chassis-phantom", "paint-crimson", "tracer-pulse"] as const;

export const DEFAULT_LOADOUT: Record<ItemCategory, string> = {
  chassis: "chassis-phantom",
  paint: "paint-crimson",
  tracer: "tracer-pulse",
};

/** Guest default: factory spec paint (no colour override) so the raw GLB colour shows through. */
export const GUEST_LOADOUT: Record<ItemCategory, string> = {
  chassis: "chassis-phantom",
  paint: "paint-default",
  tracer: "tracer-pulse",
};

export const MARKET_ITEMS: MarketItem[] = [
  // ── ROBOT CHASSIS ──────────────────────────────────────────────
  {
    id: "chassis-unit-01",
    name: "UNIT-01",
    category: "chassis",
    price: 0,
    color: "#ffffff",
    glowColor: "#ffffff",
    rarity: "COMMON",
    description: "Original starter chassis. Balanced and iconic.",
  },
  {
    id: "chassis-unit-02",
    name: "UNIT-02",
    category: "chassis",
    price: 0,
    color: "#ffffff",
    glowColor: "#ffffff",
    rarity: "COMMON",
    description: "Classic backup chassis. Reliable performance.",
  },
  {
    id: "chassis-phantom",
    name: "PHANTOM UNIT",
    category: "chassis",
    price: 0,
    color: "#22d3ee",
    glowColor: "#22d3ee",
    rarity: "COMMON",
    description: "Standard-issue battle chassis. Reliable and lethal.",
  },
  {
    id: "chassis-wraith",
    name: "BUNNY BUNDLE",
    category: "chassis",
    price: 800,
    color: "#a855f7",
    glowColor: "#a855f7",
    rarity: "RARE",
    description: "Free Fire crossover bundle. Jump pad efficiency +15%.",
  },
  {
    id: "chassis-titan",
    name: "ARMORED MECH",
    category: "chassis",
    price: 1800,
    color: "#f59e0b",
    glowColor: "#f59e0b",
    rarity: "LEGENDARY",
    description: "Military-grade armored mech. Extreme durability and mass.",
  },

  // ── NEON PAINTS ────────────────────────────────────────────────
  {
    id: "paint-default",
    name: "Factory Spec",
    description: "Original manufacturer colors. Clean and pristine.",
    price: 0,
    category: "paint",
    rarity: "COMMON",
    color: "DEFAULT",
    glowColor: "#888888",
  },
  {
    id: "paint-crimson",
    name: "CRIMSON FURY",
    category: "paint",
    price: 300,
    color: "#ef4444",
    glowColor: "#ef4444",
    rarity: "COMMON",
    description: "Blood-red neon coat. Strike fear before the first shot.",
  },
  {
    id: "paint-void",
    name: "VOID BLACK",
    category: "paint",
    price: 500,
    color: "#1e1b4b",
    glowColor: "#818cf8",
    rarity: "RARE",
    description: "Deepspace matte finish. Absorbs all visible light.",
  },
  {
    id: "paint-aurora",
    name: "AURORA SHIFT",
    category: "paint",
    price: 700,
    color: "#10b981",
    glowColor: "#10b981",
    rarity: "RARE",
    description: "Adaptive chromatic iridescence. Mesmerizing mid-combat.",
  },
  {
    id: "paint-solar",
    name: "SOLAR FLARE",
    category: "paint",
    price: 1200,
    color: "#f97316",
    glowColor: "#f97316",
    rarity: "LEGENDARY",
    description: "Molten plasma pigment. Rivals the surface of the sun.",
  },

  // ── TRACER ROUNDS ──────────────────────────────────────────────
  {
    id: "tracer-pulse",
    name: "PULSE TRACER",
    category: "tracer",
    price: 200,
    color: "#22d3ee",
    glowColor: "#22d3ee",
    rarity: "COMMON",
    description: "Standard cyan energy tracer. Classic operator choice.",
  },
  {
    id: "tracer-inferno",
    name: "INFERNO SHOT",
    category: "tracer",
    price: 450,
    color: "#fb923c",
    glowColor: "#fb923c",
    rarity: "RARE",
    description: "Incendiary tracer round. Leaves a burning contrail.",
  },
  {
    id: "tracer-ghost",
    name: "GHOST BEAM",
    category: "tracer",
    price: 600,
    color: "#c084fc",
    glowColor: "#c084fc",
    rarity: "LEGENDARY",
    description: "Spectral projectile. Partially phases through barriers.",
  },
];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  chassis: "Robot Chassis",
  paint: "Neon Paints",
  tracer: "Tracer Rounds",
};

export const RARITY_ORDER = { COMMON: 0, RARE: 1, LEGENDARY: 2 } as const;

export const RARITY_STYLES: Record<MarketItem["rarity"], { badge: string; border: string; glow: string }> = {
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
