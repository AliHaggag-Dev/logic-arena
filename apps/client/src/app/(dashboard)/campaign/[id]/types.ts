import { ApiLevelInfo } from '../types/campaign.types';

export interface LevelDetail extends ApiLevelInfo {
  // Add any specific fields if necessary, though ApiLevelInfo has most of them.
}

export type ModalState = "idle" | "loading" | "victory" | "defeat" | "draw";
