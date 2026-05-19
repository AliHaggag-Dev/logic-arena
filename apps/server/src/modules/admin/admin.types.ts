// ── Shared primitives ─────────────────────────────────────────────────────────

export interface DailyCount {
  date: string; // ISO date string yyyy-mm-dd
  count: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface HistogramBucket {
  bucket: string;
  count: number;
}

// ── OverviewStats ─────────────────────────────────────────────────────────────

export interface OverviewStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalMatches: number;
  activeMatches: number;
  totalTournaments: number;
  totalScripts: number;
  totalPoints: number;
  onlineUsers: number;
}

// ── UserStats ─────────────────────────────────────────────────────────────────

export interface TopPlayer {
  id: string;
  username: string;
  rank: number;
  points: number;
}

export interface UserStats {
  totalUsers: number;
  verifiedCount: number;
  providerBreakdown: {
    local: number;
    google: number;
    github: number;
  };
  topPlayersByRank: TopPlayer[];
  registrationTimeline: DailyCount[];
  rankDistribution: HistogramBucket[];
}

// ── MatchStats ────────────────────────────────────────────────────────────────

export interface ActiveUserMatchCount {
  userId: string;
  username: string;
  matchCount: number;
}

export interface MatchStats {
  totalMatches: number;
  avgDuration: number;
  matchesPerDay: DailyCount[];
  matchTypeBreakdown: LabelCount[];
  statusBreakdown: LabelCount[];
  mostActiveUsers: ActiveUserMatchCount[];
}

// ── CampaignStats ─────────────────────────────────────────────────────────────

export interface LevelCompletionRate {
  levelId: string;
  completionCount: number;
  completionRate: number;
}

export interface FunnelStep {
  completedAtLeast: number;
  userCount: number;
}

export interface CampaignStats {
  levelCompletionRates: LevelCompletionRate[];
  mostFailedLevels: LevelCompletionRate[];
  campaignEngagementRate: number;
  progressionFunnel: FunnelStep[];
}

// ── ScriptStats ───────────────────────────────────────────────────────────────

export interface RevisedScript {
  id: string;
  title: string;
  username: string;
  version: number;
}

export interface ScriptStats {
  totalScripts: number;
  avgScriptsPerUser: number;
  mostRevisedScripts: RevisedScript[];
  scriptLengthDistribution: HistogramBucket[];
}

// ── MarketStats ───────────────────────────────────────────────────────────────

export interface MarketStats {
  totalPointsInCirculation: number;
  avgPointsPerUser: number;
  pointsDistribution: HistogramBucket[];
  mostUnlockedItems: LabelCount[];
  popularChassis: LabelCount[];
  popularPaints: LabelCount[];
  popularTracers: LabelCount[];
}

// ── TournamentStats ───────────────────────────────────────────────────────────

export interface TournamentTopWinner {
  userId: string;
  username: string;
  winCount: number;
}

export interface TournamentStats {
  total: number;
  byStatus: {
    waiting: number;
    inProgress: number;
    completed: number;
  };
  mostWins: TournamentTopWinner[];
}

// ── AIStats ───────────────────────────────────────────────────────────────────

export interface AIStats {
  totalInsights: number;
  readCount: number;
  unreadCount: number;
  categoryBreakdown: LabelCount[];
  avgInsightsPerUser: number;
}

// ── HealthStats ───────────────────────────────────────────────────────────────

export interface MemoryUsage {
  rss: number;
  heapUsed: number;
  heapTotal: number;
}

export interface HealthStats {
  uptimeSeconds: number;
  memoryUsage: MemoryUsage;
  nodeVersion: string;
  redisHealthy: boolean;
  dbHealthy: boolean;
}

// ── Paginated user list ───────────────────────────────────────────────────────

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  provider: string | null;
  rank: number;
  points: number;
  createdAt: Date;
}

export interface PaginatedUsers {
  data: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type AdminSortBy = 'rank' | 'points' | 'createdAt';

// ── Full user detail ──────────────────────────────────────────────────────────

export interface AdminUserDetail {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  provider: string | null;
  avatarUrl: string | null;
  rank: number;
  points: number;
  equippedChassis: string;
  equippedPaint: string;
  equippedTracer: string;
  unlockedItems: string[];
  completedCampaignLevels: string[];
  createdAt: Date;
  scripts: AdminScriptSummary[];
  recentMatches: AdminMatchSummary[];
  insights: AdminInsightSummary[];
}

export interface AdminScriptSummary {
  id: string;
  title: string;
  version: number;
  createdAt: Date;
}

export interface AdminMatchSummary {
  id: string;
  type: string;
  status: string;
  duration: number;
  startedAt: Date | null;
  endedAt: Date | null;
}

export interface AdminInsightSummary {
  id: string;
  title: string;
  category: string;
  isRead: boolean;
  createdAt: Date;
}

// ── PATCH /admin/users/:id body ───────────────────────────────────────────────

export interface UpdateUserBody {
  role?: string;
  points?: number;
}
