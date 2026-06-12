'use client';

import React, { useCallback } from 'react';
import { X, UserPlus, UserCheck, Swords, Trophy, Info } from 'lucide-react';
import type { NotificationEntry } from '@/lib/api/notifications.types';

interface NotificationToastView {
  id: string;
  notification: NotificationEntry;
}

interface NotificationToastsProps {
  toasts: NotificationToastView[];
  onDismiss: (id: string) => void;
  onClick: (notification: NotificationEntry) => void;
}

interface IconConfig {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: 'accent' | 'success' | 'warning' | 'info';
  label: string;
}

const ICON_MAP: Record<string, IconConfig> = {
  FRIEND_REQUEST: { Icon: UserPlus, tone: 'accent', label: 'FRIEND_REQUEST' },
  FRIEND_ACCEPTED: { Icon: UserCheck, tone: 'success', label: 'FRIEND_ACCEPTED' },
  CHALLENGE_RECEIVED: { Icon: Swords, tone: 'warning', label: 'CHALLENGE' },
  MATCH_RESULT: { Icon: Trophy, tone: 'accent', label: 'MATCH' },
  SYSTEM: { Icon: Info, tone: 'info', label: 'SYSTEM' },
};

export function NotificationToasts({ toasts, onDismiss, onClick }: NotificationToastsProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-16 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onClick={onClick}
        />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
  onClick,
}: {
  toast: NotificationToastView;
  onDismiss: (id: string) => void;
  onClick: (n: NotificationEntry) => void;
}) {
  const config = ICON_MAP[toast.notification.type] ?? ICON_MAP.SYSTEM;
  const { Icon, tone, label } = config;

  const toneClass: Record<IconConfig['tone'], string> = {
    accent: 'text-accent border-accent/40 bg-accent/10',
    success: 'text-[color:var(--sem-success)] border-[color:var(--sem-success)]/40 bg-[color:var(--sem-success)]/10',
    warning: 'text-[color:var(--sem-warning)] border-[color:var(--sem-warning)]/40 bg-[color:var(--sem-warning)]/10',
    info: 'text-text-secondary border-border-primary/40 bg-bg-secondary',
  };

  const handleClick = useCallback(() => {
    onClick(toast.notification);
  }, [onClick, toast.notification]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`pointer-events-auto w-[340px] max-w-[calc(100vw-32px)] p-3 flex gap-3 items-start backdrop-blur-xl ${
        toneClass[tone]
      }`}
      style={{
        borderRadius: 16,
        background: 'rgba(var(--bg-card),0.92)',
        border: '1px solid rgba(var(--accent-rgb),0.12)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(var(--accent-rgb),0.05)',
        animation: 'toastIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Open ${toast.notification.title}`}
        className="flex gap-3 items-start flex-1 min-w-0 text-left p-0 bg-transparent border-0 cursor-pointer transition-opacity duration-150 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
      >
        <div className="shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent)' }}>
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-semibold tracking-wider uppercase block mb-0.5" style={{ color: 'rgba(var(--accent-rgb),0.6)' }}>
            {label}
          </span>
          <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2">
            {toast.notification.title}
          </p>
          <p className="text-[11px] text-text-secondary/80 mt-0.5 line-clamp-1">
            {toast.notification.body}
          </p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        title="Dismiss"
        className="shrink-0 flex items-center justify-center cursor-pointer transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          color: 'rgba(var(--accent-rgb),0.4)',
          background: 'transparent',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(var(--accent-rgb),0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
