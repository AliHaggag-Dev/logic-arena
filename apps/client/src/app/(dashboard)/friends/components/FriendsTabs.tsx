'use client';

import React, { useState } from 'react';
import { Users, Inbox, Sparkles, UserPlus } from 'lucide-react';
import type { FriendRequestTab } from '@/lib/api/friends.types';
import { FriendsList } from './FriendsList';
import { FriendRequestCard } from './FriendRequestCard';
import { SuggestionsGrid } from './SuggestionsGrid';
import { FriendsEmptyState } from './FriendsEmptyState';
import { AddFriendModal } from './AddFriendModal';
import type { FriendEntry, FriendRequestEntry, FriendSuggestion } from '@/lib/api/friends.types';

interface FriendsTabsProps {
  friends: FriendEntry[];
  incomingRequests: FriendRequestEntry[];
  outgoingRequests: FriendRequestEntry[];
  suggestions: FriendSuggestion[];
  isLoadingFriends: boolean;
  isLoadingRequests: boolean;
  isLoadingSuggestions: boolean;
  isMobile: boolean;
  onChallenge: (userId: string) => void;
  onSpectate: (matchId: string) => void;
  onUnfriend: (friendId: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onRequestSent: (username: string) => void;
  onSuggestionsError: (message: string) => void;
}

const TAB_DEFS: Array<{
  id: FriendRequestTab;
  label: string;
  icon: React.ReactNode;
  countKey: 'friends' | 'incoming' | 'suggestions';
}> = [
  { id: 'friends', label: 'ALLIES', icon: <Users size={13} aria-hidden="true" />, countKey: 'friends' },
  { id: 'requests', label: 'REQUESTS', icon: <Inbox size={13} aria-hidden="true" />, countKey: 'incoming' },
  { id: 'suggestions', label: 'SUGGEST', icon: <Sparkles size={13} aria-hidden="true" />, countKey: 'suggestions' },
];

export function FriendsTabs(props: FriendsTabsProps) {
  const [activeTab, setActiveTab] = useState<FriendRequestTab>('friends');
  const [addOpen, setAddOpen] = useState(false);

  const counts = {
    friends: props.friends.length,
    incoming: props.incomingRequests.length,
    suggestions: props.suggestions.length,
  };

  const visibleRequests =
    activeTab === 'requests' ? [...props.incomingRequests] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          className="inline-flex items-center gap-0.5 p-1 bg-card/40 border border-accent/10 rounded-lg"
          role="tablist"
          aria-label="Friends tabs"
        >
          {TAB_DEFS.map((t) => {
            const isActive = activeTab === t.id;
            const count = counts[t.countKey];
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tab-panel-${t.id}`}
                onClick={() => setActiveTab(t.id)}
                className={`min-h-[36px] px-3 py-1.5 text-[10px] font-mono tracking-[0.18em] font-bold rounded transition-all flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
                  isActive
                    ? 'bg-accent/15 text-accent border border-accent/40'
                    : 'text-accent/45 hover:text-accent/80 hover:bg-accent/5 border border-transparent'
                }`}
              >
                {t.icon}
                {t.label}
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[8px] rounded ${
                      isActive ? 'bg-accent/20 text-accent' : 'bg-card/60 text-accent/50'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="Add a new friend"
          className="min-h-[36px] px-3 py-1.5 text-[10px] font-mono tracking-[0.18em] font-bold border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-all flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          <UserPlus size={13} aria-hidden="true" />
          ADD ALLY
        </button>
      </div>

      <div
        id={`tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'friends' && (
          <FriendsList
            friends={props.friends}
            isLoading={props.isLoadingFriends}
            isMobile={props.isMobile}
            onChallenge={props.onChallenge}
            onSpectate={props.onSpectate}
            onUnfriend={props.onUnfriend}
          />
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {props.incomingRequests.length > 0 && (
              <section>
                <h3 className="text-[10px] font-mono tracking-[0.22em] text-accent/60 mb-2.5 uppercase">
                  {`// Incoming (${props.incomingRequests.length})`}
                </h3>
                <div className="space-y-2.5">
                  {props.incomingRequests.map((req) => (
                    <FriendRequestCard
                      key={req.id}
                      request={req}
                      variant="incoming"
                      onAccept={props.onAcceptRequest}
                      onDecline={props.onDeclineRequest}
                    />
                  ))}
                </div>
              </section>
            )}

            {props.outgoingRequests.length > 0 && (
              <section>
                <h3 className="text-[10px] font-mono tracking-[0.22em] text-accent/60 mb-2.5 uppercase">
                  {`// Sent (${props.outgoingRequests.length})`}
                </h3>
                <div className="space-y-2.5">
                  {props.outgoingRequests.map((req) => (
                    <FriendRequestCard
                      key={req.id}
                      request={req}
                      variant="outgoing"
                    />
                  ))}
                </div>
              </section>
            )}

            {visibleRequests.length === 0 && props.outgoingRequests.length === 0 && (
              <FriendsEmptyState variant="requests" isMobile={props.isMobile} />
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <SuggestionsGrid
            suggestions={props.suggestions}
            isLoading={props.isLoadingSuggestions}
            isMobile={props.isMobile}
            onRequestSent={props.onRequestSent}
            onError={props.onSuggestionsError}
          />
        )}
      </div>

      <AddFriendModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onRequestSent={props.onRequestSent}
      />
    </div>
  );
}
