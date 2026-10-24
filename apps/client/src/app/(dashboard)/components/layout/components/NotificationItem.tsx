'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  UserCheck,
  Swords,
  Trophy,
  Info,
  Check,
  Trash2,
} from 'lucide-react';
import type { NotificationEntry } from '@/lib/api/notifications.types';

interface NotificationItemProps {
  notification: NotificationEntry;
  isFocused: boolean;
  onClick: (notification: NotificationEntry) => void;
  onDismiss: (id: string) => void;
  onDelete: (id: string) => void;
}

interface IconConfig {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
  color: string;
  label: string;
}

const ICON_MAP: Record<string, IconConfig> = {
  FRIEND_REQUEST: {
    Icon: UserPlus,
    bg: 'rgba(var(--accent-rgb),0.15)',
    color: 'var(--accent)',
    label: 'FRIEND REQUEST',
  },
  FRIEND_ACCEPTED: {
    Icon: UserCheck,
    bg: 'rgba(var(--sem-success-rgb),0.15)',
    color: 'var(--sem-success)',
    label: 'ALLY CONNECTED',
  },
  CHALLENGE_RECEIVED: {
    Icon: Swords,
    bg: 'rgba(var(--sem-warning-rgb),0.15)',
    color: 'var(--sem-warning)',
    label: 'BATTLE CHALLENGE',
  },
  MATCH_RESULT: {
    Icon: Trophy,
    bg: 'rgba(var(--accent-rgb),0.15)',
    color: 'var(--accent)',
    label: 'MATCH DEBRIEF',
  },
  SYSTEM: {
    Icon: Info,
    bg: 'rgba(var(--accent-rgb),0.08)',
    color: 'var(--text-secondary)',
    label: 'SYSTEM TRANSMISSION',
  },
};

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 604_800_000;

function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    if (diff < MS_PER_MINUTE) return 'Just now';
    if (diff < MS_PER_HOUR) {
      const minutes = Math.floor(diff / MS_PER_MINUTE);
      return `${minutes}m ago`;
    }
    if (diff < MS_PER_DAY) {
      const hours = Math.floor(diff / MS_PER_HOUR);
      return `${hours}h ago`;
    }
    if (diff < MS_PER_WEEK) {
      const days = Math.floor(diff / MS_PER_DAY);
      return `${days}d ago`;
    }
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function resolveNotificationDetails(notification: NotificationEntry): {
  headline: string;
  subtext: string;
  tag?: string;
} {
  const data = (notification.data ?? {}) as Record<string, unknown>;
  const actor =
    (typeof data.actorUsername === 'string' && data.actorUsername) ||
    (typeof data.senderUsername === 'string' && data.senderUsername) ||
    (typeof data.challengerName === 'string' && data.challengerName) ||
    '';

  const mode = typeof data.mode === 'string' ? data.mode : '';

  let subtext = notification.body || '';

  if (!subtext && actor) {
    if (notification.type === 'CHALLENGE_RECEIVED') {
      subtext = `@${actor} challenged you to a battle`;
    } else if (notification.type === 'FRIEND_REQUEST') {
      subtext = `@${actor} sent you a friend request`;
    } else if (notification.type === 'FRIEND_ACCEPTED') {
      subtext = `@${actor} accepted your ally invitation`;
    }
  }

  return {
    headline: notification.title || 'Notification',
    subtext,
    tag: mode ? mode.toUpperCase() : undefined,
  };
}

export function NotificationItem({
  notification,
  isFocused,
  onClick,
  onDismiss,
  onDelete,
}: NotificationItemProps) {
  const [hovered, setHovered] = useState(false);
  const config = ICON_MAP[notification.type] ?? ICON_MAP.SYSTEM;
  const { Icon, bg, color, label } = config;
  const { headline, subtext, tag } = resolveNotificationDetails(notification);
  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <div
      role="button"
      tabIndex={0}
      data-focused={isFocused ? 'true' : 'false'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(notification)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(notification);
        }
      }}
      className={`group relative w-full text-left cursor-pointer transition-all duration-150 border-b border-border/30 last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px] ${
        !notification.read
          ? 'bg-accent/[0.08] border-l-2 border-l-accent'
          : 'bg-transparent border-l-2 border-l-transparent hover:bg-accent/[0.04]'
      }`}
      style={{
        padding: '12px 14px',
      }}
    >
      <div className="flex gap-3 items-start">
        {/* Left icon badge */}
        <div
          className="shrink-0 flex items-center justify-center border border-accent/20"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: bg,
            color: color,
            transition: 'transform 0.15s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <Icon size={16} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {!notification.read && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_var(--accent)]"
                  style={{ background: 'var(--accent)' }}
                  aria-label="Unread notification"
                />
              )}
              <span
                className="text-[9px] font-bold tracking-wider uppercase truncate"
                style={{ color }}
              >
                {label}
              </span>
              {tag && (
                <span className="text-[8px] font-mono font-semibold px-1 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent uppercase">
                  {tag}
                </span>
              )}
            </div>

            {timeAgo && (
              <span className="text-[10px] text-text-secondary/70 shrink-0 font-mono">
                {timeAgo}
              </span>
            )}
          </div>

          <p
            className="text-[13px] leading-tight font-semibold line-clamp-1 mb-0.5"
            style={{
              color: notification.read
                ? 'var(--text-secondary)'
                : 'var(--text-primary)',
            }}
          >
            {headline}
          </p>

          {subtext && (
            <p className="text-[11px] leading-snug line-clamp-2 text-text-secondary/80">
              {subtext}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div
          className="shrink-0 flex items-center gap-1 self-center ml-1"
          style={{
            opacity: hovered || !notification.read ? 1 : 0.4,
            transition: 'opacity 0.15s ease',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {!notification.read && (
            <button
              type="button"
              data-action="mark-read"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notification.id);
              }}
              aria-label="Mark notification as read"
              title="Mark as read"
              className="flex items-center justify-center transition-all duration-150 cursor-pointer rounded-md text-text-secondary hover:text-[color:var(--sem-success)] hover:bg-[color:var(--sem-success)]/10 p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sem-success)]"
            >
              <Check size={14} />
            </button>
          )}

          <button
            type="button"
            data-action="delete"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            aria-label="Delete notification"
            title="Delete notification"
            className="flex items-center justify-center transition-all duration-150 cursor-pointer rounded-md text-text-secondary/60 hover:text-[color:var(--sem-danger)] hover:bg-[color:var(--sem-danger)]/10 p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sem-danger)]"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
