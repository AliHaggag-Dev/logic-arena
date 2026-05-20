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
  bestStars: number;
}

export interface TabWithLevels {
  id: CampaignTabId;
  label: string;
  description: string;
  levels: LevelResponse[];
}

export interface CompleteLevelResult {
  pointsAwarded: number;
  alreadyClaimed: boolean;
  stars: number;
}

// ── Errors ────────────────────────────────────────────────────────────────────
export const ERR_LEVEL_NOT_FOUND = 'LEVEL_NOT_FOUND';
export const ERR_LEVEL_LOCKED = 'LEVEL_LOCKED';
export const ERR_USER_NOT_FOUND = 'USER_NOT_FOUND';
export const ERR_ALREADY_CLAIMED = 'ALREADY_CLAIMED';

const CAMPAIGN_CACHE_TTL = 120;
const STARS_CACHE_TTL = 0; // persistent — no TTL (0 means no expiry in our redis wrapper)

export const campaignVersionKey = (userId: string) =>
  `campaign:version:${userId}`;
export const campaignProgressKey = (userId: string, version: number) =>
  `campaign:v${version}:progress:${userId}`;
export const campaignTabsKey = (userId: string, version: number) =>
  `campaign:v${version}:tabs:${userId}`;
export const campaignLevelKey = (
  userId: string,
  levelId: string,
  version: number,
) => `campaign:v${version}:level:${userId}:${levelId}`;
export const campaignStarsKey = (userId: string, levelId: string) =>
  `campaign:stars:${userId}:${levelId}`;

