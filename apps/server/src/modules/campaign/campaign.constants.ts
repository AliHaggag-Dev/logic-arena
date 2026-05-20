// ─────────────────────────────────────────────────────────────────────────────
// Campaign Constants — Phase 6: LeetCode Campaign Architecture
// Source of truth. Levels are split per-tab in ./levels/*.ts
// ─────────────────────────────────────────────────────────────────────────────

import { CONDITIONALS_LEVELS } from './levels/conditionals';
import { LOOPS_LEVELS } from './levels/loops';
import { ARRAYS_LEVELS } from './levels/arrays';
import { DATA_STRUCTURES_LEVELS } from './levels/data-structures';
import { RECURSION_LEVELS } from './levels/recursion';
import { GRAPH_THEORY_LEVELS } from './levels/graph-theory';

export type CampaignDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';

export type CampaignTabId =
  | 'conditionals'
  | 'loops'
  | 'arrays'
  | 'data-structures'
  | 'recursion'
  | 'graph-theory';

export interface CampaignTab {
  id: CampaignTabId;
  label: string;
  description: string;
}

export interface StarThresholds {
  three: number;
  two: number;
  one: number;
}

export interface CampaignLevel {
  id: string;
  tabId: CampaignTabId;
  order: number;
  title: string;
  description: string;
  /** Three progressive hints: [0]=free, [1]=costs 10pts, [2]=costs 25pts */
  hints: [string, string, string];
  /** Short label describing the concept this level teaches, e.g. "IF/ELSE branching" */
  conceptTaught: string;
  difficulty: CampaignDifficulty;
  pointsReward: number;
  enemyScript: string;
  starThresholds?: StarThresholds;
  maxTicks?: number;
  enemyHealth?: number;
}

export const DIFFICULTY_POINTS: Record<CampaignDifficulty, number> = {
  EASY: 50,
  MEDIUM: 120,
  HARD: 300,
  EXTREME: 500,
};

export const CAMPAIGN_TABS: CampaignTab[] = [
  {
    id: 'conditionals',
    label: 'Conditionals',
    description: 'Master IF/ELSE logic to defeat reactive enemies.',
  },
  {
    id: 'loops',
    label: 'Loops',
    description: 'Exploit WHILE patterns to outlast burst-fire opponents.',
  },
  {
    id: 'arrays',
    label: 'Arrays',
    description: 'Process sensor arrays to predict enemy trajectories.',
  },
  {
    id: 'data-structures',
    label: 'Data Structures',
    description: 'Deploy dictionaries and state machines against apex threats.',
  },
  {
    id: 'recursion',
    label: 'Recursion',
    description: 'Unravel nested combat patterns with self-referencing logic.',
  },
  {
    id: 'graph-theory',
    label: 'Graph Theory',
    description:
      'Navigate connected threat networks and pathfinding algorithms.',
  },
];

export const CAMPAIGN_LEVELS: CampaignLevel[] = [
  ...CONDITIONALS_LEVELS,
  ...LOOPS_LEVELS,
  ...ARRAYS_LEVELS,
  ...DATA_STRUCTURES_LEVELS,
  ...RECURSION_LEVELS,
  ...GRAPH_THEORY_LEVELS,
];

export function getLevelById(id: string): CampaignLevel | undefined {
  return CAMPAIGN_LEVELS.find((l) => l.id === id);
}

export function getLevelsByTab(tabId: CampaignTabId): CampaignLevel[] {
  return CAMPAIGN_LEVELS.filter((l) => l.tabId === tabId).sort(
    (a, b) => a.order - b.order,
  );
}

export function getPreviousLevelId(level: CampaignLevel): string | null {
  if (level.order === 1) return null;
  const prev = CAMPAIGN_LEVELS.find(
    (l) => l.tabId === level.tabId && l.order === level.order - 1,
  );
  return prev?.id ?? null;
}
