export type ItemCategory = 'chassis' | 'paint' | 'tracer';

export interface BlackMarketItem {
  id: string;
  category: ItemCategory;
  price: number;
  color?: string; // Hex color for paint/tracer
}

/** How many points a player earns for completing one campaign stage. */
export const CAMPAIGN_STAGE_REWARD_POINTS = 100;

/** Items pre-unlocked for every new account (granted on first /black-market fetch). */
export const DEFAULT_UNLOCKED_ITEMS: string[] = [
  'chassis-unit-01',
  'paint-default',
  'tracer-pulse',
];

/** Canonical server-side catalog — single source of truth for prices + categories. */
export const BLACK_MARKET_ITEMS: BlackMarketItem[] = [
  // Robot chassis
  { id: 'chassis-unit-01', category: 'chassis', price: 0 },
  { id: 'chassis-unit-02', category: 'chassis', price: 400 },
  { id: 'chassis-titan', category: 'chassis', price: 1800 },
  { id: 'chassis-sandman', category: 'chassis', price: 2400 },
  { id: 'chassis-iron-mecha', category: 'chassis', price: 700 },
  { id: 'chassis-sentinel', category: 'chassis', price: 1200 },
  { id: 'chassis-crimson-titan', category: 'chassis', price: 3000 },
  // Neon paints
  { id: 'paint-default', category: 'paint', price: 0, color: 'DEFAULT' },
  { id: 'paint-crimson', category: 'paint', price: 300, color: '#ef4444' },
  { id: 'paint-void', category: 'paint', price: 500, color: '#1e1b4b' },
  { id: 'paint-aurora', category: 'paint', price: 700, color: '#10b981' },
  { id: 'paint-solar', category: 'paint', price: 1200, color: '#f97316' },
  // Tracer rounds
  { id: 'tracer-pulse', category: 'tracer', price: 200, color: '#22d3ee' },
  { id: 'tracer-inferno', category: 'tracer', price: 450, color: '#fb923c' },
  { id: 'tracer-ghost', category: 'tracer', price: 600, color: '#c084fc' },
];
