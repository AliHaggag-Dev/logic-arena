export const DIFFICULTY_CONFIG: Record<string, {
  text: string;
  border: string;
  bg: string;
  glow: string;
  color: string;
  label: string;
}> = {
  EASY: {
    text:   'text-emerald-400',
    border: 'border-emerald-500/40',
    bg:     'bg-emerald-500/10',
    glow:   'rgba(52,211,153,0.5)',
    color:  '#34d399',
    label:  'EASY',
  },
  MEDIUM: {
    text:   'text-yellow-400',
    border: 'border-yellow-500/40',
    bg:     'bg-yellow-500/10',
    glow:   'rgba(234,179,8,0.5)',
    color:  '#eab308',
    label:  'MEDIUM',
  },
  HARD: {
    text:   'text-orange-400',
    border: 'border-orange-500/40',
    bg:     'bg-orange-500/10',
    glow:   'rgba(249,115,22,0.5)',
    color:  '#f97316',
    label:  'HARD',
  },
  EXTREME: {
    text:   'text-red-400',
    border: 'border-red-500/40',
    bg:     'bg-red-500/10',
    glow:   'rgba(239,68,68,0.6)',
    color:  '#ef4444',
    label:  'EXTREME',
  },
  // Legacy alias kept for backward compatibility
  ELITE: {
    text:   'text-red-400',
    border: 'border-red-500/40',
    bg:     'bg-red-500/10',
    glow:   'rgba(239,68,68,0.6)',
    color:  '#ef4444',
    label:  'ELITE',
  },
};
