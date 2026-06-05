'use client';

import React from 'react';
import type { FriendEntry } from '@/lib/api/friends.types';
import { FriendCard } from './FriendCard';
import { FriendsEmptyState } from './FriendsEmptyState';

interface FriendsListProps {
  friends: FriendEntry[];
  isLoading: boolean;
  isMobile: boolean;
  onChallenge: (userId: string) => void;
  onSpectate: (matchId: string) => void;
  onUnfriend: (friendId: string) => void;
}

const SKELETON_COUNT = 4;

export function FriendsList({
  friends,
  isLoading,
  isMobile,
  onChallenge,
  onSpectate,
  onUnfriend,
}: FriendsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div
            key={i}
            className="bg-card/40 border border-accent/10 rounded-xl h-[80px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return <FriendsEmptyState variant="friends" isMobile={isMobile} />;
  }

  return (
    <div className="space-y-2.5">
      {friends.map((friend) => (
        <FriendCard
          key={friend.id}
          friend={friend}
          isMobile={isMobile}
          onChallenge={onChallenge}
          onSpectate={onSpectate}
          onUnfriend={onUnfriend}
        />
      ))}
    </div>
  );
}
