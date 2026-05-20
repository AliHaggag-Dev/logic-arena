import type { CampaignDifficulty, CampaignTabId, StarThresholds } from '../constants/campaign.constants';

/** Shape returned by GET /campaign/tabs (server hydrated with unlock/completion state) */
export interface ApiLevelInfo {
  id: string;
  tabId: CampaignTabId;
  order: number;
  title: string;
  description: string;
  hint: string;
  difficulty: CampaignDifficulty;
  pointsReward: number;
  starThresholds?: StarThresholds;
  maxTicks?: number;
  bestStars: number;
  unlocked: boolean;
  completed: boolean;
}

export interface ApiTabInfo {
  id: CampaignTabId;
  label: string;
  description: string;
  levels: ApiLevelInfo[];
}
