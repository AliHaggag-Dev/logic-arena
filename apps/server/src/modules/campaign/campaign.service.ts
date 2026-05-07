import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import {
  CAMPAIGN_LEVELS,
  CAMPAIGN_TABS,
  CampaignLevel,
  CampaignTabId,
  getLevelById,
  getLevelsByTab,
  getPreviousLevelId,
} from './campaign.constants';

// ── Public response shapes ────────────────────────────────────────────────────

export interface LevelResponse extends Omit<CampaignLevel, 'enemyScript'> {
  unlocked: boolean;
  completed: boolean;
}

export interface TabWithLevels {
  id: CampaignTabId;
  label: string;
  description: string;
  levels: LevelResponse[];
}

// ── Errors ────────────────────────────────────────────────────────────────────
export const ERR_LEVEL_NOT_FOUND = 'LEVEL_NOT_FOUND';
export const ERR_LEVEL_LOCKED = 'LEVEL_LOCKED';
export const ERR_USER_NOT_FOUND = 'USER_NOT_FOUND';
export const ERR_ALREADY_CLAIMED = 'ALREADY_CLAIMED';

const CAMPAIGN_CACHE_TTL = 120;
const campaignProgressKey = (userId: string) => `campaign:progress:${userId}`;
const campaignTabsKey = (userId: string) => `campaign:tabs:${userId}`;
const campaignLevelKey = (userId: string, levelId: string) => `campaign:level:${userId}:${levelId}`;

@Injectable()
export class CampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) { }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private isLevelUnlocked(level: CampaignLevel, completedIds: string[]): boolean {
    if (level.order === 1) return true;
    const prevId = getPreviousLevelId(level);
    return prevId !== null && completedIds.includes(prevId);
  }

  private buildLevelResponse(
    level: CampaignLevel,
    completedIds: string[],
  ): LevelResponse {
    const unlocked = this.isLevelUnlocked(level, completedIds);
    const completed = completedIds.includes(level.id);
    // Strip enemyScript from the public payload
    const { enemyScript: _omit, ...rest } = level;
    void _omit;
    return { ...rest, unlocked, completed };
  }

  private async getCompletedLevelIds(userId: string): Promise<string[]> {
    const cached = await this.redis.get<string[]>(campaignProgressKey(userId));
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { completedCampaignLevels: true },
    });
    const completed = user?.completedCampaignLevels ?? [];
    await this.redis.set(campaignProgressKey(userId), completed, CAMPAIGN_CACHE_TTL);
    return completed;
  }

  private async invalidateUserCampaignCache(userId: string): Promise<void> {
    await this.redis.del(campaignProgressKey(userId), campaignTabsKey(userId));
    await this.redis.delPattern(campaignLevelKey(userId, '*'));
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Returns all tabs with per-level unlock/completion state for the user. */
  async getTabsWithLevels(userId: string): Promise<TabWithLevels[]> {
    const cached = await this.redis.get<TabWithLevels[]>(campaignTabsKey(userId));
    if (cached) return cached;

    const completed = await this.getCompletedLevelIds(userId);

    const tabs = CAMPAIGN_TABS.map((tab) => ({
      ...tab,
      levels: getLevelsByTab(tab.id).map((level) =>
        this.buildLevelResponse(level, completed),
      ),
    }));
    await this.redis.set(campaignTabsKey(userId), tabs, CAMPAIGN_CACHE_TTL);
    return tabs;
  }

  /** Returns a single level's public info (no enemy script). Throws if locked. */
  async getLevel(userId: string, levelId: string): Promise<LevelResponse> {
    const cached = await this.redis.get<LevelResponse>(campaignLevelKey(userId, levelId));
    if (cached) return cached;

    const level = getLevelById(levelId);
    if (!level) throw new Error(ERR_LEVEL_NOT_FOUND);

    const completed = await this.getCompletedLevelIds(userId);

    if (!this.isLevelUnlocked(level, completed)) throw new Error(ERR_LEVEL_LOCKED);

    const response = this.buildLevelResponse(level, completed);
    await this.redis.set(campaignLevelKey(userId, levelId), response, CAMPAIGN_CACHE_TTL);
    return response;
  }

  /**
   * Returns the enemy script ONLY if the user has unlocked that level.
   * Called by MatchesController before running the fight simulation.
   */
  async getEnemyScriptSecure(userId: string, levelId: string): Promise<string> {
    const level = getLevelById(levelId);
    if (!level) throw new Error(ERR_LEVEL_NOT_FOUND);

    const completed = await this.getCompletedLevelIds(userId);

    if (!this.isLevelUnlocked(level, completed)) throw new Error(ERR_LEVEL_LOCKED);

    return level.enemyScript;
  }

  /**
   * Records a win: adds levelId to completedCampaignLevels (idempotent)
   * and awards the level's pointsReward to the user's wallet.
   * Returns reward info. Throws ERR_ALREADY_CLAIMED if already in array
   * (caller may choose to ignore or surface this as a no-op).
   */
  async completeLevel(
    userId: string,
    levelId: string,
  ): Promise<{ pointsAwarded: number; alreadyClaimed: boolean }> {
    const level = getLevelById(levelId);
    if (!level) throw new Error(ERR_LEVEL_NOT_FOUND);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { completedCampaignLevels: true },
    });
    if (!user) throw new Error(ERR_USER_NOT_FOUND);

    const alreadyClaimed = user.completedCampaignLevels.includes(levelId);

    if (alreadyClaimed) {
      return { pointsAwarded: 0, alreadyClaimed: true };
    }

    // Verify the user actually had this level unlocked before awarding points.
    if (!this.isLevelUnlocked(level, user.completedCampaignLevels)) {
      throw new Error(ERR_LEVEL_LOCKED);
    }

    // Atomic guard: only award if the level is still not present at update time.
    // This prevents concurrent completion requests from double-awarding points.
    const updateResult = await this.prisma.user.updateMany({
      where: {
        id: userId,
        NOT: { completedCampaignLevels: { has: levelId } },
      },
      data: {
        completedCampaignLevels: { push: levelId },
        points: { increment: level.pointsReward },
      },
    });

    if (updateResult.count === 0) {
      return { pointsAwarded: 0, alreadyClaimed: true };
    }

    await this.invalidateUserCampaignCache(userId);
    await this.redis.del(`user:profile:${userId}`, `user:black-market:${userId}`);

    return { pointsAwarded: level.pointsReward, alreadyClaimed: false };
  }

  /** Convenience: all levels flat (used by matches controller for validation) */
  getAllLevelIds(): string[] {
    return CAMPAIGN_LEVELS.map((l) => l.id);
  }
}
