export interface AchievementStage {
  level: number; // 1 = Alpha, 2 = Beta, 3 = Gamma, 4 = Delta
  label: string; // 'Alpha' | 'Beta' | 'Gamma' | 'Delta'
  value: number; // Threshold to unlock
  reward: number; // Points reward
}

export interface AchievementMeta {
  id: string;
  title: string;
  description: string;
  stages: AchievementStage[];
}

export const ACHIEVEMENTS: Record<string, AchievementMeta> = {
  matches_played: {
    id: 'matches_played',
    title: 'Gladiator',
    description: 'Participate in friendly or ranked matches in the Arena.',
    stages: [
      { level: 1, label: 'Alpha', value: 10, reward: 100 },
      { level: 2, label: 'Beta', value: 50, reward: 250 },
      { level: 3, label: 'Gamma', value: 150, reward: 500 },
      { level: 4, label: 'Delta', value: 300, reward: 1000 },
    ],
  },
  matches_won: {
    id: 'matches_won',
    title: 'Champion',
    description: 'Defeat your opponents in combat to claim victory.',
    stages: [
      { level: 1, label: 'Alpha', value: 5, reward: 100 },
      { level: 2, label: 'Beta', value: 25, reward: 300 },
      { level: 3, label: 'Gamma', value: 75, reward: 600 },
      { level: 4, label: 'Delta', value: 150, reward: 1200 },
    ],
  },
  rank_score: {
    id: 'rank_score',
    title: 'Overlord',
    description: 'Reach ELO rank thresholds in the competitive leaderboard.',
    stages: [
      { level: 1, label: 'Alpha', value: 50, reward: 150 },
      { level: 2, label: 'Beta', value: 150, reward: 400 },
      { level: 3, label: 'Gamma', value: 300, reward: 800 },
      { level: 4, label: 'Delta', value: 500, reward: 1500 },
    ],
  },
  campaign_completed: {
    id: 'campaign_completed',
    title: 'Grand Strategist',
    description: 'Solve programming challenges in the LeetCode campaign.',
    stages: [
      { level: 1, label: 'Alpha', value: 3, reward: 100 },
      { level: 2, label: 'Beta', value: 8, reward: 300 },
      { level: 3, label: 'Gamma', value: 15, reward: 600 },
      { level: 4, label: 'Delta', value: 25, reward: 1200 }, // Will dynamically adjust to total levels count
    ],
  },
};
