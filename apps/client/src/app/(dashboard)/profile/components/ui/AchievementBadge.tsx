import React from 'react';
import { Shield, Trophy, Zap, Brain, HelpCircle } from 'lucide-react';

interface AchievementBadgeProps {
  id: string;
  level: number; // 0 = Locked, 1 = Alpha, 2 = Beta, 3 = Gamma, 4 = Delta
  size?: number;
  showTooltip?: boolean;
}

const TIER_COLORS = [
  'var(--text-primary)/20', // Locked
  'var(--docs-cyan)',       // Alpha
  'var(--docs-purple)',     // Beta
  'var(--docs-orange)',     // Gamma
  'var(--docs-yellow)',     // Delta
];

const TIER_LABELS = ['LOCKED', 'ALPHA', 'BETA', 'GAMMA', 'DELTA'];

export const AchievementBadge = ({
  id,
  level,
  size = 40,
  showTooltip = true,
}: AchievementBadgeProps) => {
  const color = TIER_COLORS[level] || 'var(--accent)';
  const label = TIER_LABELS[level] || 'LOCKED';

  let IconComponent = HelpCircle;
  if (id === 'matches_played') IconComponent = Shield;
  else if (id === 'matches_won') IconComponent = Trophy;
  else if (id === 'rank_score') IconComponent = Zap;
  else if (id === 'campaign_completed') IconComponent = Brain;

  const tooltipText = `${id.replace('_', ' ').toUpperCase()}: ${label} TIER`;

  return (
    <div
      className="relative flex items-center justify-center group shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-300 ${
          level > 0
            ? 'border shadow-[0_0_12px_rgba(var(--accent-rgb),0.1)]'
            : 'border border-dashed opacity-40'
        }`}
        style={{
          borderColor: `color-mix(in srgb, ${color} ${level > 0 ? '40%' : '15%'}, transparent)`,
          background: `color-mix(in srgb, ${color} ${level > 0 ? '6%' : '2%'}, transparent)`,
        }}
      />
      <IconComponent
        className={`transition-all duration-300 ${level > 0 ? 'scale-100' : 'scale-90 opacity-30'}`}
        style={{
          width: size * 0.5,
          height: size * 0.5,
          color: level > 0 ? color : 'var(--text-secondary)',
          filter: level > 0 ? `drop-shadow(0 0 4px ${color})` : 'none',
        }}
      />
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-bg-primary border border-accent/25 px-2 py-1 rounded text-[8px] font-bold font-mono tracking-wider uppercase whitespace-nowrap z-50 text-text-primary pointer-events-none shadow-md">
          {tooltipText}
        </div>
      )}
    </div>
  );
};
