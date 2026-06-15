import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  AIStats,
  CampaignStats,
  EngagementStats,
  MarketStats,
  MatchStats,
  ScriptStats,
  TournamentStats,
  TournamentTopWinner,
  UserStats,
  LabelCount,
  FunnelStep,
} from './admin.types';
import {
  DAYS_30,
  HISTOGRAM_CHUNK_RANK,
  HISTOGRAM_CHUNK_POINTS,
  HISTOGRAM_CHUNK_SCRIPT_LEN,
  TOP_PLAYERS_LIMIT,
  TOP_SCRIPTS_LIMIT,
  MOST_ACTIVE_USERS_LIMIT,
  TOP_TOURNAMENT_WINNERS_LIMIT,
  TOP_FAILED_LEVELS_LIMIT,
  daysAgo,
  buildTimeline,
  buildHistogram,
} from './admin-utils';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const levelCompletionRates = Array.from(levelMap.entries())
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

  async getEngagementStats(): Promise<EngagementStats> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86_400_000);
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
    const monthAgo = new Date(now.getTime() - 30 * 86_400_000);

    const [
      totalUsers,
      dailyParticipants,
      weeklyParticipants,
      monthlyParticipants,
      activityTimelineRaw,
      totalParticipants,
    ] = await Promise.all([
      this.prisma.user.count(),
      // DAU: distinct users who participated in matches in last 24h
      this.prisma.matchParticipant.findMany({
        select: { userId: true },
        where: { createdAt: { gte: dayAgo } },
        distinct: ['userId'],
      }),
      // WAU: distinct users in last 7 days
      this.prisma.matchParticipant.findMany({
        select: { userId: true },
        where: { createdAt: { gte: weekAgo } },
        distinct: ['userId'],
      }),
      // MAU: distinct users in last 30 days
      this.prisma.matchParticipant.findMany({
        select: { userId: true },
        where: { createdAt: { gte: monthAgo } },
        distinct: ['userId'],
      }),
      // activity per day over 30 days
      this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('day', mp."createdAt") AS date, COUNT(DISTINCT mp."userId") AS count
        FROM "MatchParticipant" mp
        WHERE mp."createdAt" >= ${daysAgo(DAYS_30)}
        GROUP BY DATE_TRUNC('day', mp."createdAt")
        ORDER BY date ASC
      `,
      // total participants ever
      this.prisma.matchParticipant.count(),
    ]);

    const dailyActiveUsers = dailyParticipants.length;
    const weeklyActiveUsers = weeklyParticipants.length;
    const monthlyActiveUsers = monthlyParticipants.length;
    const activityTimeline = buildTimeline(activityTimelineRaw);

    const completedMatches = await this.prisma.match.count({
      where: { status: 'completed' },
    });
    const totalMatches = await this.prisma.match.count();
    const matchCompletionRate =
      totalMatches > 0
        ? Math.round((completedMatches / totalMatches) * 100 * 10) / 10
        : 0;

    const avgMatchesPerActiveUser =
      monthlyActiveUsers > 0
        ? Math.round((totalParticipants / monthlyActiveUsers) * 10) / 10
        : 0;

    const engagementRate =
      totalUsers > 0
        ? Math.round((monthlyActiveUsers / totalUsers) * 100 * 10) / 10
        : 0;

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      engagementRate,
      activityTimeline,
      matchCompletionRate,
      avgMatchesPerActiveUser,
    };
  }
}
