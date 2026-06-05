'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, UserPlus, Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { friendsApi } from '@/lib/api/friends';
import type { FriendRequestEntry, UserSearchResult } from '@/lib/api/friends.types';
import type { AxiosError } from 'axios';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSent?: (username: string) => void;
  outgoingRequests: FriendRequestEntry[];
}

const SEARCH_DEBOUNCE_MS = 250;

export function AddFriendModal({ isOpen, onClose, onRequestSent, outgoingRequests }: AddFriendModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const data = await friendsApi.searchUsers(q.trim());
      setResults(data);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
      setPendingId(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query, isOpen, runSearch]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = async (user: UserSearchResult) => {
    if (pendingId === user.id) return;
    setPendingId(user.id);
    // Optimistic update: immediately show SENT state
    setResults((prev) =>
      prev.map((r) => (r.id === user.id ? { ...r, hasPendingRequestFromYou: true } : r)),
    );
    try {
      await friendsApi.sendRequest(user.username);
      onRequestSent?.(user.username);
    } catch (err: unknown) {
      // Rollback on failure
      setResults((prev) =>
        prev.map((r) => (r.id === user.id ? { ...r, hasPendingRequestFromYou: false } : r)),
      );
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? 'Failed to send request');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-friend-title"
      className="fixed inset-0 z-[95] flex items-center justify-center bg-card/60 backdrop-blur-sm p-4"
    >
      <div
        className="bg-bg-primary border border-accent/30 rounded-xl w-full max-w-md font-mono flex flex-col"
        style={{
          boxShadow: '0 0 40px rgba(var(--accent-rgb),0.15)',
          maxHeight: 'min(600px, 85vh)',
          animation: 'modalIn 0.2s ease',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-accent/10">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-accent" aria-hidden="true" />
            <h2 id="add-friend-title" className="text-accent font-black tracking-[0.18em] text-sm">
              ADD ALLY
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add friend dialog"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-accent/50 hover:text-accent hover:bg-accent/10 rounded transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 border-b border-accent/10">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-accent/40"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full bg-card/50 border border-accent/20 focus:border-accent/60 rounded-lg pl-9 pr-3 py-2.5 text-sm text-accent placeholder:text-accent/30 focus:outline-none focus:ring-1 focus:ring-accent/40 transition-colors"
              autoFocus
              maxLength={30}
              aria-label="Search users by username"
            />
          </div>
          {error && (
            <p className="mt-2 text-[11px] text-red-400/80 tracking-wider" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isSearching ? (
            <div className="flex items-center justify-center py-10 text-accent/40 gap-2 text-xs">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              SCANNING...
            </div>
          ) : query.trim().length < 2 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-1">
              <Search size={20} className="text-text-secondary/30" aria-hidden="true" />
              <p className="text-text-secondary/50 text-[11px] tracking-wider">
                Type at least 2 characters
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-1">
              <p className="text-text-secondary/50 text-[11px] tracking-wider">
                No users found
              </p>
              <p className="text-text-secondary/30 text-[10px] tracking-wider">
                Try a different username
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {results.map((user) => {
                const hasPendingOutgoing =
                  user.hasPendingRequestFromYou ||
                  outgoingRequests.some((r) => r.receiver.id === user.id);
                const disabled =
                  user.isFriend ||
                  hasPendingOutgoing ||
                  user.hasPendingRequestToYou ||
                  user.isBlocked ||
                  pendingId === user.id;
                return (
                  <li
                    key={user.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/5 border border-transparent hover:border-accent/15 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => router.push(`/profile/${user.username}`)}
                        className="text-accent text-sm font-bold tracking-wider truncate hover:text-accent/70 transition-colors cursor-pointer block"
                        aria-label={`View ${user.username}'s profile`}
                      >
                        {user.username}
                      </button>
                      <div className="text-[9px] font-mono tracking-[0.15em] text-text-secondary/60">
                        RANK {user.rank}
                      </div>
                    </div>
                    {user.isFriend ? (
                      <span className="text-[9px] font-mono tracking-[0.18em] text-sem-success/70 px-2.5 py-1 border border-sem-success/20 rounded">
                        ALLIED
                      </span>
                    ) : user.hasPendingRequestToYou ? (
                      <span className="text-[9px] font-mono tracking-[0.18em] text-accent/70 px-2.5 py-1 border border-accent/20 rounded">
                        INCOMING
                      </span>
                    ) : hasPendingOutgoing ? (
                      <span className="text-[9px] font-mono tracking-[0.18em] text-accent/40 px-2.5 py-1 border border-accent/15 rounded">
                        PENDING
                      </span>
                    ) : user.isBlocked ? (
                      <span className="text-[9px] font-mono tracking-[0.18em] text-text-secondary/30 px-2.5 py-1 border border-text-secondary/10 rounded">
                        BLOCKED
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => void handleSend(user)}
                        aria-label={`Send friend request to ${user.username}`}
                        className="min-w-[44px] min-h-[36px] px-3 flex items-center gap-1.5 text-[10px] tracking-[0.15em] font-bold border border-accent/40 bg-accent/10 hover:bg-accent/20 hover:border-accent/60 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-accent rounded transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                      >
                        <Send size={12} aria-hidden="true" />
                        SEND
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
