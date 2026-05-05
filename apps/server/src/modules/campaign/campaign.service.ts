import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
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
export const ERR_LEVEL_LOCKED    = 'LEVEL_LOCKED';
export const ERR_USER_NOT_FOUND  = 'USER_NOT_FOUND';
export const ERR_ALREADY_CLAIMED = 'ALREADY_CLAIMED';

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

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
    const unlocked  = this.isLevelUnlocked(level, completedIds);
    const completed = completedIds.includes(level.id);
    // Strip enemyScript from the public payload
    const { enemyScript: _omit, ...rest } = level;
    void _omit;
    return { ...rest, unlocked, completed };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Returns all tabs with per-level unlock/completion state for the user. */
  async getTabsWithLevels(userId: string): Promise<TabWithLevels[]> {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { completedCampaignLevels: true },
    });
    const completed = user?.completedCampaignLevels ?? [];

    return CAMPAIGN_TABS.map((tab) => ({
      ...tab,
      levels: getLevelsByTab(tab.id).map((level) =>
        this.buildLevelResponse(level, completed),
      ),
    }));
  }

  /** Returns a single level's public info (no enemy script). Throws if locked. */
  async getLevel(userId: string, levelId: string): Promise<LevelResponse> {
    const level = getLevelById(levelId);
    if (!level) throw new Error(ERR_LEVEL_NOT_FOUND);

    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { completedCampaignLevels: true },
    });
    const completed = user?.completedCampaignLevels ?? [];

    if (!this.isLevelUnlocked(level, completed)) throw new Error(ERR_LEVEL_LOCKED);

    return this.buildLevelResponse(level, completed);
  }

  /**
   * Returns the enemy script ONLY if the user has unlocked that level.
   * Called by MatchesController before running the fight simulation.
   */
  async getEnemyScriptSecure(userId: string, levelId: string): Promise<string> {
    const level = getLevelById(levelId);
    if (!level) throw new Error(ERR_LEVEL_NOT_FOUND);

    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { completedCampaignLevels: true },
    });
    const completed = user?.completedCampaignLevels ?? [];

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
      where:  { id: userId },
      select: { completedCampaignLevels: true },
    });
    if (!user) throw new Error(ERR_USER_NOT_FOUND);

    const alreadyClaimed = user.completedCampaignLevels.includes(levelId);

    if (!alreadyClaimed) {
      // Verify the user actually had this level unlocked before awarding points
      if (!this.isLevelUnlocked(level, user.completedCampaignLevels)) {
        throw new Error(ERR_LEVEL_LOCKED);
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          completedCampaignLevels: {
            push: levelId,
          },
          points: { increment: level.pointsReward },
        },
      });
    }

    return { pointsAwarded: alreadyClaimed ? 0 : level.pointsReward, alreadyClaimed };
  }

  /** Convenience: all levels flat (used by matches controller for validation) */
  getAllLevelIds(): string[] {
    return CAMPAIGN_LEVELS.map((l) => l.id);
  }
}