@Injectable()
export class CampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── Internal helpers ──────────────────────────────────────────────────────

  private isLevelUnlocked(
    level: CampaignLevel,
    completedIds: string[],
  ): boolean {
    if (level.order === 1) return true;
    const prevId = getPreviousLevelId(level);
    return prevId !== null && completedIds.includes(prevId);
  }

  private async getBestStars(
    userId: string,
    levelId: string,
  ): Promise<number> {
    return (await this.redis.get<number>(campaignStarsKey(userId, levelId))) ?? 0;
  }

  private async setBestStars(
    userId: string,
    levelId: string,
    stars: number,
  ): Promise<void> {
    const current = await this.getBestStars(userId, levelId);
    if (stars > current) {
      await this.redis.set(campaignStarsKey(userId, levelId), stars, STARS_CACHE_TTL);
    }
  }

  private calculateStars(
    level: CampaignLevel,
    fightDurationTicks: number,
  ): number {
    const thresholds = level.starThresholds;
    const maxTicks = level.maxTicks ?? 1500;

    if (!thresholds) {
      // No thresholds defined — default: any win = 1 star
      return fightDurationTicks <= maxTicks ? 1 : 0;
    }

    if (fightDurationTicks > maxTicks) return 0;
    if (fightDurationTicks <= thresholds.three) return 3;
    if (fightDurationTicks <= thresholds.two) return 2;
    if (fightDurationTicks <= thresholds.one) return 1;
    return 0;
  }

  private async buildLevelResponse(
    level: CampaignLevel,
    completedIds: string[],
    userId: string,
  ): Promise<LevelResponse> {
    const unlocked = this.isLevelUnlocked(level, completedIds);
    const completed = completedIds.includes(level.id);
    const bestStars = completed ? await this.getBestStars(userId, level.id) : 0;
    // Strip enemyScript from the public payload
    const { enemyScript: _omit, ...rest } = level;
    void _omit;
    return { ...rest, unlocked, completed, bestStars };
  }

  private async getCompletedLevelIds(userId: string): Promise<string[]> {
    const version = await this.getCampaignCacheVersion(userId);
    const cached = await this.redis.get<string[]>(
      campaignProgressKey(userId, version),
    );
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { completedCampaignLevels: true },
    });
    const completed = user?.completedCampaignLevels ?? [];
    await this.redis.set(
      campaignProgressKey(userId, version),
      completed,
      CAMPAIGN_CACHE_TTL,
    );
    return completed;
  }

  private async getCampaignCacheVersion(userId: string): Promise<number> {
    return (await this.redis.get<number>(campaignVersionKey(userId))) ?? 0;
  }

  private async invalidateUserCampaignCache(userId: string): Promise<void> {
    await this.redis.incr(campaignVersionKey(userId), CAMPAIGN_CACHE_TTL);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Returns all tabs with per-level unlock/completion state for the user. */
  async getTabsWithLevels(userId: string): Promise<TabWithLevels[]> {
    const completed = await this.getCompletedLevelIds(userId);

    const tabsPromises = CAMPAIGN_TABS.map(async (tab) => ({
      ...tab,
      levels: await Promise.all(
        getLevelsByTab(tab.id).map((level) =>
          this.buildLevelResponse(level, completed, userId),
        ),
      ),
    }));
    return Promise.all(tabsPromises);
  }

  /** Returns a single level's public info (no enemy script). Throws if locked. */
  async getLevel(userId: string, levelId: string): Promise<LevelResponse> {
    const level = getLevelById(levelId);
    if (!level) throw new Error(ERR_LEVEL_NOT_FOUND);

    const completed = await this.getCompletedLevelIds(userId);

    if (!this.isLevelUnlocked(level, completed))
      throw new Error(ERR_LEVEL_LOCKED);

    return this.buildLevelResponse(level, completed, userId);
  }

  /**
   * Returns the enemy script ONLY if the user has unlocked that level.
   * Called by MatchesController before running the fight simulation.
   */
  async getEnemyScriptSecure(userId: string, levelId: string): Promise<string> {
    const level = getLevelById(levelId);
    if (!level) throw new Error(ERR_LEVEL_NOT_FOUND);

    const completed = await this.getCompletedLevelIds(userId);

    if (!this.isLevelUnlocked(level, completed))
      throw new Error(ERR_LEVEL_LOCKED);

    return level.enemyScript;
  }

  /**
   * Records a win: adds levelId to completedCampaignLevels (idempotent)
   * and awards the level's pointsReward to the user's wallet.
   * Accepts fightDurationTicks to compute star rating.
   * Returns { pointsAwarded, alreadyClaimed, stars }.
   * 3-star wins receive a 50% bonus on top of base pointsReward.
   */
  async completeLevel(
    userId: string,
    levelId: string,
    fightDurationTicks: number,
  ): Promise<CompleteLevelResult> {
    const level = getLevelById(levelId);
    if (!level) throw new Error(ERR_LEVEL_NOT_FOUND);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { completedCampaignLevels: true },
    });
    if (!user) throw new Error(ERR_USER_NOT_FOUND);

    const stars = this.calculateStars(level, fightDurationTicks);

    const alreadyClaimed = user.completedCampaignLevels.includes(levelId);

    if (alreadyClaimed) {
      // Still update best stars even on repeat visits
      await this.setBestStars(userId, levelId, stars);
      return { pointsAwarded: 0, alreadyClaimed: true, stars };
    }

    // Verify the user actually had this level unlocked before awarding points.
    if (!this.isLevelUnlocked(level, user.completedCampaignLevels)) {
      throw new Error(ERR_LEVEL_LOCKED);
    }

    const bonusPoints =
      stars === 3 ? Math.floor(level.pointsReward * 0.5) : 0;
    const totalPoints = level.pointsReward + bonusPoints;

    // Atomic guard: only award if the level is still not present at update time.
    // This prevents concurrent completion requests from double-awarding points.
    const updateResult = await this.prisma.user.updateMany({
      where: {
        id: userId,
        NOT: { completedCampaignLevels: { has: levelId } },
      },
      data: {
        completedCampaignLevels: { push: levelId },
        points: { increment: totalPoints },
      },
    });

    if (updateResult.count === 0) {
      await this.setBestStars(userId, levelId, stars);
      return { pointsAwarded: 0, alreadyClaimed: true, stars };
    }

    await this.setBestStars(userId, levelId, stars);
    await this.invalidateUserCampaignCache(userId);
    await this.redis.del(
      `user:profile:${userId}`,
      `user:black-market:${userId}`,
    );

    return { pointsAwarded: totalPoints, alreadyClaimed: false, stars };
  }

  /** Convenience: all levels flat (used by matches controller for validation) */
  getAllLevelIds(): string[] {
    return CAMPAIGN_LEVELS.map((l) => l.id);
  }
}
