export interface AriaInsight {
  id: string;
  userId: string;
  matchId: string | null;
  title: string;
  content: string;
  category: 'performance' | 'energy' | 'tactics' | 'script' | 'general';
  isRead: boolean;
  createdAt: string;
}

export interface InsightsResponse {
  items: AriaInsight[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export const INSIGHT_CATEGORIES = ['performance', 'energy', 'tactics', 'script', 'general'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  performance: 'var(--sem-info)',
  energy: 'var(--sem-warning)',
  tactics: 'var(--sem-success)',
  script: 'var(--accent)',
  general: 'text-text-secondary',
};
