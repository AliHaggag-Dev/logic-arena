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
import { AchievementsService } from '../achievements/achievements.service';
// ── Hint cost constants ───────────────────────────────────────────────────────

const HINT_COSTS: Record<1 | 2, number> = { 1: 10, 2: 25 };

// ── Public response shapes ────────────────────────────────────────────────────

export interface LevelResponse extends Omit<CampaignLevel, 'enemyScript'> {
  unlocked: boolean;
  completed: boolean;
  bestStars: number;
  revealedHintCount: number;
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

export interface RevealHintResult {
  hint: string;
  pointsDeducted: number;
  remainingPoints: number;
}

// ── Errors ────────────────────────────────────────────────────────────────────
export const ERR_LEVEL_NOT_FOUND = 'LEVEL_NOT_FOUND';
export const ERR_LEVEL_LOCKED = 'LEVEL_LOCKED';
export const ERR_USER_NOT_FOUND = 'USER_NOT_FOUND';
export const ERR_ALREADY_CLAIMED = 'ALREADY_CLAIMED';
export const ERR_INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS';
export const ERR_INVALID_HINT_INDEX = 'INVALID_HINT_INDEX';

const CAMPAIGN_CACHE_TTL = 120;
const STARS_CACHE_TTL = 0; // persistent — no TTL (0 means no expiry in our redis wrapper)
const HINTS_CACHE_TTL = 0; // persistent — revealed hints must survive sessions

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
export const campaignHintsKey = (userId: string, levelId: string) =>
  `campaign:hints:${userId}:${levelId}`;

@Injectable()
export class CampaignService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly achievementsService: AchievementsService,
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

  private async getBestStars(userId: string, levelId: string): Promise<number> {
    if (userId === 'guest') return 0;
    const s = await this.redis.get<number>(campaignStarsKey(userId, levelId));
    console.log(`[DEBUG getBestStars] user=${userId} level=${levelId} s=${s}`);
    return s ?? 0;
  }

  private async setBestStars(
    userId: string,
    levelId: string,
    stars: number,
  ): Promise<boolean> {
    const current = await this.getBestStars(userId, levelId);
    console.log(
      `[DEBUG setBestStars] user=${userId} level=${levelId} stars=${stars} current=${current}`,
    );
    if (stars > current) {
      await this.redis.set(
        campaignStarsKey(userId, levelId),
        stars,
        STARS_CACHE_TTL,
      );
      console.log(`[DEBUG setBestStars] SET REDIS DONE`);
      return true;
    }
    return false;
  }

  private async getRevealedHintCount(
    userId: string,
    levelId: string,
  ): Promise<number> {
    if (userId === 'guest') return 0;
    const indices = await this.redis.get<number[]>(
      campaignHintsKey(userId, levelId),
    );
    return indices ? indices.length : 0;
  }

  private async getRevealedHintIndices(
    userId: string,
    levelId: string,
  ): Promise<number[]> {
    if (userId === 'guest') return [];
    return (
      (await this.redis.get<number[]>(campaignHintsKey(userId, levelId))) ?? []
    );
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
    preFetchedStars?: number,
    preFetchedHintCount?: number,
  ): Promise<LevelResponse> {
    const unlocked = this.isLevelUnlocked(level, completedIds);
    const completed = completedIds.includes(level.id);
    const bestStars = preFetchedStars !== undefined
      ? preFetchedStars
      : (completed ? await this.getBestStars(userId, level.id) : 0);
    const revealedHintCount = preFetchedHintCount !== undefined
      ? preFetchedHintCount
      : (unlocked ? await this.getRevealedHintCount(userId, level.id) : 0);
    // Strip enemyScript from the public payload
    const { enemyScript: _omit, ...rest } = level;
    void _omit;
    return { ...rest, unlocked, completed, bestStars, revealedHintCount };
  }

