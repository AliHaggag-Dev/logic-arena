import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import {
  AIStats,
  AdminSortBy,
  AdminUserDetail,
  AdminUserListItem,
  CampaignStats,
  DailyCount,
  FunnelStep,
  HealthStats,
  HistogramBucket,
  LabelCount,
  LevelCompletionRate,
  MarketStats,
  MatchStats,
  OverviewStats,
  PaginatedUsers,
  ScriptStats,
  TournamentStats,
  TournamentTopWinner,
  UpdateUserBody,
  UserStats,
} from './admin.types';

// ── Date helpers ──────────────────────────────────────────────────────────────

const DAYS_30 = 30;
const HISTOGRAM_CHUNK_RANK = 200;
const HISTOGRAM_CHUNK_POINTS = 500;
const HISTOGRAM_CHUNK_SCRIPT_LEN = 500;
const TOP_PLAYERS_LIMIT = 10;
const TOP_SCRIPTS_LIMIT = 10;
const MOST_ACTIVE_USERS_LIMIT = 10;
const TOP_TOURNAMENT_WINNERS_LIMIT = 5;
const TOP_FAILED_LEVELS_LIMIT = 10;
const DEFAULT_PAGE_SIZE = 20;
const OVERVIEW_CACHE_KEY = 'admin:stats:overview';
const OVERVIEW_CACHE_TTL = 60;
const HEALTH_CACHE_KEY = 'admin:health';
const HEALTH_CACHE_TTL = 30;

function startOfToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfThisWeek(): Date {
  return daysAgo(7);
}

