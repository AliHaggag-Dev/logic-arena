// ─────────────────────────────────────────────────────────────────────────────
// Campaign Constants — Client-side types + tab metadata.
// Level data is fetched from the server via GET /campaign/tabs.
// ─────────────────────────────────────────────────────────────────────────────

export type CampaignDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';

export type CampaignTabId =
  | 'conditionals'
  | 'loops'
  | 'arrays'
  | 'data-structures'
  | 'recursion'
  | 'graph-theory';

export interface CampaignTabMeta {
  id: CampaignTabId;
  label: string;
  description: string;
}

export const DIFFICULTY_POINTS: Record<CampaignDifficulty, number> = {
  EASY: 50,
  MEDIUM: 120,
  HARD: 300,
  EXTREME: 500,
};

export const CAMPAIGN_TABS: CampaignTabMeta[] = [
  { id: 'conditionals',        label: 'Conditionals',        description: 'Master IF/ELSE logic to defeat reactive enemies.' },
  { id: 'loops',               label: 'Loops',               description: 'Exploit WHILE patterns to outlast burst-fire opponents.' },
  { id: 'arrays',              label: 'Arrays',              description: 'Process sensor arrays to predict enemy trajectories.' },
  { id: 'data-structures',     label: 'Data Structures',     description: 'Deploy dictionaries and state machines against apex threats.' },
  { id: 'recursion',           label: 'Recursion',           description: 'Unravel nested combat patterns with self-referencing logic.' },
  { id: 'graph-theory',        label: 'Graph Theory',        description: 'Navigate connected threat networks and pathfinding algorithms.' },
];
