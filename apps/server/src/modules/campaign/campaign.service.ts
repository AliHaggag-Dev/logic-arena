import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CAMPAIGN_LEVELS } from './campaign.data';

export const CAMPAIGN_LEVEL_COUNT = 10;

/** sentinel value meaning "all levels cleared" */
const CAMPAIGN_COMPLETE_SENTINEL = CAMPAIGN_LEVEL_COUNT + 1;

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async getLevels(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentLevel = user?.currentLevel ?? 1;
    return CAMPAIGN_LEVELS.map((level) => ({
      id:          level.id,
      name:        level.name,
      difficulty:  level.difficulty,
      description: level.description,
      rewardRank:  level.rewardRank,
      unlocked:    level.id <= currentLevel,
      completed:   level.id < currentLevel,
    }));
  }

  async getLevel(userId: string, levelId: number) {
    if (!Number.isInteger(levelId) || levelId < 1 || levelId > CAMPAIGN_LEVEL_COUNT) {
      throw new Error('LEVEL_NOT_FOUND');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentLevel = user?.currentLevel ?? 1;
    if (levelId > currentLevel) throw new Error('LEVEL_LOCKED');
    const level = CAMPAIGN_LEVELS.find((l) => l.id === levelId);
    if (!level) throw new Error('LEVEL_NOT_FOUND');
    return { ...level, unlocked: true };
  }

  async completeLevel(userId: string, levelId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('USER_NOT_FOUND');
    if (levelId !== user.currentLevel) throw new Error('INVALID_LEVEL');
    const level = CAMPAIGN_LEVELS.find((l) => l.id === levelId);
    if (!level) throw new Error('LEVEL_NOT_FOUND');

    // Advance to sentinel (CAMPAIGN_LEVEL_COUNT + 1) when the last level is beaten
    // so getLevels can mark every level as completed:true (id < sentinel is always true)
    const nextLevel = Math.min(levelId + 1, CAMPAIGN_COMPLETE_SENTINEL);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentLevel: nextLevel,
        rank:         { increment: level.rewardRank },
      },
    });
    return { nextLevel, rewardRank: level.rewardRank };
  }

  /** Returns the enemy script only if the user has unlocked that level. */
  async getEnemyScriptSecure(userId: string, levelId: number): Promise<string> {
    if (!Number.isInteger(levelId) || levelId < 1 || levelId > CAMPAIGN_LEVEL_COUNT) {
      throw new Error('LEVEL_NOT_FOUND');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentLevel = user?.currentLevel ?? 1;
    if (levelId > currentLevel) throw new Error('LEVEL_LOCKED');
    const level = CAMPAIGN_LEVELS.find((l) => l.id === levelId);
    if (!level) throw new Error('LEVEL_NOT_FOUND');
    return level.enemyScript;
  }
}
