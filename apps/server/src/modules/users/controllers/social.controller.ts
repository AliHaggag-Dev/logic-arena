import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import { SocialQueryService } from '../queries/social-query.service';
import {
  LeaderboardEntry,
  MatchHistoryResponse,
  LEADERBOARD_LIMIT,
  LEADERBOARD_TTL,
  leaderboardRankKey,
  leaderboardSnapshotKey,
} from '../types';

@SkipThrottle({ auth: true })
@Controller('users')
export class SocialController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly socialQuery: SocialQueryService,
  ) {}

  @Get('leaderboard')
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const cached = await this.redis.get<LeaderboardEntry[]>(
      leaderboardSnapshotKey,
    );
    if (cached) return cached;

    if (this.redis.healthy) {
      const ranked = await this.redis
        .getClient()
        .zrevrange(leaderboardRankKey, 0, LEADERBOARD_LIMIT - 1, 'WITHSCORES');
      const ids = ranked.filter((_, i) => i % 2 === 0);
      if (ids.length > 0) {
        const users = await this.prisma.user.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            username: true,
            rank: true,
            combatStats: true,
            _count: { select: { wonMatches: true } },
            achievements: {
              select: {
                achievementId: true,
                unlockedLevel: true,
              },
            },
          },
        });
        const byId = new Map(users.map((u) => [u.id, u]));
        const presenceKeys = ids.map((id) => `user:online:${id}`);
        const presenceValues = await this.redis
          .getClient()
          .mget(...presenceKeys);
        const result = ids
          .map((id, i) => {
            const user = byId.get(id);
            return user
              ? {
                  ...user,
                  isOnline:
                    presenceValues[i] !== null &&
                    presenceValues[i] !== undefined,
                }
              : null;
          })
          .filter(
            (entry): entry is any => entry !== null,
          ) as LeaderboardEntry[];

        if (result.length > 0) {
          await this.redis.set(leaderboardSnapshotKey, result, LEADERBOARD_TTL);
          return result;
        }
      }
    }

    const users = await this.prisma.user.findMany({
      orderBy: [{ rank: 'desc' }, { wonMatches: { _count: 'desc' } }],
      take: LEADERBOARD_LIMIT,
      select: {
        id: true,
        username: true,
        rank: true,
        combatStats: true,
        _count: { select: { wonMatches: true } },
        achievements: {
          select: {
            achievementId: true,
            unlockedLevel: true,
          },
        },
      },
    });

    const presenceKeys = users.map((u) => `user:online:${u.id}`);
    const presenceValues: (string | null)[] =
      presenceKeys.length > 0 && this.redis.healthy
        ? await this.redis.getClient().mget(...presenceKeys)
        : [];

    const result: LeaderboardEntry[] = users.map((user, i) => ({
      ...user,
      isOnline: presenceValues[i] !== null && presenceValues[i] !== undefined,
    }));

    await this.redis.set(leaderboardSnapshotKey, result, LEADERBOARD_TTL);
    if (this.redis.healthy && users.length > 0) {
      await this.redis
        .getClient()
        .zadd(
          leaderboardRankKey,
          ...users.flatMap((user) => [String(user.rank), user.id]),
        );
    }

    return result;
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
