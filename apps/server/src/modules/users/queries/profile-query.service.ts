import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import {
  UserProfile,
  MatchSummary,
  CombatStats,
  ArenaPreferences,
  NotificationSettings,
  profileKey,
  loadoutKey,
  PROFILE_TTL,
  DEFAULT_ARENA_PREFERENCES,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../types';
import { AchievementsService } from '../../achievements/achievements.service';

@Injectable()
export class ProfileQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    const cached = await this.redis.get<UserProfile>(profileKey(userId));
    if (cached) return cached;

    // Self-healing check: sync achievements for historical data
    await this.achievementsService.checkAll(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
        rank: true,
        createdAt: true,
        selectedRobotId: true,
        selectedColor: true,
        arenaPreferences: true,
        notificationSettings: true,
        googleId: true,
        githubId: true,
        provider: true,
        combatStats: true,
        achievements: {
          select: {
            achievementId: true,
            unlockedLevel: true,
          },
        },
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
    const wins = user.Match.filter((m) => m.winnerId === userId).length;
    const losses = totalMatches - wins;
    const winRate =
      totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    const matchHistory: MatchSummary[] = user.Match.map((m) => {
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

    const zeroCombatStats: CombatStats = {
      efficiency: 0,
      aggression: 0,
      defense: 0,
      precision: 0,
      speed: 0,
    };

    const profile: UserProfile = {
      id: userId,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      rank: user.rank,
      memberSince: user.createdAt,
      selectedRobotId: user.selectedRobotId,
      selectedColor: user.selectedColor,
      arenaPreferences:
        (user.arenaPreferences as unknown as ArenaPreferences | null) ??
        DEFAULT_ARENA_PREFERENCES,
      notificationSettings:
        (user.notificationSettings as unknown as NotificationSettings | null) ??
        DEFAULT_NOTIFICATION_SETTINGS,
      totalMatches,
      wins,
      losses,
      winRate,
      matchHistory,
      hasGoogle: !!user.googleId,
      hasGithub: !!user.githubId,
      provider: user.provider,
      combatStats: (user.combatStats as CombatStats | null) ?? zeroCombatStats,
      achievements: user.achievements,
    };

    await this.redis.set(profileKey(userId), profile, PROFILE_TTL);
    return profile;
  }

  async getLoadout(userId: string) {
    const cached = await this.redis.get<{
      selectedRobotId: string | null;
      selectedColor: string | null;
    }>(loadoutKey(userId));
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { selectedRobotId: true, selectedColor: true },
    });

    if (!user) return null;

    await this.redis.set(loadoutKey(userId), user, PROFILE_TTL);
    return user;
  }
}
