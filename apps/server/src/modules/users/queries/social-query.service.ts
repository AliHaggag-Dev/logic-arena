import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import {
  PublicProfile,
  MatchSummary,
  MatchHistoryResponse,
  CombatStats,
  publicProfileKey,
  PUBLIC_PROFILE_TTL,
} from '../types';
import { AchievementsService } from '../../achievements/achievements.service';

@Injectable()
export class SocialQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async getPublicProfile(username: string): Promise<PublicProfile | null> {
    const cacheKey = publicProfileKey(username);
    const cached = await this.redis.get<PublicProfile>(cacheKey);
    if (cached) return cached;

    const basicUser = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!basicUser) return null;

    // Self-healing check: sync achievements for historical data
    await this.achievementsService.checkAll(basicUser.id);

    const user = await this.prisma.user.findUnique({
      where: { id: basicUser.id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        rank: true,
        createdAt: true,
        combatStats: true,
        achievements: {
          select: {
            achievementId: true,
            unlockedLevel: true,
          },
        },
        _count: {
          select: {
            Match: true,
            wonMatches: true,
          },
        },
      },
    });

    if (!user) return null;

    const totalMatches = user._count.Match;
    const wins = user._count.wonMatches;
    const losses = Math.max(0, totalMatches - wins);
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    const zeroCombatStats: CombatStats = {
      efficiency: 0,
      aggression: 0,
      defense: 0,
      precision: 0,
      speed: 0,
    };

    const profile: PublicProfile = {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      rank: user.rank,
      memberSince: user.createdAt,
      totalMatches,
      wins,
      losses,
      winRate,
      matchHistory: [], // Populated dynamically by frontend via paginated endpoint
      combatStats: (user.combatStats as CombatStats | null) ?? zeroCombatStats,
      achievements: user.achievements,
      isOnline: false,
      inMatch: false,
    };

    if (this.redis.healthy) {
      const presenceValue = await this.redis.get(`user:online:${user.id}`);
      profile.isOnline = presenceValue !== null && presenceValue !== undefined;
    }

    await this.redis.set(cacheKey, profile, PUBLIC_PROFILE_TTL);
    return profile;
  }

  async getMatchesPaginated(userId: string, page: number, limit: number): Promise<MatchHistoryResponse> {
    const skip = (page - 1) * limit;

    const [total, matches] = await Promise.all([
      this.prisma.match.count({
        where: { participants: { some: { id: userId } } },
      }),
      this.prisma.match.findMany({
        where: { participants: { some: { id: userId } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          winnerId: true,
          duration: true,
          createdAt: true,
          participants: { select: { id: true, username: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const matchHistory: MatchSummary[] = matches.map((m) => {
      const opponent = m.participants.find((p) => p.id !== userId);
      return {
        id: m.id,
        date: m.createdAt,
        type: m.type,
        opponent: opponent?.username ?? 'N/A',
        opponentId: opponent?.id ?? null,
        result: m.winnerId === userId ? 'WIN' : 'LOSS',
        duration: m.duration,
      };
    });

    return {
      matches: matchHistory,
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        rank: true,
        createdAt: true,
      },
    });
  }

  async findOneByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        rank: true,
        createdAt: true,
      },
    });
  }
}
