export const ALLOWED_ROBOT_IDS = ['unit-01', 'unit-02'];
export const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const PROFILE_TTL = 600; // 10 minutes

export const profileKey = (id: string) => `user:profile:${id}`;
export const loadoutKey = (id: string) => `user:loadout:${id}`;

export const BCRYPT_ROUNDS = 12;
export const PRISMA_UNIQUE_VIOLATION = 'P2002';

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
}

export interface MatchSummary {
  id: string;
  date: Date;
  type: string;
  opponent: string;
  result: 'WIN' | 'LOSS';
  duration: number | null;
}

export interface UserLoadout {
  selectedRobotId: string | null;
  selectedColor: string | null;
}
