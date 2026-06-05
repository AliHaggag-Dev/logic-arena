'use client';

import React, { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import type { IncomingFriendRequest } from '../../../../hooks/useFriendsSystem';

interface FriendRequestModalProps {
  request: IncomingFriendRequest | null;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

export function FriendRequestModal({ request, onAccept, onDecline }: FriendRequestModalProps) {
  const acceptButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!request) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    acceptButtonRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDecline(request.request.id);
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      previousFocusRef.current?.focus();
    };
  }, [request, onDecline]);

  if (!request) return null;

  const { sender, message } = request.request;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-card/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="friend-request-title"
    >
      <div
        className="border border-accent/30 bg-bg-primary rounded-xl p-6 max-w-sm w-full mx-4 font-mono"
        style={{
          boxShadow: '0 0 40px rgba(var(--accent-rgb),0.15)',
          animation: 'modalIn 0.2s ease',
        }}
      >
        <p className="text-[9px] tracking-[0.28em] text-accent/35 mb-2">
          {'// ALLIANCE_TRANSMISSION'}
        </p>
        <h2
          id="friend-request-title"
          className="text-accent font-black tracking-[0.18em] text-xl mb-2"
        >
          FRIEND REQUEST
        </h2>
        <p className="text-accent/60 text-[11px] tracking-[0.12em] mb-4">
          <span className="text-accent">{sender.username}</span> wants to be your ally.
        </p>
        {message && (
          <div className="mb-5 px-3 py-2.5 bg-accent/5 border-l-2 border-accent/40 rounded-r text-[11px] text-text-secondary/90 italic">
            &ldquo;{message}&rdquo;
          </div>
        )}
        <div className="flex gap-3">
          <button
            ref={acceptButtonRef}
            type="button"
            onClick={() => onAccept(request.request.id)}
            aria-label={`Accept friend request from ${sender.username}`}
            className="flex-1 py-2.5 min-h-[44px] text-[11px] tracking-[0.18em] font-bold border rounded-lg transition-all flex items-center justify-center gap-1.5"
            style={{
              borderColor: 'rgba(var(--sem-success-rgb),0.4)',
              background: 'rgba(var(--sem-success-rgb),0.10)',
              color: 'var(--sem-success)',
            }}
          >
            <Check size={14} aria-hidden="true" />
            ACCEPT
          </button>
          <button
            type="button"
            onClick={() => onDecline(request.request.id)}
            aria-label={`Decline friend request from ${sender.username}`}
            className="flex-1 py-2.5 min-h-[44px] text-[11px] tracking-[0.18em] font-bold border border-red-500/30 bg-red-500/5 hover:bg-red-500/15 text-red-500/70 rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <X size={14} aria-hidden="true" />
            DECLINE
          </button>
        </div>
      </div>
    </div>
  );
}
