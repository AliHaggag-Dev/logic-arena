import { CombatStats } from "./types";

// ── Per-stat accent colours ──────────────────────────────────────────────────
// Single source of truth used by RadarChart, StatRing, OperatorBadge, page.
export const STAT_COLORS: Record<keyof CombatStats, string> = {
  efficiency: "#22d3ee",
  aggression: "#f97316",
  defense:    "#4ade80",
  precision:  "#a855f7",
  speed:      "#facc15",
};

// ── Dominant-archetype display labels ────────────────────────────────────────
export const STAT_LABELS: Record<keyof CombatStats, string> = {
  efficiency: "EFFICIENT",
  aggression: "AGGRESSIVE",
  defense:    "DEFENSIVE",
  precision:  "PRECISE",
  speed:      "SWIFT",
};

// ── Zero-value fallback for new players ─────────────────────────────────────
export const EMPTY_STATS: CombatStats = {
  efficiency: 0,
  aggression: 0,
  defense:    0,
  precision:  0,
  speed:      0,
};