function startOfThisMonth(): Date {
  return daysAgo(30);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Build a contiguous 30-day timeline filled with zeroes for missing days. */
function buildTimeline(
  raw: { date: Date | string; count: bigint | number }[],
): DailyCount[] {
  const map = new Map<string, number>();
  for (const row of raw) {
    const key = typeof row.date === 'string' ? row.date : toIsoDate(row.date);
    map.set(key, Number(row.count));
  }
  const result: DailyCount[] = [];
  for (let i = DAYS_30 - 1; i >= 0; i--) {
    const key = toIsoDate(daysAgo(i));
    result.push({ date: key, count: map.get(key) ?? 0 });
  }
  return result;
}

/** Generic numeric histogram bucketing. */
function buildHistogram(
  values: number[],
  chunkSize: number,
): HistogramBucket[] {
  const map = new Map<number, number>();
  for (const v of values) {
    const bucket = Math.floor(v / chunkSize) * chunkSize;
    map.set(bucket, (map.get(bucket) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucket, count]) => ({
      bucket: `${bucket}–${bucket + chunkSize - 1}`,
      count,
    }));
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── Overview ────────────────────────────────────────────────────────────────

  async getOverviewStats(): Promise<OverviewStats> {
    const cached = await this.redis.get<OverviewStats>(OVERVIEW_CACHE_KEY);
    if (cached) return cached;

    const today = startOfToday();
    const weekAgo = startOfThisWeek();
    const monthAgo = startOfThisMonth();

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalMatches,
      activeMatches,
      totalTournaments,
      totalScripts,
      pointsAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.match.count(),
      this.prisma.match.count({ where: { status: 'in_progress' } }),
      this.prisma.tournament.count(),
      this.prisma.robotScript.count(),
      this.prisma.user.aggregate({ _sum: { points: true } }),
    ]);

    const result: OverviewStats = {
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalMatches,
      activeMatches,
      totalTournaments,
      totalScripts,
      totalPoints: pointsAgg._sum.points ?? 0,
      onlineUsers: 0,
    };

    await this.redis.set(OVERVIEW_CACHE_KEY, result, OVERVIEW_CACHE_TTL);
    return result;
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  async getUserStats(): Promise<UserStats> {
    const [totalUsers, verifiedCount, providerCounts, topPlayers, allUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isVerified: true } }),
        this.prisma.user.groupBy({
          by: ['provider'],
          _count: { provider: true },
        }),
        this.prisma.user.findMany({
          select: { id: true, username: true, rank: true, points: true },
          orderBy: { rank: 'desc' },
          take: TOP_PLAYERS_LIMIT,
        }),
        this.prisma.user.findMany({
          select: { createdAt: true, rank: true },
          where: { createdAt: { gte: daysAgo(DAYS_30) } },
        }),
      ]);

    // provider breakdown
    const providerBreakdown = { local: 0, google: 0, github: 0 };
    for (const row of providerCounts) {
      const p = (row.provider ?? 'local').toLowerCase();
      if (p === 'local') providerBreakdown.local += row._count.provider;
      else if (p === 'google') providerBreakdown.google += row._count.provider;
      else if (p === 'github') providerBreakdown.github += row._count.provider;
    }

    // registration timeline (30 days)
    const timelineRaw = await this.prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT DATE_TRUNC('day', "createdAt") AS date, COUNT(*) AS count
      FROM "User"
      WHERE "createdAt" >= ${daysAgo(DAYS_30)}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `;
    const registrationTimeline = buildTimeline(timelineRaw);

    // rank distribution histogram
    const ranks = allUsers.map((u) => u.rank);
    const rankDistribution = buildHistogram(ranks, HISTOGRAM_CHUNK_RANK);

    return {
      totalUsers,
      verifiedCount,
      providerBreakdown,
      topPlayersByRank: topPlayers,
      registrationTimeline,
      rankDistribution,
    };
  }

  // ── Matches ──────────────────────────────────────────────────────────────────

  async getMatchStats(): Promise<MatchStats> {
    const [totalMatches, durationAgg, typeGroups, statusGroups] =
      await Promise.all([
        this.prisma.match.count(),
        this.prisma.match.aggregate({ _avg: { duration: true } }),
        this.prisma.match.groupBy({ by: ['type'], _count: { type: true } }),
        this.prisma.match.groupBy({ by: ['status'], _count: { status: true } }),
      ]);

    // matches per day (30 days) via raw query
    const perDayRaw = await this.prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT DATE_TRUNC('day', "startedAt") AS date, COUNT(*) AS count
      FROM "Match"
      WHERE "startedAt" >= ${daysAgo(DAYS_30)}
      GROUP BY DATE_TRUNC('day', "startedAt")
      ORDER BY date ASC
    `;
    const matchesPerDay = buildTimeline(perDayRaw);

    // most active users (by match participation count)
    const participationRaw = await this.prisma.$queryRaw<
      { userId: string; username: string; matchCount: bigint }[]
    >`
      SELECT mp."userId", u.username, COUNT(*) AS "matchCount"
      FROM "MatchParticipant" mp
      JOIN "User" u ON u.id = mp."userId"
      GROUP BY mp."userId", u.username
      ORDER BY "matchCount" DESC
      LIMIT ${MOST_ACTIVE_USERS_LIMIT}
    `;

    return {
      totalMatches,
      avgDuration: Math.round(durationAgg._avg.duration ?? 0),
      matchesPerDay,
      matchTypeBreakdown: typeGroups.map((g) => ({
        label: g.type,
        count: g._count.type,
      })),
      statusBreakdown: statusGroups.map((g) => ({
        label: g.status,
        count: g._count.status,
      })),
      mostActiveUsers: participationRaw.map((r) => ({
        userId: r.userId,
        username: r.username,
        matchCount: Number(r.matchCount),
      })),
    };
  }

  // ── Campaign ─────────────────────────────────────────────────────────────────

  async getCampaignStats(): Promise<CampaignStats> {
    const totalUsers = await this.prisma.user.count();
    const users = await this.prisma.user.findMany({
      select: { completedCampaignLevels: true },
    });

    // count completions per level
    const levelMap = new Map<string, number>();
    for (const user of users) {
      for (const levelId of user.completedCampaignLevels) {
        levelMap.set(levelId, (levelMap.get(levelId) ?? 0) + 1);
      }
    }

    const levelCompletionRates: LevelCompletionRate[] = Array.from(
      levelMap.entries(),
    )
      .map(([levelId, completionCount]) => ({
        levelId,
        completionCount,
        completionRate:
          totalUsers > 0
            ? Math.round((completionCount / totalUsers) * 100 * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.completionCount - a.completionCount);

    // most failed levels = lowest completion rates (that were attempted)
    const mostFailedLevels = [...levelCompletionRates]
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, TOP_FAILED_LEVELS_LIMIT);

    // campaign engagement = users who completed at least 1 level
    const engagedUsers = users.filter(
      (u) => u.completedCampaignLevels.length > 0,
    ).length;
    const campaignEngagementRate =
      totalUsers > 0
        ? Math.round((engagedUsers / totalUsers) * 100 * 10) / 10
        : 0;

    // progression funnel: how many users completed at least N levels
    const maxLevels = levelCompletionRates.length;
    const funnelSteps = Math.min(maxLevels, 10);
    const progressionFunnel: FunnelStep[] = [];
    for (let n = 1; n <= funnelSteps; n++) {
      const count = users.filter(
        (u) => u.completedCampaignLevels.length >= n,
      ).length;
      progressionFunnel.push({ completedAtLeast: n, userCount: count });
    }

    return {
      levelCompletionRates,
      mostFailedLevels,
      campaignEngagementRate,
      progressionFunnel,
    };
  }

  // ── Scripts ──────────────────────────────────────────────────────────────────

  async getScriptStats(): Promise<ScriptStats> {
    const [totalScripts, userCount, topRevised, allScripts] = await Promise.all(
      [
        this.prisma.robotScript.count(),
        this.prisma.user.count(),
        this.prisma.robotScript.findMany({
          select: {
            id: true,
            title: true,
            version: true,
            user: { select: { username: true } },
          },
          orderBy: { version: 'desc' },
          take: TOP_SCRIPTS_LIMIT,
        }),
        this.prisma.robotScript.findMany({
          select: { content: true },
        }),
      ],
    );

    const avgScriptsPerUser =
      userCount > 0 ? Math.round((totalScripts / userCount) * 10) / 10 : 0;

    const lengths = allScripts.map((s) => s.content.length);
    const scriptLengthDistribution = buildHistogram(
      lengths,
      HISTOGRAM_CHUNK_SCRIPT_LEN,
    );

    return {
      totalScripts,
      avgScriptsPerUser,
      mostRevisedScripts: topRevised.map((s) => ({
        id: s.id,
        title: s.title,
        username: s.user.username,
        version: s.version,
      })),
      scriptLengthDistribution,
    };
  }

  // ── Market ───────────────────────────────────────────────────────────────────

  async getMarketStats(): Promise<MarketStats> {
    const users = await this.prisma.user.findMany({
      select: {
        points: true,
        unlockedItems: true,
        equippedChassis: true,
        equippedPaint: true,
        equippedTracer: true,
      },
    });

    const total = users.length;
    const totalPointsInCirculation = users.reduce(
      (sum, u) => sum + u.points,
      0,
    );
    const avgPointsPerUser =
      total > 0 ? Math.round(totalPointsInCirculation / total) : 0;

    const pointsDistribution = buildHistogram(
      users.map((u) => u.points),
      HISTOGRAM_CHUNK_POINTS,
    );

    // count item unlock frequencies
    const itemFreq = new Map<string, number>();
    for (const user of users) {
      for (const item of user.unlockedItems) {
        itemFreq.set(item, (itemFreq.get(item) ?? 0) + 1);
      }
    }
    const sortedItems = (items: [string, number][]): LabelCount[] =>
      items
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([label, count]) => ({ label, count }));

    const mostUnlockedItems = sortedItems([...itemFreq.entries()]);

    const chassisFreq = new Map<string, number>();
    const paintFreq = new Map<string, number>();
    const tracerFreq = new Map<string, number>();
    for (const user of users) {
      chassisFreq.set(
        user.equippedChassis,
        (chassisFreq.get(user.equippedChassis) ?? 0) + 1,
      );
      paintFreq.set(
        user.equippedPaint,
        (paintFreq.get(user.equippedPaint) ?? 0) + 1,
      );
      tracerFreq.set(
        user.equippedTracer,
        (tracerFreq.get(user.equippedTracer) ?? 0) + 1,
      );
    }

    return {
      totalPointsInCirculation,
      avgPointsPerUser,
      pointsDistribution,
      mostUnlockedItems,
      popularChassis: sortedItems([...chassisFreq.entries()]),
      popularPaints: sortedItems([...paintFreq.entries()]),
      popularTracers: sortedItems([...tracerFreq.entries()]),
    };
  }

  // ── Tournaments ──────────────────────────────────────────────────────────────

  async getTournamentStats(): Promise<TournamentStats> {
    const [total, statusGroups, winnerRaw] = await Promise.all([
      this.prisma.tournament.count(),
      this.prisma.tournament.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.$queryRaw<
        { winnerId: string; username: string; winCount: bigint }[]
      >`
        SELECT t."winnerId", u.username, COUNT(*) AS "winCount"
        FROM "Tournament" t
        JOIN "User" u ON u.id = t."winnerId"
        WHERE t."winnerId" IS NOT NULL
        GROUP BY t."winnerId", u.username
        ORDER BY "winCount" DESC
        LIMIT ${TOP_TOURNAMENT_WINNERS_LIMIT}
      `,
    ]);

    const byStatus = { waiting: 0, inProgress: 0, completed: 0 };
    for (const g of statusGroups) {
      const s = g.status.toUpperCase();
      if (s === 'WAITING') byStatus.waiting = g._count.status;
      else if (s === 'IN_PROGRESS') byStatus.inProgress = g._count.status;
      else if (s === 'COMPLETED') byStatus.completed = g._count.status;
    }

    const mostWins: TournamentTopWinner[] = winnerRaw.map((r) => ({
      userId: r.winnerId,
      username: r.username,
      winCount: Number(r.winCount),
    }));

    return { total, byStatus, mostWins };
  }

  // ── AI Insights ───────────────────────────────────────────────────────────────

  async getAIStats(): Promise<AIStats> {
    const [totalInsights, readCount, categoryGroups, userCount] =
      await Promise.all([
        this.prisma.ariaInsight.count(),
        this.prisma.ariaInsight.count({ where: { isRead: true } }),
        this.prisma.ariaInsight.groupBy({
          by: ['category'],
          _count: { category: true },
        }),
        this.prisma.user.count(),
      ]);

    return {
      totalInsights,
      readCount,
      unreadCount: totalInsights - readCount,
      categoryBreakdown: categoryGroups.map((g) => ({
        label: g.category,
        count: g._count.category,
      })),
      avgInsightsPerUser:
        userCount > 0 ? Math.round((totalInsights / userCount) * 10) / 10 : 0,
    };
  }

  // ── Health ────────────────────────────────────────────────────────────────────

  async getHealthStats(): Promise<HealthStats> {
    const cached = await this.redis.get<HealthStats>(HEALTH_CACHE_KEY);
    if (cached) return cached;

    const mem = process.memoryUsage();

    let redisHealthy = false;
    try {
      redisHealthy = this.redis.healthy;
      if (redisHealthy) {
        await this.redis.getClient().ping();
      }
    } catch {
      redisHealthy = false;
    }

    let dbHealthy = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }

    const result: HealthStats = {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
      },
      nodeVersion: process.version,
      redisHealthy,
      dbHealthy,
    };

    await this.redis.set(HEALTH_CACHE_KEY, result, HEALTH_CACHE_TTL);
    return result;
  }

  // ── Paginated user list ───────────────────────────────────────────────────────

  async getUserList(
    page: number,
    pageSize: number,
    search: string | undefined,
    sortBy: AdminSortBy,
  ): Promise<PaginatedUsers> {
    const skip = (page - 1) * pageSize;
    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const orderBy =
      sortBy === 'rank'
        ? { rank: 'desc' as const }
        : sortBy === 'points'
          ? { points: 'desc' as const }
          : { createdAt: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isVerified: true,
          provider: true,
          rank: true,
          points: true,
          createdAt: true,
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map<AdminUserListItem>((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        isVerified: u.isVerified,
        provider: u.provider,
        rank: u.rank,
        points: u.points,
        createdAt: u.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  // ── Full user detail ──────────────────────────────────────────────────────────

  async getUserDetail(id: string): Promise<AdminUserDetail> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        RobotScript: {
          select: { id: true, title: true, version: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        Match: {
          select: {
            id: true,
            type: true,
            status: true,
            duration: true,
            startedAt: true,
            endedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    const insights = await this.prisma.ariaInsight.findMany({
      where: { userId: id },
      select: {
        id: true,
        title: true,
        category: true,
        isRead: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      provider: user.provider,
      avatarUrl: user.avatarUrl,
      rank: user.rank,
      points: user.points,
      equippedChassis: user.equippedChassis,
      equippedPaint: user.equippedPaint,
      equippedTracer: user.equippedTracer,
      unlockedItems: user.unlockedItems,
      completedCampaignLevels: user.completedCampaignLevels,
      createdAt: user.createdAt,
      scripts: user.RobotScript,
      recentMatches: user.Match,
      insights,
    };
  }

  // ── Update user ───────────────────────────────────────────────────────────────

  async updateUser(id: string, body: UpdateUserBody): Promise<AdminUserDetail> {
    await this.prisma.user.update({
      where: { id },
      data: {
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.points !== undefined ? { points: body.points } : {}),
      },
    });
    return this.getUserDetail(id);
  }

  // ── Default page size constant (exported for controller) ──────────────────────
  static readonly DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;
}
