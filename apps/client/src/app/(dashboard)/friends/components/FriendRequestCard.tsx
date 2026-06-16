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
      className="relative bg-card border border-accent/10 rounded-2xl p-3 flex items-center justify-between gap-4 hover:bg-accent/5 transition-colors duration-200"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative shrink-0 w-12 h-12 rounded-full overflow-hidden border border-accent/10 bg-bg-secondary">
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
            <div className="w-full h-full flex items-center justify-center text-text-secondary text-lg font-semibold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/profile/${user.username}`)}
              className="text-text-primary font-semibold text-sm truncate hover:text-accent transition-colors cursor-pointer"
              aria-label={`View ${user.username}'s profile`}
            >
              {user.username}
            </button>
            {relativeTime && (
              <span className="text-[11px] text-text-secondary/50 font-medium whitespace-nowrap">
                {relativeTime}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-text-secondary/70">
              Rank {user.rank}
            </span>
            {expiresIn !== null && (
              <>
                <span className="text-text-secondary/30 text-[10px]">·</span>
                <span className="text-[11px] text-text-secondary/50">
                  {expiresIn}d left
                </span>
              </>
            )}
          </div>

          {request.message && (
            <p className="mt-1 text-[12px] text-text-secondary/90 line-clamp-1 italic">
              "{request.message}"
            </p>
          )}
        </div>
      </div>

      {isIncoming && onAccept && onDecline ? (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onDecline(request.id)}
            aria-label={`Decline friend request from ${user.username}`}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-text-secondary/5 hover:bg-sem-danger/20 border border-transparent hover:border-sem-danger/50 text-text-secondary hover:text-sem-danger active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={() => onAccept(request.id)}
            aria-label={`Accept friend request from ${user.username}`}
            className="px-5 min-h-[44px] flex items-center justify-center rounded-full bg-[color:var(--sem-success)] hover:brightness-110 active:scale-95 text-bg-primary font-semibold text-[12px] transition-all duration-150 cursor-pointer shadow-sm hover:shadow"
          >
            Accept
          </button>
        </div>
      ) : (
        <div className="shrink-0 pr-1">
          <span className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[11px] font-semibold">
            Pending
          </span>
        </div>
      )}
    </article>
  );
}
