export interface MatchEntry {
  id: string;
  date: string;        // ISO string (serialised from server Date)
  type: string;
  opponent: string;
  opponentId: string | null;
  result: "WIN" | "LOSS";
  duration: number | null; // seconds; null if match ended abnormally
}

export interface CombatStats {
  efficiency: number;  // 0-100
  aggression: number;  // 0-100
  defense:    number;  // 0-100
  precision:  number;  // 0-100
  speed:      number;  // 0-100
}

export interface ProfileData {
  id: string;
  username: string;
  avatarUrl: string | null;
  rank: number;
  memberSince: string; // ISO string
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  matchHistory: MatchEntry[];
  combatStats: CombatStats;
  achievements?: { achievementId: string; unlockedLevel: number }[];
}
