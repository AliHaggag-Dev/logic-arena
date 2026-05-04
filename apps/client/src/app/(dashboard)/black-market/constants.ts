import { MarketItem } from "./types";

export const INITIAL_POINTS = 1500;

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

export const CATEGORY_LABELS: Record<string, string> = {
  chassis: "Robot Chassis",
  paint: "Neon Paints",
  tracer: "Tracer Rounds",
};

export const RARITY_ORDER = { COMMON: 0, RARE: 1, LEGENDARY: 2 } as const;
