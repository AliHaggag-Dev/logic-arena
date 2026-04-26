import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { UserProfile, MatchSummary, UserLoadout, CombatStats, profileKey, loadoutKey, PROFILE_TTL } from './types';

@Injectable()
export class UsersQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) { }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const cached = await this.redis.get<UserProfile>(profileKey(userId));
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        rank: true,
        createdAt: true,
        selectedRobotId: true,
        selectedColor: true,
        googleId: true,
        githubId: true,
        provider: true,
        combatStats: true,
        Match: {
          orderBy: { createdAt: 'desc' },
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
    const wins = user.Match.filter((m) => m.winnerId === userId).length;
    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    const matchHistory: MatchSummary[] = user.Match.map((m) => {
      const opponent = m.participants.find((p) => p.id !== userId);
      return {
        id: m.id,
        date: m.createdAt,
        type: m.type,
        opponent: opponent?.username ?? 'N/A',
        result: m.winnerId === userId ? 'WIN' : 'LOSS',
        duration: m.duration,
      };
    });

    const zeroCombatStats: CombatStats = { efficiency: 0, aggression: 0, defense: 0, precision: 0, speed: 0 };

    const profile: UserProfile = {
      username: user.username,
      email: user.email,
      rank: user.rank,
      memberSince: user.createdAt,
      selectedRobotId: user.selectedRobotId,
      selectedColor: user.selectedColor,
      totalMatches,
      wins,
      losses,
      winRate,
      matchHistory,
      hasGoogle: !!user.googleId,
      hasGithub: !!user.githubId,
      provider: user.provider,
      combatStats: (user.combatStats as CombatStats | null) ?? zeroCombatStats,
    };

    await this.redis.set(profileKey(userId), profile, PROFILE_TTL);
    return profile;
  }

  async getLoadout(userId: string): Promise<UserLoadout | null> {
    const cached = await this.redis.get<UserLoadout>(loadoutKey(userId));
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { selectedRobotId: true, selectedColor: true },
    });

    if (!user) return null;

    await this.redis.set(loadoutKey(userId), user, PROFILE_TTL);
    return user;
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, rank: true, createdAt: true },
    });
  }

  async findOneByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: { id: true, email: true, username: true, rank: true, createdAt: true },
    });
  }
}
