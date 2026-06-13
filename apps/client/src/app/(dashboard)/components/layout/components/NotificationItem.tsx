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
import type {
  NotificationEntry,
  NotificationPayload,
} from '@/lib/api/notifications.types';

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
  FRIEND_REQUEST: { Icon: UserPlus, bg: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)', label: 'FRIEND_REQUEST' },
  FRIEND_ACCEPTED: { Icon: UserCheck, bg: 'rgba(var(--sem-success-rgb),0.12)', color: 'var(--sem-success)', label: 'FRIEND_ACCEPTED' },
  CHALLENGE_RECEIVED: { Icon: Swords, bg: 'rgba(var(--sem-warning-rgb),0.12)', color: 'var(--sem-warning)', label: 'CHALLENGE' },
  MATCH_RESULT: { Icon: Trophy, bg: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)', label: 'MATCH' },
  SYSTEM: { Icon: Info, bg: 'rgba(var(--accent-rgb),0.06)', color: 'var(--text-secondary)', label: 'SYSTEM' },
};

function getPayloadSummary(payload: NotificationPayload | null): string {
  if (!payload) return '';
  switch (payload.kind) {
    case 'FRIEND_REQUEST':
      return `from @${payload.senderUsername}`;
    case 'FRIEND_ACCEPTED':
      return `@${payload.friendUsername} is now your ally`;
    case 'CHALLENGE_RECEIVED':
      return `@${payload.challengerName} wants to fight`;
    case 'MATCH_RESULT':
      return `${payload.outcome === 'win' ? '+' : ''}${payload.ratingDelta} rating`;
    case 'SYSTEM':
      return payload.reference;
  }
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
  const summary = getPayloadSummary(notification.data);

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
      className="group relative w-full text-left cursor-pointer transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]"
      style={{
        padding: '14px 16px',
        background: !notification.read ? 'rgba(var(--accent-rgb),0.04)' : 'transparent',
      }}
    >
      <div className="flex gap-3 items-start">
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: bg,
            color: color,
            transition: 'transform 0.15s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <Icon size={17} />
        </div>
        <div className="flex-1 min-w-0" style={{ paddingTop: 2 }}>
          <div className="flex items-center gap-2 mb-0.5">
            {!notification.read && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_var(--accent)]"
                style={{ background: 'var(--accent)' }}
                aria-label="Unread"
              />
            )}
            <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: color }}>
              {label}
            </span>
          </div>
          <p
            className="text-sm leading-snug line-clamp-2"
            style={{
              color: notification.read ? 'var(--text-secondary)' : 'var(--text-primary)',
              fontWeight: notification.read ? 400 : 500,
            }}
          >
            {notification.title}
          </p>
          {summary && (
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(var(--accent-rgb),0.55)' }}>
              {summary}
            </p>
          )}
        </div>
      </div>
      <div
        className="flex items-center gap-2 absolute"
        style={{
          right: 12,
          bottom: 12,
          opacity: hovered || !notification.read ? 1 : 0,
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
            aria-label="Mark as read"
            title="Mark as read"
            className="flex items-center justify-center transition-all duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sem-success)] focus-visible:outline-offset-2"
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              color: 'rgba(var(--accent-rgb),0.5)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(var(--sem-success-rgb),0.1)'; e.currentTarget.style.color = 'var(--sem-success)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(var(--accent-rgb),0.5)'; }}
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
          title="Delete"
          className="flex items-center justify-center transition-all duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sem-danger)] focus-visible:outline-offset-2"
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            color: 'rgba(var(--accent-rgb),0.5)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(var(--sem-danger-rgb),0.1)'; e.currentTarget.style.color = 'var(--sem-danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(var(--accent-rgb),0.5)'; }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
