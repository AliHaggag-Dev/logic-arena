import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import {
  UserProfile,
  MatchSummary,
  UserLoadout,
  CombatStats,
  ArenaPreferences,
  NotificationSettings,
  BlackMarketData,
  profileKey,
  loadoutKey,
  PROFILE_TTL,
  blackMarketKey,
  combatLoadoutKey,
  DEFAULT_ARENA_PREFERENCES,
  DEFAULT_NOTIFICATION_SETTINGS,
} from './types';
import { DEFAULT_UNLOCKED_ITEMS } from './black-market.constants';

@Injectable()
export class UsersQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    const cached = await this.redis.get<UserProfile>(profileKey(userId));
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        avatarUrl: true,
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
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
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

  async getBlackMarket(userId: string): Promise<BlackMarketData> {
    const cached = await this.redis.get<BlackMarketData>(
      blackMarketKey(userId),
    );
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
        unlockedItems: true,
        equippedChassis: true,
        equippedPaint: true,
        equippedTracer: true,
      },
    });
    if (!user) throw new Error('USER_NOT_FOUND');

    // Ensure all default items are unlocked (retro-fits existing accounts if new defaults are added)
    let unlockedItems = user.unlockedItems;
    const missingDefaults = DEFAULT_UNLOCKED_ITEMS.filter(
      (item) => !unlockedItems.includes(item),
    );

    // Migrate old 'paint-crimson' default → 'paint-default' for pre-existing accounts.
    // 'paint-default' is now the starter paint; crimson must be explicitly purchased.
    const needsPaintMigration =
      user.equippedPaint === 'paint-crimson' &&
      !user.unlockedItems.includes('paint-crimson');

    let equippedPaint = user.equippedPaint;

    if (missingDefaults.length > 0 || needsPaintMigration) {
      if (missingDefaults.length > 0) {
        unlockedItems = [...unlockedItems, ...missingDefaults];
      }
      if (needsPaintMigration) {
        equippedPaint = 'paint-default';
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(missingDefaults.length > 0
            ? { unlockedItems: { set: unlockedItems } }
            : {}),
          ...(needsPaintMigration ? { equippedPaint: 'paint-default' } : {}),
        },
      });
    }

    const data = {
      points: user.points,
      unlockedItems,
      equippedChassis: user.equippedChassis,
      equippedPaint,
      equippedTracer: user.equippedTracer,
    };
    await this.redis.set(blackMarketKey(userId), data, PROFILE_TTL);
    await this.redis.set(
      combatLoadoutKey(userId),
      {
        equippedChassis: data.equippedChassis,
        equippedPaint: data.equippedPaint,
        equippedTracer: data.equippedTracer,
      },
      PROFILE_TTL,
    );
    return data;
  }
}
