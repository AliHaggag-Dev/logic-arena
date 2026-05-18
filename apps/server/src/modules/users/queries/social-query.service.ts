import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import {
  PublicProfile,
  MatchSummary,
  CombatStats,
  publicProfileKey,
  PUBLIC_PROFILE_TTL,
} from '../types';

@Injectable()
export class SocialQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getPublicProfile(username: string): Promise<PublicProfile | null> {
    const cacheKey = publicProfileKey(username);
    const cached = await this.redis.get<PublicProfile>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        rank: true,
        createdAt: true,
        combatStats: true,
        Match: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            type: true,
            winnerId: true,
            duration: true,
            createdAt: true,
            participants: { select: { id: true, username: true } },
          },
        },
      },
    });

    if (!user) return null;

    const totalMatches = user.Match.length;
    const wins = user.Match.filter((m) => m.winnerId === user.id).length;
    const losses = totalMatches - wins;
    const winRate =
      totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    const matchHistory: MatchSummary[] = user.Match.map((m) => {
      const opponent = m.participants.find((p) => p.id !== user.id);
      return {
        id: m.id,
        date: m.createdAt,
        type: m.type,
        opponent: opponent?.username ?? 'N/A',
        opponentId: opponent?.id ?? null,
        result: m.winnerId === user.id ? 'WIN' : 'LOSS',
        duration: m.duration,
      };
    });

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
      matchHistory,
      combatStats: (user.combatStats as CombatStats | null) ?? zeroCombatStats,
    };

    await this.redis.set(cacheKey, profile, PUBLIC_PROFILE_TTL);
    return profile;
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
