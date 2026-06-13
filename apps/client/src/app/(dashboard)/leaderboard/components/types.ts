import type { LeaderboardUser } from "../types";

export interface LeaderboardViewProps {
  users: LeaderboardUser[];
  isLoading: boolean;
  currentUserId: string;
  onChallenge: (userId: string) => void;
  onSpectate: (matchId: string) => void;
  isGuest: boolean;
  /** Zero-based offset of the first row on the current page (e.g. page 2 → 10) */
  globalRankOffset: number;
}
