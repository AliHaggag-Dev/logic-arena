'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swords, UserMinus, MoreVertical, Eye } from 'lucide-react';
import type { FriendEntry } from '@/lib/api/friends.types';
import { FriendStatusBadge } from './FriendStatusBadge';

interface FriendCardProps {
  friend: FriendEntry;
  isMobile: boolean;
  onChallenge: (userId: string) => void;
  onSpectate: (matchId: string) => void;
  onUnfriend: (friendId: string) => void;
}

export function FriendCard({ friend, isMobile, onChallenge, onSpectate, onUnfriend }: FriendCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  return (
    <article
      className="relative bg-card/60 backdrop-blur-md border border-accent/10 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-accent/30 group"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      <Link
        href={`/profile/${friend.username}`}
        className="shrink-0"
        aria-label={`Open ${friend.username}'s profile`}
      >
        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-accent/30 bg-accent/5 shadow-[0_0_12px_rgba(var(--accent-rgb),0.2)] group-hover:border-accent/60 transition-colors">
          {friend.avatarUrl ? (
            <Image
              src={friend.avatarUrl}
              alt={`${friend.username} avatar`}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-accent/50 text-sm font-black">
              {friend.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${friend.username}`}
          className="block text-accent font-bold tracking-wider text-sm truncate hover:text-accent/80 transition-colors"
        >
          {friend.username}
        </Link>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <FriendStatusBadge status={friend.status} size="sm" />
          <span className="text-[9px] font-mono tracking-[0.15em] text-text-secondary/70">
            RANK {friend.rank}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isMobile ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Friend actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded border border-accent/20 bg-accent/5 text-accent/70 hover:bg-accent/15 transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-bg-primary border border-accent/20 rounded-lg shadow-lg overflow-hidden min-w-[160px]">
                {friend.status === 'in-match' && friend.inMatchId ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSpectate(friend.inMatchId!);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[11px] font-mono tracking-wider text-violet-300 hover:bg-violet-500/15 flex items-center gap-2"
                  >
                    <Eye size={12} aria-hidden="true" /> SPECTATE
                  </button>
                ) : friend.status === 'online' ? (
                  <button
                    type="button"
                    onClick={() => {
                      onChallenge(friend.id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[11px] font-mono tracking-wider text-accent hover:bg-accent/15 flex items-center gap-2"
                  >
                    <Swords size={12} aria-hidden="true" /> CHALLENGE
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    onUnfriend(friend.id);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[11px] font-mono tracking-wider text-red-400/80 hover:bg-red-500/15 border-t border-accent/10 flex items-center gap-2"
                >
                  <UserMinus size={12} aria-hidden="true" /> REMOVE
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {friend.status === 'in-match' && friend.inMatchId ? (
              <button
                type="button"
                onClick={() => onSpectate(friend.inMatchId!)}
                aria-label={`Watch ${friend.username}'s match`}
                className="text-[10px] tracking-[0.15em] font-bold px-3 py-1.5 rounded border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/25 text-violet-300 transition-all flex items-center gap-1.5"
              >
                <Eye size={12} aria-hidden="true" /> WATCH
              </button>
            ) : friend.status === 'online' ? (
              <button
                type="button"
                onClick={() => onChallenge(friend.id)}
                aria-label={`Challenge ${friend.username}`}
                className="text-[10px] tracking-[0.15em] font-bold px-3 py-1.5 rounded border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent transition-all flex items-center gap-1.5"
              >
                <Swords size={12} aria-hidden="true" /> CHALLENGE
              </button>
            ) : (
              <span className="text-[10px] tracking-[0.15em] font-bold px-3 py-1.5 text-accent/30">
                OFFLINE
              </span>
            )}
            <button
              type="button"
              onClick={() => onUnfriend(friend.id)}
              aria-label={`Remove ${friend.username} from friends`}
              title="Remove friend"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-red-400/70 hover:text-red-300 transition-all"
            >
              <UserMinus size={14} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
