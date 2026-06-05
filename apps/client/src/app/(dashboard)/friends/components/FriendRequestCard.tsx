'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, X, MessageCircle } from 'lucide-react';
import type { FriendRequestEntry } from '@/lib/api/friends.types';

interface FriendRequestCardProps {
  request: FriendRequestEntry;
  variant: 'incoming' | 'outgoing';
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
}

const TIME_FORMATTER = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const ONE_MINUTE_MS = 60_000;
const ONE_DAY_MS = 86_400_000;

function formatRelative(iso: string, nowMs: number): string {
  const ms = nowMs - new Date(iso).getTime();
  const minutes = Math.floor(ms / ONE_MINUTE_MS);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return TIME_FORMATTER.format(-days, 'day');
}

export function FriendRequestCard({ request, variant, onAccept, onDecline }: FriendRequestCardProps) {
  const router = useRouter();
  const isIncoming = variant === 'incoming';
  const user = isIncoming ? request.sender : request.receiver;

  const [nowMs, setNowMs] = useState<number>(() =>
    typeof window === 'undefined' ? 0 : Date.now(),
  );

  useEffect(() => {
    const t = window.setInterval(() => {
      setNowMs(Date.now());
    }, ONE_MINUTE_MS);
    return () => window.clearInterval(t);
  }, []);

  const expiresIn = nowMs === 0
    ? null
    : Math.max(
        0,
        Math.ceil((new Date(request.expiresAt).getTime() - nowMs) / ONE_DAY_MS),
      );
  const relativeTime = nowMs === 0 ? '' : formatRelative(request.createdAt, nowMs);

  return (
    <article
      className="relative bg-card/60 backdrop-blur-md border border-accent/10 rounded-xl p-4 flex items-start gap-3 hover:border-accent/30 transition-colors duration-150"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      <div className="shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent/30 bg-accent/5">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={`${user.username} avatar`}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-accent/50 text-sm font-black">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => router.push(`/profile/${user.username}`)}
            className="text-accent font-bold tracking-wider text-sm truncate hover:text-accent/70 transition-colors cursor-pointer"
            aria-label={`View ${user.username}'s profile`}
          >
            {user.username}
          </button>
          <span className="text-[9px] font-mono tracking-[0.12em] text-text-secondary/60">
            {relativeTime || '—'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] font-mono tracking-[0.15em] text-text-secondary/70">
            RANK {user.rank}
          </span>
          <span className="text-[9px] font-mono tracking-[0.12em] text-text-secondary/40">·</span>
          <span className="text-[9px] font-mono tracking-[0.12em] text-text-secondary/60">
            {expiresIn === null ? '—' : `${expiresIn}d LEFT`}
          </span>
        </div>
        {request.message && (
          <div className="mt-2.5 px-3 py-2 bg-accent/5 border-l-2 border-accent/40 rounded-r text-[11px] text-text-secondary/90 italic flex gap-2">
            <MessageCircle size={12} className="text-accent/60 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="break-words">{request.message}</span>
          </div>
        )}
      </div>

      {isIncoming && onAccept && onDecline ? (
        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onAccept(request.id)}
            aria-label={`Accept friend request from ${user.username}`}
            className="min-w-[44px] min-h-[36px] px-3 flex items-center justify-center gap-1.5 text-[10px] tracking-[0.15em] font-bold border border-sem-success/40 bg-sem-success/10 hover:bg-sem-success/20 hover:scale-105 active:scale-95 rounded transition-all duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sem-success)] focus-visible:outline-offset-2"
            style={{ color: 'var(--sem-success)' }}
          >
            <Check size={14} aria-hidden="true" /> ACCEPT
          </button>
          <button
            type="button"
            onClick={() => onDecline(request.id)}
            aria-label={`Decline friend request from ${user.username}`}
            className="min-w-[44px] min-h-[36px] px-3 flex items-center justify-center gap-1.5 text-[10px] tracking-[0.15em] font-bold border border-red-500/30 bg-red-500/5 hover:bg-red-500/15 hover:scale-105 active:scale-95 text-red-400/80 rounded transition-all duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 focus-visible:outline-offset-2"
          >
            <X size={14} aria-hidden="true" /> DECLINE
          </button>
        </div>
      ) : (
        <div className="shrink-0 self-center">
          <span className="text-[9px] font-mono tracking-[0.18em] text-accent/40 px-2.5 py-1 border border-accent/15 rounded">
            PENDING
          </span>
        </div>
      )}
    </article>
  );
}
