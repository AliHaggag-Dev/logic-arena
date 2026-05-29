import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { ACHIEVEMENTS, AchievementMeta } from './achievements.constants';
import { CAMPAIGN_LEVELS } from '../campaign/campaign.constants';
import { Prisma } from '@prisma/client';
import { profileKey, publicProfileKey, blackMarketKey, leaderboardSnapshotKey } from '../users/types';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Fetches all achievements for a user, combining definitions with progress and unlock state.
   */
  async getUserAchievements(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { rank: true, completedCampaignLevels: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
    });

    const achievementMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]));
    const totalLevelsCount = CAMPAIGN_LEVELS.length;

    return Object.values(ACHIEVEMENTS).map((meta) => {
      const dbRecord = achievementMap.get(meta.id);
      const unlockedLevel = dbRecord?.unlockedLevel ?? 0;
      const currentProgress = dbRecord?.currentProgress ?? 0;

      // Adjust campaign Delta tier dynamically to campaign level count
      const stages = meta.stages.map((stage) => {
        if (meta.id === 'campaign_completed' && stage.level === 4) {
          return { ...stage, value: totalLevelsCount };
        }
        return stage;
      });

      return {
        id: meta.id,
        title: meta.title,
        description: meta.description,
        unlockedLevel,
        currentProgress,
        stages,
      };
    });
  }

  /**
   * Re-evaluates all achievements for a user. Syncs progress, updates level state,
   * pays out campaign points reward, and invalidates user and global caches.
   * Runs inside an optional or required transaction context.
   */
  async checkAll(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;

    // 1. Fetch user parameters
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { username: true, rank: true, completedCampaignLevels: true },
    });

    if (!user) return;

    // 2. Compute actual progress metrics
    const totalMatches = await prismaClient.match.count({
      where: { participants: { some: { id: userId } } },
    });

    const wins = await prismaClient.match.count({
      where: { winnerId: userId },
    });

    const campaignCompleted = user.completedCampaignLevels.length;
    const totalCampaignLevels = CAMPAIGN_LEVELS.length;

    // 3. Evaluate each achievement
    const achievementsToUpdate = [
      { id: 'matches_played', value: totalMatches },
      { id: 'matches_won', value: wins },
      { id: 'rank_score', value: user.rank },
      { id: 'campaign_completed', value: campaignCompleted },
    ];

    let totalPointsReward = 0;
    const achievementsResults: { id: string; oldLevel: number; newLevel: number }[] = [];

    // Get current DB achievements
    const existingAchievements = await prismaClient.userAchievement.findMany({
      where: { userId },
    });
    const existingMap = new Map(existingAchievements.map((a) => [a.achievementId, a]));

    for (const tracker of achievementsToUpdate) {
      const meta = ACHIEVEMENTS[tracker.id];
      if (!meta) continue;

      const currentVal = tracker.value;
      const dbRecord = existingMap.get(tracker.id);
      const oldUnlockedLevel = dbRecord?.unlockedLevel ?? 0;

      // Determine highest satisfied stage level
      let highestSatisfiedLevel = 0;
      for (const stage of meta.stages) {
        const threshold = (tracker.id === 'campaign_completed' && stage.level === 4)
          ? totalCampaignLevels
          : stage.value;

        if (currentVal >= threshold) {
          highestSatisfiedLevel = stage.level;
        }
      }

      achievementsResults.push({
        id: tracker.id,
        oldLevel: oldUnlockedLevel,
        newLevel: highestSatisfiedLevel,
      });

      // Calculate reward if level increased
      if (highestSatisfiedLevel > oldUnlockedLevel) {
        for (const stage of meta.stages) {
          if (stage.level > oldUnlockedLevel && stage.level <= highestSatisfiedLevel) {
            totalPointsReward += stage.reward;
          }
        }
      }

      // Upsert record
      await prismaClient.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: tracker.id } },
        create: {
          userId,
          achievementId: tracker.id,
          unlockedLevel: highestSatisfiedLevel,
          currentProgress: currentVal,
          unlockedAt: highestSatisfiedLevel > 0 ? new Date() : null,
        },
        update: {
          unlockedLevel: highestSatisfiedLevel,
          currentProgress: currentVal,
          unlockedAt: highestSatisfiedLevel > oldUnlockedLevel ? new Date() : undefined,
          lastUpdated: new Date(),
        },
      });
    }

    // 4. Payout point rewards if any new tiers unlocked
    if (totalPointsReward > 0) {
      this.logger.log(`User ${user.username} (${userId}) unlocked achievements! Awarding ${totalPointsReward} points.`);
      await prismaClient.user.update({
        where: { id: userId },
        data: { points: { increment: totalPointsReward } },
      });
    }

    // 5. Invalidate relevant caches (after tx completes or immediately)
    if (this.redis) {
      const keysToInvalidate = [
        profileKey(userId),
        publicProfileKey(user.username),
        blackMarketKey(userId),
        leaderboardSnapshotKey,
      ];
      await this.redis.del(...keysToInvalidate);
    }
  }
}