  private async getCompletedLevelIds(userId: string): Promise<string[]> {
    if (userId === 'guest') return [];

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
    const version = userId !== 'guest' ? await this.getCampaignCacheVersion(userId) : 0;

    if (userId !== 'guest') {
      const cacheKey = campaignTabsKey(userId, version);
      const cachedTabs = await this.redis.get<TabWithLevels[]>(cacheKey);
      if (cachedTabs) {
        return cachedTabs;
      }
    }

    const completed = await this.getCompletedLevelIds(userId);

    const allLevels = CAMPAIGN_TABS.flatMap((tab) => getLevelsByTab(tab.id));
    const starKeys = allLevels.map((level) => campaignStarsKey(userId, level.id));
    const hintKeys = allLevels.map((level) => campaignHintsKey(userId, level.id));

    let starsResults: (number | null)[] = [];
    let hintsResults: (number[] | null)[] = [];

    if (userId !== 'guest' && this.redis.healthy && allLevels.length > 0) {
      const client = this.redis.getClient();
      const [rawStars, rawHints] = await Promise.all([
        client.mget(...starKeys),
        client.mget(...hintKeys),
      ]);
      starsResults = rawStars.map((val: string | null) => (val ? (JSON.parse(val) as number) : null));
      hintsResults = rawHints.map((val: string | null) => (val ? (JSON.parse(val) as number[]) : null));
    }

    const starsMap = new Map<string, number>();
    const hintsMap = new Map<string, number>();

    allLevels.forEach((level, idx) => {
      const starVal = starsResults[idx] ?? 0;
      const hintVal = hintsResults[idx]?.length ?? 0;
      starsMap.set(level.id, starVal);
      hintsMap.set(level.id, hintVal);
    });

    const tabsPromises = CAMPAIGN_TABS.map(async (tab) => ({
      ...tab,
      levels: await Promise.all(
        getLevelsByTab(tab.id).map((level) =>
          this.buildLevelResponse(
            level,
            completed,
            userId,
            starsMap.get(level.id) ?? 0,
            hintsMap.get(level.id) ?? 0,
          ),
        ),
      ),
    }));
    const tabs = await Promise.all(tabsPromises);

    if (userId !== 'guest') {
      const cacheKey = campaignTabsKey(userId, version);
      await this.redis.set(cacheKey, tabs, CAMPAIGN_CACHE_TTL);
    }

    return tabs;
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
   * Reveals a hint for the user by deducting points atomically.
   * hintIndex 1 costs 10 points, hintIndex 2 costs 25 points.
   * Idempotent: if the hint was already revealed, returns it without re-charging.
   */
  async revealHint(
    userId: string,
    levelId: string,
    hintIndex: 1 | 2,
  ): Promise<RevealHintResult> {
    if (hintIndex !== 1 && hintIndex !== 2) {
      throw new Error(ERR_INVALID_HINT_INDEX);
    }

    const level = getLevelById(levelId);
    if (!level) throw new Error(ERR_LEVEL_NOT_FOUND);

    const completed = await this.getCompletedLevelIds(userId);
    if (!this.isLevelUnlocked(level, completed)) {
      throw new Error(ERR_LEVEL_LOCKED);
    }

    // Check if already revealed — idempotent, no charge
    const revealedIndices = await this.getRevealedHintIndices(userId, levelId);
    if (revealedIndices.includes(hintIndex)) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });
      return {
        hint: level.hints[hintIndex],
        pointsDeducted: 0,
        remainingPoints: user?.points ?? 0,
      };
    }

    const cost = HINT_COSTS[hintIndex];

    // Atomically deduct points — only succeeds if user has enough
    const updateResult = await this.prisma.user.updateMany({
      where: { id: userId, points: { gte: cost } },
      data: { points: { decrement: cost } },
    });

    if (updateResult.count === 0) {
      // Either user not found or insufficient points — check which
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });
      if (!user) throw new Error(ERR_USER_NOT_FOUND);
      throw new Error(ERR_INSUFFICIENT_POINTS);
    }

    // Record revealed index in Redis
    const updatedIndices = [...revealedIndices, hintIndex];
    await this.redis.set(
      campaignHintsKey(userId, levelId),
      updatedIndices,
      HINTS_CACHE_TTL,
    );

    await this.invalidateUserCampaignCache(userId);

    // Fetch updated points
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    return {
      hint: level.hints[hintIndex],
      pointsDeducted: cost,
      remainingPoints: updatedUser?.points ?? 0,
    };
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
      const updated = await this.setBestStars(userId, levelId, stars);
      if (updated) {
        await this.invalidateUserCampaignCache(userId);
      }
      return { pointsAwarded: 0, alreadyClaimed: true, stars };
    }

    // Verify the user actually had this level unlocked before awarding points.
    if (!this.isLevelUnlocked(level, user.completedCampaignLevels)) {
      throw new Error(ERR_LEVEL_LOCKED);
    }

    const bonusPoints = stars === 3 ? Math.floor(level.pointsReward * 0.5) : 0;
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
      const updated = await this.setBestStars(userId, levelId, stars);
      if (updated) {
        await this.invalidateUserCampaignCache(userId);
      }
      return { pointsAwarded: 0, alreadyClaimed: true, stars };
    }

    await this.setBestStars(userId, levelId, stars);
    await this.invalidateUserCampaignCache(userId);
    await this.achievementsService.checkAll(userId);
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
