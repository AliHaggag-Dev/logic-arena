import { Controller, Get, Header, NotFoundException, Param, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import { SocialQueryService } from '../queries/social-query.service';
import {
  CombatStats,
  LeaderboardEntry,
  LeaderboardPageResponse,
  MatchHistoryResponse,
  LEADERBOARD_DEFAULT_LIMIT,
  LEADERBOARD_MAX_LIMIT,
  LEADERBOARD_TTL,
  leaderboardRankKey,
  leaderboardPageSnapshotKey,
} from '../types';

@SkipThrottle({ auth: true })
@Controller('users')
export class SocialController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly socialQuery: SocialQueryService,
  ) {}

  /** Cast Prisma's JsonValue combatStats to the typed CombatStats shape. */
  private toEntry(
    user: {
      id: string;
      username: string;
      rank: number;
      combatStats: unknown;
      _count: { wonMatches: number };
      achievements: { achievementId: string; unlockedLevel: number }[];
    },
    isOnline: boolean,
  ): LeaderboardEntry {
    return {
      id: user.id,
      username: user.username,
      rank: user.rank,
      combatStats: user.combatStats as CombatStats | null,
      _count: user._count,
      achievements: user.achievements,
      isOnline,
    };
  }

  @Get('leaderboard')
  @Header('Cache-Control', 'public, max-age=20, stale-while-revalidate=10')
  async getLeaderboard(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<LeaderboardPageResponse> {
    const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
    const limit = Math.min(
      LEADERBOARD_MAX_LIMIT,
      Math.max(1, parseInt(limitStr ?? String(LEADERBOARD_DEFAULT_LIMIT), 10) || LEADERBOARD_DEFAULT_LIMIT),
    );
    const offset = (page - 1) * limit;

    const cacheKey = leaderboardPageSnapshotKey(page, limit);
    const cached = await this.redis.get<LeaderboardPageResponse>(cacheKey);
    if (cached) return cached;

    // ── Redis ranked-set path (O(log N) by rank) ────────────────────────────
    if (this.redis.healthy) {
      // ZREVRANGE with WITHSCORES — [id, score, id, score, …]
      const raw = await this.redis
        .getClient()
        .zrevrange(leaderboardRankKey, offset, offset + limit - 1, 'WITHSCORES');

      const ids = raw.filter((_, i) => i % 2 === 0);

      if (ids.length > 0) {
        // Total entries in the sorted set for pagination metadata
        const total = await this.redis.getClient().zcard(leaderboardRankKey);

        const users = await this.prisma.user.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            username: true,
            rank: true,
            combatStats: true,
            _count: { select: { wonMatches: true } },
            achievements: {
              select: { achievementId: true, unlockedLevel: true },
            },
          },
        });

        const byId = new Map(users.map((u) => [u.id, u]));
        const presenceKeys = ids.map((id) => `user:online:${id}`);
        const presenceValues = await this.redis.getClient().mget(...presenceKeys);

        const data = ids
          .map((id, i) => {
            const user = byId.get(id);
            if (!user) return null;
            const isOnline = presenceValues[i] !== null && presenceValues[i] !== undefined;
            return this.toEntry(user, isOnline);
          })
          .filter((entry): entry is LeaderboardEntry => entry !== null);

        if (data.length > 0) {
          const response: LeaderboardPageResponse = {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          };
          await this.redis.set(cacheKey, response, LEADERBOARD_TTL);
          return response;
        }
      }
    }

    // ── DB fallback path ────────────────────────────────────────────────────
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        orderBy: [{ rank: 'desc' }, { wonMatches: { _count: 'desc' } }],
        skip: offset,
        take: limit,
        select: {
          id: true,
          username: true,
          rank: true,
          combatStats: true,
          _count: { select: { wonMatches: true } },
          achievements: {
            select: { achievementId: true, unlockedLevel: true },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    const presenceKeys = users.map((u) => `user:online:${u.id}`);
    const presenceValues: (string | null)[] =
      presenceKeys.length > 0 && this.redis.healthy
        ? await this.redis.getClient().mget(...presenceKeys)
        : [];

    const data: LeaderboardEntry[] = users.map((user, i) =>
      this.toEntry(user, presenceValues[i] !== null && presenceValues[i] !== undefined),
    );

    const response: LeaderboardPageResponse = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.redis.set(cacheKey, response, LEADERBOARD_TTL);
    return response;
  }

  @Get(':username/public')
  async getPublicProfile(@Param('username') username: string) {
    const profile = await this.socialQuery.getPublicProfile(username);

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return profile;
  }

  @Get(':userId/matches')
  async getMatches(
    @Param('userId') userId: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<MatchHistoryResponse> {
    const page = Math.max(1, parseInt(pageStr || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(limitStr || '5', 10) || 5));
    return this.socialQuery.getMatchesPaginated(userId, page, limit);
  }
}
