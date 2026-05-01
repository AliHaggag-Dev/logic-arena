export const ALLOWED_ROBOT_IDS = ['unit-01', 'unit-02'];
export const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const PROFILE_TTL = 600; // 10 minutes

export const profileKey = (id: string) => `user:profile:${id}`;
export const loadoutKey = (id: string) => `user:loadout:${id}`;

export const BCRYPT_ROUNDS = 12;
export const PRISMA_UNIQUE_VIOLATION = 'P2002';

export interface CombatStats {
  efficiency: number;  // damage dealt per energy consumed (0-100)
  aggression: number;  // offensive pressure: shots fired, damage dealt (0-100)
  defense:    number;  // survival: health remaining, time alive (0-100)
  precision:  number;  // targeting efficiency: damage dealt / energy consumed (0-100)
  speed:      number;  // match pace: energy commands / second (0-100)
}

export interface UserProfile {
  username: string;
  email: string;
  rank: number;
  memberSince: Date;
  selectedRobotId: string | null;
  selectedColor: string | null;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  matchHistory: MatchSummary[];
  hasGoogle: boolean;
  hasGithub: boolean;
  provider: string | null;
  combatStats: CombatStats;
}

export interface MatchSummary {
  id: string;
  date: Date;   // Prisma DateTime; serialised to ISO string by Axios on the client
  type: string;
  opponent: string;
  result: 'WIN' | 'LOSS';
  duration: number | null;
}

export interface UserLoadout {
  selectedRobotId: string | null;
  selectedColor: string | null;
}

/** Shape returned by GET /users/leaderboard */
export interface LeaderboardEntry {
  id: string;
  username: string;
  rank: number;
  isOnline: boolean;
  _count: { wonMatches: number };
}

/** Maximum number of players returned by the leaderboard endpoint */
export const LEADERBOARD_LIMIT = 10;

/** Redis TTL for the leaderboard snapshot, in seconds */
export const LEADERBOARD_TTL = 20;

