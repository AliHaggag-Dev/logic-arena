'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../../../lib/api-client';
import { AchievementBadge } from '../ui/AchievementBadge';
import { Shimmer } from '../ui/Shimmer';

interface AchievementsListProps {
  userId: string;
  isGuest?: boolean;
  isMobile?: boolean;
}

interface AchievementStage {
  level: number;
  label: string;
  value: number;
  reward: number;
}

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  unlockedLevel: number;
  currentProgress: number;
  stages: AchievementStage[];
}

const TIER_COLORS = [
  'var(--text-primary)/20', // Locked
  'var(--docs-cyan)',       // Alpha
  'var(--docs-purple)',     // Beta
  'var(--docs-orange)',     // Gamma
  'var(--docs-yellow)',     // Delta
];

export const AchievementsList = ({
  userId,
  isGuest = false,
  isMobile = false,
}: AchievementsListProps) => {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(!isGuest);

  useEffect(() => {
    if (isGuest) {
      // Mock empty achievements for guest users
      setAchievements([
        {
          id: 'matches_played',
          title: 'Gladiator',
          description: 'Participate in friendly or ranked matches in the Arena.',
          unlockedLevel: 0,
          currentProgress: 0,
          stages: [
            { level: 1, label: 'Bronze', value: 10, reward: 100 },
            { level: 2, label: 'Silver', value: 50, reward: 250 },
            { level: 3, label: 'Gold', value: 150, reward: 500 },
            { level: 4, label: 'Platinum', value: 300, reward: 1000 },
          ],
        },
        {
          id: 'matches_won',
          title: 'Champion',
          description: 'Defeat your opponents in combat to claim victory.',
          unlockedLevel: 0,
          currentProgress: 0,
          stages: [
            { level: 1, label: 'Bronze', value: 5, reward: 100 },
            { level: 2, label: 'Silver', value: 25, reward: 300 },
            { level: 3, label: 'Gold', value: 75, reward: 600 },
            { level: 4, label: 'Platinum', value: 150, reward: 1200 },
          ],
        },
        {
          id: 'rank_score',
          title: 'Overlord',
          description: 'Reach ELO rank thresholds in the competitive leaderboard.',
          unlockedLevel: 0,
          currentProgress: 0,
          stages: [
            { level: 1, label: 'Bronze', value: 50, reward: 150 },
            { level: 2, label: 'Silver', value: 150, reward: 400 },
            { level: 3, label: 'Gold', value: 300, reward: 800 },
            { level: 4, label: 'Platinum', value: 500, reward: 1500 },
          ],
        },
        {
          id: 'campaign_completed',
          title: 'Grand Strategist',
          description: 'Solve programming challenges in the LeetCode campaign.',
          unlockedLevel: 0,
          currentProgress: 0,
          stages: [
            { level: 1, label: 'Bronze', value: 3, reward: 100 },
            { level: 2, label: 'Silver', value: 8, reward: 300 },
            { level: 3, label: 'Gold', value: 15, reward: 600 },
            { level: 4, label: 'Platinum', value: 22, reward: 1200 },
          ],
        },
      ]);
      setLoading(false);
      return;
    }

    const loadAchievements = async () => {
      try {
        const res = await apiClient.get<AchievementItem[]>(`/users/${userId}/achievements`);
        setAchievements(res.data);
      } catch (err) {
        console.error('Failed to load achievements:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadAchievements();
    }
  }, [userId, isGuest]);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.25em] font-black uppercase text-accent/60 mb-4 pb-2 border-b border-accent/15">
          ACHIEVEMENTS
        </div>
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          {[0, 1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="text-[10px] tracking-[0.25em] font-black uppercase text-accent/60 mb-4 pb-2 border-b border-accent/15">
        ACHIEVEMENTS
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        {achievements.map((ach) => {
          const isMaxed = ach.unlockedLevel >= 4;
          const currentStage = ach.stages.find((s) => s.level === ach.unlockedLevel);
          const nextStage = ach.stages.find((s) => s.level === ach.unlockedLevel + 1) || currentStage;

          const progressMax = nextStage ? nextStage.value : 100;
          const progressPercent = isMaxed
            ? 100
            : Math.min(100, Math.round((ach.currentProgress / progressMax) * 100));

          const activeColor = TIER_COLORS[ach.unlockedLevel] || 'var(--accent)';
          const nextColor = TIER_COLORS[ach.unlockedLevel + 1] || activeColor;

          return (
            <div
              key={ach.id}
              className="bg-card/30 border rounded-xl p-4 flex gap-4 backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:bg-card/50"
              style={{
                borderColor: ach.unlockedLevel > 0
                  ? `color-mix(in srgb, ${activeColor} 18%, transparent)`
                  : 'rgba(var(--accent-rgb), 0.08)',
              }}
            >
              {/* Glow effect for unlocked achievements */}
              {ach.unlockedLevel > 0 && (
                <div
                  className="absolute top-0 left-0 w-1 h-full opacity-60"
                  style={{ backgroundColor: activeColor }}
                />
              )}

              {/* Badge Icon */}
              <AchievementBadge id={ach.id} level={ach.unlockedLevel} size={56} showTooltip={false} />

              {/* Info & Progress */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-xs tracking-wider uppercase text-text-primary">
                      {ach.title}
                    </h3>
                    {ach.unlockedLevel > 0 && (
                      <span
                        className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded border uppercase"
                        style={{
                          color: activeColor,
                          borderColor: `color-mix(in srgb, ${activeColor} 30%, transparent)`,
                          background: `color-mix(in srgb, ${activeColor} 8%, transparent)`,
                        }}
                      >
                        {ach.stages[ach.unlockedLevel - 1]?.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1 leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between items-center text-[9px] font-mono mb-1 font-bold">
                    <span className="text-text-secondary">
                      {isMaxed ? 'MAX LEVEL' : `NEXT: ${nextStage?.label}`}
                    </span>
                    <span style={{ color: isMaxed ? 'var(--docs-yellow)' : 'var(--text-secondary)' }}>
                      {ach.currentProgress} / {isMaxed ? 'MAX' : progressMax}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-bg-primary/60 rounded-full overflow-hidden border border-accent/5">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${progressPercent}%`,
                        background: `linear-gradient(90deg, ${activeColor}, ${nextColor})`,
                        boxShadow: `0 0 6px ${nextColor}80`,
                      }}
                    />
                  </div>

                  {/* Rewards preview */}
                  {!isMaxed && nextStage && (
                    <div className="mt-1.5 text-[8px] text-accent/60 font-mono tracking-wide font-bold">
                      REWARD: +{nextStage.reward} SHOP POINTS ON UNLOCK
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
