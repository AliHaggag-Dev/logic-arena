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
      <style jsx>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(20px) scale(0.95); }
        }
      `}</style>
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
      className={`pointer-events-auto w-[320px] max-w-[calc(100vw-32px)] border rounded-lg p-3 flex gap-3 items-start bg-bg-primary backdrop-blur-md ${
        toneClass[tone]
      }`}
      style={{
        boxShadow: '0 8px 24px rgba(var(--bg-primary-rgb),0.4), 0 0 24px rgba(var(--accent-rgb),0.12)',
        animation: 'toastIn 0.2s ease',
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Open ${toast.notification.title}`}
        className="flex gap-3 items-start flex-1 min-w-0 text-left p-0 bg-transparent border-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
      >
        <div className="shrink-0 w-8 h-8 rounded border border-current/40 bg-current/10 flex items-center justify-center">
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-mono tracking-[0.18em] uppercase opacity-70 block mb-0.5">
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
        className="shrink-0 w-7 h-7 rounded text-text-secondary/60 hover:text-text-primary hover:bg-bg-secondary flex items-center justify-center"
      >
        <X size={13} />
      </button>
    </div>
  );
}
