'use client';

import React from 'react';
import { Users, Inbox, Sparkles } from 'lucide-react';

interface FriendsEmptyStateProps {
  variant: 'friends' | 'requests' | 'suggestions';
  isMobile: boolean;
}

const COPY: Record<FriendsEmptyStateProps['variant'], { icon: React.ReactNode; title: string; body: string }> = {
  friends: {
    icon: <Users size={28} aria-hidden="true" />,
    title: 'NO ALLIES YET',
    body: 'Build your network — search for operators and send your first friend request.',
  },
  requests: {
    icon: <Inbox size={28} aria-hidden="true" />,
    title: 'INBOX EMPTY',
    body: 'No pending requests right now. New requests will appear here in real time.',
  },
  suggestions: {
    icon: <Sparkles size={28} aria-hidden="true" />,
    title: 'NO SUGGESTIONS YET',
    body: 'Play a few matches — we will suggest operators near your rank and recent opponents.',
  },
};

export function FriendsEmptyState({ variant, isMobile }: FriendsEmptyStateProps) {
  const c = COPY[variant];
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${isMobile ? 'py-12 px-4' : 'py-20 px-6'} bg-card/40 border border-accent/10 rounded-xl`}
    >
      <div className="text-accent/40 mb-4">{c.icon}</div>
      <h3 className="text-accent font-black tracking-[0.18em] text-sm mb-2">{c.title}</h3>
      <p className="text-text-secondary/70 text-[11px] max-w-xs leading-relaxed">{c.body}</p>
    </div>
  );
}
