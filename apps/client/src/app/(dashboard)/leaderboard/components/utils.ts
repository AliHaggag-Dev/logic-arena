import type { LeaderboardUser } from "../types";

export const getRankColor = (index: number): string => {
  if (index === 0) return "var(--rank-gold)";
  if (index === 1) return "var(--rank-silver)";
  if (index === 2) return "var(--rank-bronze)";
  return "var(--accent)";
};

/**
 * Returns the true efficiency score from the user's combat stats.
 * Falls back to a derived score if not yet played/calculated.
 */
export const deriveEfficiency = (user: LeaderboardUser): number => {
  if (user.combatStats?.efficiency !== undefined) {
    return user.combatStats.efficiency;
  }
  const wins = user._count.wonMatches;
  const pts = Math.max(user.rank, 1);
  return Math.round((wins / pts) * 1000 * 10) / 10;
};
