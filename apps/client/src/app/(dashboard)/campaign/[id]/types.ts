import { CampaignLevel } from '../types/campaign.types';

export interface LevelDetail extends CampaignLevel {
  enemyScript: string;
}

export type ModalState = "idle" | "loading" | "victory" | "defeat" | "draw";
