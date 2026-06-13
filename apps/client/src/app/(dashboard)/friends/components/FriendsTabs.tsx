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
  sentSuggestionIds: Set<string>;
  onChallenge: (userId: string) => void;
  onSpectate: (matchId: string) => void;
  onUnfriend: (friendId: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onRequestSent: (username: string) => void;
  onSuggestionsError: (message: string) => void;
  onMarkSuggestionSent: (id: string) => void;
  onClearSuggestionSent: (id: string) => void;
}

const TAB_DEFS: Array<{
  id: FriendRequestTab;
  label: string;
  icon: React.ReactNode;
  countKey: 'friends' | 'incoming' | 'suggestions';
}> = [
  { id: 'friends', label: 'FRIENDS', icon: <Users size={13} aria-hidden="true" />, countKey: 'friends' },
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
      <div className="flex items-center gap-2 w-full">
        <div
          className="flex-1 flex items-center p-1 bg-accent/5 border border-accent/10 rounded-xl"
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
                className={`flex-1 h-[36px] flex items-center justify-center gap-1.5 px-1 text-[8px] sm:text-[10px] font-mono tracking-widest font-bold rounded-lg transition-all duration-200 cursor-pointer active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
                  isActive
                    ? 'bg-accent/20 text-accent shadow-[0_2px_8px_rgba(var(--accent-rgb),0.15)] border border-accent/20'
                    : 'text-accent/40 hover:text-accent/80 hover:bg-accent/5 border border-transparent'
                }`}
              >
                {t.icon}
                <span className="hidden min-[360px]:inline">{t.label}</span>
                {count > 0 && (
                  <span
                    className={`flex items-center justify-center min-w-[14px] h-[14px] px-0.5 text-[8px] rounded-full ${
                      isActive ? 'bg-accent/30 text-accent' : 'bg-accent/10 text-accent/50'
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
          title="Add Friend"
          className="w-[44px] h-[44px] shrink-0 flex items-center justify-center border border-accent/40 bg-accent/10 hover:bg-accent/20 hover:border-accent/60 text-accent rounded-xl transition-all duration-200 cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          <UserPlus size={20} aria-hidden="true" />
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
            outgoingRequests={props.outgoingRequests}
            isLoading={props.isLoadingSuggestions}
            isMobile={props.isMobile}
            sentSuggestionIds={props.sentSuggestionIds}
            onRequestSent={props.onRequestSent}
            onError={props.onSuggestionsError}
            onMarkSent={props.onMarkSuggestionSent}
            onClearSent={props.onClearSuggestionSent}
          />
        )}
      </div>

      <AddFriendModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onRequestSent={props.onRequestSent}
        outgoingRequests={props.outgoingRequests}
      />
    </div>
  );
}
