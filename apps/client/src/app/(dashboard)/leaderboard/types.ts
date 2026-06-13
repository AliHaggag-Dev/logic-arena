/** Shape of a single leaderboard row returned by GET /users/leaderboard */
export interface LeaderboardUser {
  id: string;
  username: string;
  rank: number;
  isOnline: boolean;
  inMatchId?: string;
  _count: { wonMatches: number };
  achievements?: { achievementId: string; unlockedLevel: number }[];
  combatStats?: {
    efficiency: number;
    aggression: number;
    defense: number;
    precision: number;
    speed: number;
  } | null;
}

/** Paginated response shape returned by GET /users/leaderboard */
export interface LeaderboardPageResponse {
  data: LeaderboardUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Maximum rank bar display cap (users above this show a full bar) */
export const RANK_BAR_MAX = 1000;

/** Default number of rows per leaderboard page */
export const DEFAULT_PAGE_LIMIT = 10;

/** Poll interval for leaderboard refresh, in milliseconds */
export const POLL_INTERVAL_MS = 30_000;

/** Score threshold: at or above this value → OPTIMAL tier */
export const EFF_OPTIMAL_SCORE = 50;

/** Score threshold: at or above this value → MODERATE tier (below → LOW) */
export const EFF_MODERATE_SCORE = 20;
