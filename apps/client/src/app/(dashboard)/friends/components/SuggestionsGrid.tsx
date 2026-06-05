'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserPlus, Check, X, Sparkles } from 'lucide-react';
import type { FriendSuggestion } from '@/lib/api/friends.types';
import type { AxiosError } from 'axios';
import { friendsApi } from '@/lib/api/friends';
import { FriendsEmptyState } from './FriendsEmptyState';

interface SuggestionsGridProps {
  suggestions: FriendSuggestion[];
  isLoading: boolean;
  isMobile: boolean;
  /** Ref to the persistent sent-IDs set owned by useFriendsSystem */
  sentSuggestionIds: React.RefObject<Set<string>>;
  onRequestSent: (username: string) => void;
  onError: (message: string) => void;
  /** Called when a request succeeds — adds id to the shared set */
  onMarkSent: (id: string) => void;
  /** Called on rollback — removes id from the shared set */
  onClearSent: (id: string) => void;
}

const REASON_LABEL: Record<FriendSuggestion['reason'], string> = {
  RANK_PROXIMITY: 'NEAR YOUR RANK',
  RECENT_OPPONENT: 'RECENT OPPONENT',
};

const REASON_TONE: Record<FriendSuggestion['reason'], string> = {
  RANK_PROXIMITY: 'text-accent border-accent/30 bg-accent/5',
  RECENT_OPPONENT: 'text-[color:var(--sem-warning)] border-[color:var(--sem-warning)]/30 bg-[color:var(--sem-warning)]/5',
};

export function SuggestionsGrid({
  suggestions,
  isLoading,
  isMobile,
  sentSuggestionIds,
  onRequestSent,
  onError,
  onMarkSent,
  onClearSent,
}: SuggestionsGridProps) {
  const router = useRouter();
  // Tracks IDs currently in-flight (disabled during API call) — local only
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  // Counter to trigger re-renders when the ref's Set contents change
  const [, forceUpdate] = useState(0);

  const handleSend = useCallback(async (s: FriendSuggestion) => {
    const sent = sentSuggestionIds.current;
    // Prevent double-sending
    if (sendingIds.has(s.id) || sent.has(s.id)) return;

    // Optimistic update: immediately show "Request Sent"
    onMarkSent(s.id);
    setSendingIds((prev) => new Set([...prev, s.id]));
    forceUpdate((n) => n + 1);

    try {
      await friendsApi.sendRequest(s.username);
      onRequestSent(s.username);
    } catch (err: unknown) {
      // Rollback optimistic update on failure
      onClearSent(s.id);
      forceUpdate((n) => n + 1);
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message = axiosErr.response?.data?.message ?? 'Failed to send request';
      onError(message);
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(s.id);
        return next;
      });
    }
  }, [sendingIds, sentSuggestionIds, onRequestSent, onError, onMarkSent, onClearSent]);

  const handleCancel = useCallback((id: string) => {
    onClearSent(id);
    forceUpdate((n) => n + 1);
  }, [onClearSent]);

  if (isLoading) {
    return (
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
        {Array.from({ length: isMobile ? 3 : 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-card/40 border border-accent/10 rounded-xl p-4 h-[100px] animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return <FriendsEmptyState variant="suggestions" isMobile={isMobile} />;
  }

  return (
    <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
      {suggestions.map((s) => {
        const isSent = sentSuggestionIds.current.has(s.id);
        const isSending = sendingIds.has(s.id);

        return (
          <article
            key={s.id}
            className="bg-card/60 backdrop-blur-md border border-accent/10 rounded-xl p-4 hover:border-accent/30 transition-colors"
            style={{ boxShadow: 'var(--card-shadow)' }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden border border-accent/30 bg-accent/5 flex items-center justify-center text-accent/60 font-black text-sm">
                {s.avatarUrl ? (
                  <Image
                    src={s.avatarUrl}
                    alt={`${s.username} avatar`}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  s.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => router.push(`/profile/${s.username}`)}
                  className="text-accent font-bold tracking-wider text-sm truncate hover:text-accent/70 transition-colors cursor-pointer block"
                  aria-label={`View ${s.username}'s profile`}
                >
                  {s.username}
                </button>
                <div className="text-[9px] font-mono tracking-[0.15em] text-text-secondary/70 mt-0.5">
                  RANK {s.rank}
                </div>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1 text-[8px] font-mono tracking-[0.18em] border rounded px-1.5 py-0.5 ${REASON_TONE[s.reason]}`}>
                <Sparkles size={9} aria-hidden="true" />
                {REASON_LABEL[s.reason]}
              </span>
            </div>
            {s.mutualFriends > 0 && (
              <div className="text-[10px] font-mono tracking-wider text-text-secondary/80 mb-3">
                <span className="text-accent font-bold">{s.mutualFriends}</span>{' '}
                {s.mutualFriends === 1 ? 'MUTUAL ALLY' : 'MUTUAL ALLIES'}
              </div>
            )}

            {isSent ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 text-[10px] tracking-[0.15em] font-bold border border-[color:var(--sem-success)]/40 bg-[color:var(--sem-success)]/10 text-[color:var(--sem-success)] rounded-lg">
                  <Check size={12} aria-hidden="true" />
                  REQUEST SENT
                </div>
                {!isSending && (
                  <button
                    type="button"
                    onClick={() => handleCancel(s.id)}
                    aria-label={`Cancel friend request to ${s.username}`}
                    title="Cancel request"
                    className="min-h-[40px] w-10 flex items-center justify-center border border-accent/20 bg-card/50 hover:border-[color:var(--sem-danger)]/50 hover:bg-[color:var(--sem-danger)]/10 hover:text-[color:var(--sem-danger)] text-accent/40 rounded-lg transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void handleSend(s)}
                disabled={isSending}
                aria-label={`Send friend request to ${s.username}`}
                className="w-full min-h-[40px] flex items-center justify-center gap-1.5 text-[10px] tracking-[0.15em] font-bold border border-accent/40 bg-accent/10 hover:bg-accent/20 hover:border-accent/60 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-accent rounded-lg transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                <UserPlus size={12} aria-hidden="true" />
                ADD ALLY
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

export const _internal = { REASON_LABEL };
export { REASON_LABEL };
