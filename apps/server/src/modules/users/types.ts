export const ALLOWED_ROBOT_IDS = ['unit-01', 'unit-02'];
export const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const PROFILE_TTL = 600; // 10 minutes

export const profileKey = (id: string) => `user:profile:${id}`;
export const publicProfileKey = (username: string) => `user:public:${username}`;
export const PUBLIC_PROFILE_TTL = 300; // 5 minutes
export const loadoutKey = (id: string) => `user:loadout:${id}`;
export const preferencesKey = (id: string) => `user:preferences:${id}`;
export const blackMarketKey = (id: string) => `user:black-market:${id}`;
export const combatLoadoutKey = (id: string) => `user:combat-loadout:${id}`;
export const leaderboardSnapshotKey = 'leaderboard:snapshot';
export const leaderboardRankKey = 'leaderboard:rank';

export const BCRYPT_ROUNDS = 12;
export const PRISMA_UNIQUE_VIOLATION = 'P2002';

export interface CombatStats {
  efficiency: number; // damage dealt per energy consumed (0-100)
  aggression: number; // offensive pressure: shots fired, damage dealt (0-100)
  defense: number; // survival: health remaining, time alive (0-100)
  precision: number; // targeting efficiency: damage dealt / energy consumed (0-100)
  speed: number; // match pace: energy commands / second (0-100)
}

export interface ArenaPreferences {
  defaultRobot: string; // 'unit-01' | 'unit-02'
  soundFx: boolean;
  music: boolean;
  graphicsQuality: string; // 'low' | 'medium' | 'high'
}

export interface NotificationSettings {
  challengeReqs: boolean;
  tournamentAlerts: boolean;
  matchResults: boolean;
}

export const DEFAULT_ARENA_PREFERENCES: ArenaPreferences = {
  defaultRobot: 'unit-01',
  soundFx: true,
  music: true,
  graphicsQuality: 'medium',
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  challengeReqs: true,
  tournamentAlerts: true,
  matchResults: true,
};

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  rank: number;
  memberSince: Date;
  selectedRobotId: string | null;
  selectedColor: string | null;
  arenaPreferences: ArenaPreferences;
  notificationSettings: NotificationSettings;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  matchHistory: MatchSummary[];
  hasGoogle: boolean;
  hasGithub: boolean;
  provider: string | null;
  combatStats: CombatStats;
  achievements?: { achievementId: string; unlockedLevel: number }[];
}

export interface MatchSummary {
  id: string;
  date: Date; // Prisma DateTime; serialised to ISO string by Axios on the client
  type: string;
  opponent: string;
  opponentId: string | null;
  result: 'WIN' | 'LOSS';
  duration: number | null;
}

export interface UserLoadout {
  selectedRobotId: string | null;
  selectedColor: string | null;
}

/** Public-facing profile (no sensitive fields) */
export interface PublicProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  rank: number;
  memberSince: Date;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  matchHistory: MatchSummary[];
  combatStats: CombatStats;
  achievements?: { achievementId: string; unlockedLevel: number }[];
}

/** Shape returned by GET /users/leaderboard */
export interface LeaderboardEntry {
  id: string;
  username: string;
  rank: number;
  isOnline: boolean;
  combatStats?: any;
  _count: { wonMatches: number };
  achievements?: { achievementId: string; unlockedLevel: number }[];
}

/** Maximum number of players returned by the leaderboard endpoint */
export const LEADERBOARD_LIMIT = 10;

/** Redis TTL for the leaderboard snapshot, in seconds */
export const LEADERBOARD_TTL = 20;

/** Shape returned by GET /users/black-market */
export interface BlackMarketData {
  points: number;
  unlockedItems: string[];
  equippedChassis: string;
  equippedPaint: string;
  equippedTracer: string;
}
