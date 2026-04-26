export interface MatchEntry {
  id: string;
  date: string;
  type: string;
  opponent: string;
  result: "WIN" | "LOSS";
  duration: number; // seconds
}

export interface CombatStats {
  efficiency: number;  // 0-100
  aggression: number;  // 0-100
  defense:    number;  // 0-100
  precision:  number;  // 0-100
  speed:      number;  // 0-100
}

export interface ProfileData {
  username: string;
  rank: number;
  memberSince: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  matchHistory: MatchEntry[];
  combatStats: CombatStats;
}
