import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import {
  AdminSortBy,
  AdminUserDetail,
  AdminUserListItem,
  HealthStats,
  OverviewStats,
  PaginatedUsers,
  UpdateUserBody,
} from './admin.types';
import {
  DEFAULT_PAGE_SIZE,
  HEALTH_CACHE_KEY,
  HEALTH_CACHE_TTL,
  OVERVIEW_CACHE_KEY,
  OVERVIEW_CACHE_TTL,
  startOfThisMonth,
  startOfThisWeek,
  startOfToday,
} from './admin-utils';

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
