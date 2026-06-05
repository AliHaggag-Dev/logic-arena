'use client';

import React from 'react';
import type { FriendPresenceStatus } from '@/lib/api/friends.types';

interface FriendStatusBadgeProps {
  status: FriendPresenceStatus;
  size?: 'sm' | 'md';
}

const sizeStyles = {
  sm: 'text-[8px] px-1.5 py-0.5 gap-1',
  md: 'text-[9px] px-2 py-0.5 gap-1.5',
} as const;

const dotSizeStyles = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
} as const;

export function FriendStatusBadge({ status, size = 'md' }: FriendStatusBadgeProps) {
  const config: Record<
    FriendPresenceStatus,
    { label: string; dotClass: string; badgeClass: string; animate: boolean }
  > = {
    online: {
      label: 'ONLINE',
      dotClass: 'bg-sem-success',
      badgeClass: 'border-sem-success/30 bg-sem-success/10 text-sem-success',
      animate: true,
    },
    'in-match': {
      label: 'IN MATCH',
      dotClass: 'bg-accent',
      badgeClass: 'border-accent/40 bg-accent/10 text-accent',
      animate: true,
    },
    offline: {
      label: 'OFFLINE',
      dotClass: 'bg-text-secondary/40',
      badgeClass: 'border-text-secondary/15 bg-card/60 text-text-secondary/60',
      animate: false,
    },
  };

  const c = config[status];

  return (
    <span
      className={`inline-flex items-center rounded font-bold tracking-[0.18em] border ${sizeStyles[size]} ${c.badgeClass}`}
    >
      <span
        className={`rounded-full ${dotSizeStyles[size]} ${c.dotClass} ${c.animate ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {c.label}
    </span>
  );
}
