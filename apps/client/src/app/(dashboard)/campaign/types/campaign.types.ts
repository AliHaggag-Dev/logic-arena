import type { CampaignDifficulty, CampaignTabId, StarThresholds } from '../constants/campaign.constants';

/** Shape returned by GET /campaign/levels/:id and within GET /campaign/tabs */
export interface ApiLevelInfo {
  id: string;
  tabId: CampaignTabId;
  order: number;
  title: string;
  description: string;
  /** Three progressive hints. hints[0] is always free; hints[1] costs 10 pts; hints[2] costs 25 pts. */
  hints: string[];
  /** Short label describing the concept this level teaches, e.g. "IF/ELSE branching" */
  conceptTaught: string;
  difficulty: CampaignDifficulty;
  pointsReward: number;
  starThresholds?: StarThresholds;
  maxTicks?: number;
  bestStars: number;
  unlocked: boolean;
  completed: boolean;
  /** Number of paid hints the user has already revealed (0, 1, or 2) */
  revealedHintCount: number;
}

export interface ApiTabInfo {
  id: CampaignTabId;
  label: string;
  description: string;
  levels: ApiLevelInfo[];
}
