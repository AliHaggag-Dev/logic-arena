import type { LeaderboardUser } from "../types";

export const getRankColor = (index: number): string => {
  if (index === 0) return "var(--rank-gold)";
  if (index === 1) return "var(--rank-silver)";
  if (index === 2) return "var(--rank-bronze)";
  return "var(--accent)";
};

/**
 * Derive a display efficiency score from rank points and wins.
 * Formula: (wins / max(rank, 1)) × 1000 — a rough proxy until
 * the server aggregates real per-match efficiency data.
 */
export const deriveEfficiency = (user: LeaderboardUser): number => {
  const wins = user._count.wonMatches;
  const pts = Math.max(user.rank, 1);
  return Math.round((wins / pts) * 1000 * 10) / 10;
};
