import type { ApiLevelInfo } from '../types/campaign.types';

export type LevelDetail = ApiLevelInfo;

export type ModalState = "idle" | "loading" | "fighting" | "victory" | "defeat" | "draw";
