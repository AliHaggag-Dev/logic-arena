'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, Inbox } from 'lucide-react';
import type {
  NotificationEntry,
  NotificationPayload,
} from '@/lib/api/notifications.types';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  notifications: NotificationEntry[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onLoadMore: () => Promise<void>;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  isLoadingMore,
  hasMore,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onLoadMore,
  anchorRef,
}: NotificationDropdownProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    if (!isOpen) return;
    if (focusedIndex !== 0) {
      setFocusedIndex(0);
    }
    const t = setTimeout(() => firstFocusableRef.current?.focus(), 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(notifications.length - 1, i + 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        setFocusedIndex(Math.max(0, notifications.length - 1));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose, anchorRef, notifications.length]);

  useEffect(() => {
    if (!isOpen) return;
    const list = listRef.current;
    if (!list) return;
    const focusedEl = list.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[focusedIndex];
    focusedEl?.focus();
  }, [focusedIndex, isOpen]);

  const handleItemClick = useCallback(
    async (notification: NotificationEntry) => {
      if (!notification.read) {
        await onMarkRead(notification.id);
      }
      navigateFromNotification(notification, router);
      onClose();
    },
    [onMarkRead, onClose, router],
  );

  const handleItemDismiss = useCallback(
    async (id: string) => {
      await onMarkRead(id);
    },
    [onMarkRead],
  );

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full mt-2 w-[360px] sm:w-[400px] max-h-[540px] z-50 bg-bg-primary border border-accent/30 rounded-lg overflow-hidden font-mono"
      style={{
        boxShadow: '0 12px 32px rgba(var(--accent-rgb),0.18)',
        animation: 'dropdownIn 0.15s ease',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary/40 bg-card">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-accent" />
          <span className="text-[10px] tracking-[0.22em] text-accent/80 uppercase">
            {'// Comms_Log'}
          </span>
          {unreadCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          ref={firstFocusableRef}
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="text-[9px] tracking-[0.18em] text-text-secondary/70 hover:text-accent disabled:opacity-30 disabled:hover:text-text-secondary/70 transition-colors flex items-center gap-1"
        >
          <CheckCheck size={11} />
          MARK ALL
        </button>
      </div>

      <div ref={listRef} className="overflow-y-auto max-h-[420px]">
        {isLoading && notifications.length === 0 ? (
          <div className="py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="px-4 py-3 flex gap-3 items-start border-b border-border-primary/30 animate-pulse"
                aria-hidden="true"
              >
                <div className="shrink-0 w-9 h-9 rounded border border-border-primary/30 bg-bg-secondary/40" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-1/3 rounded bg-bg-secondary/60" />
                  <div className="h-3 w-3/4 rounded bg-bg-secondary/40" />
                  <div className="h-2 w-1/2 rounded bg-bg-secondary/30" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Inbox size={28} className="text-text-secondary/30 mb-2" />
            <p className="text-[10px] tracking-[0.18em] text-text-secondary/50 uppercase">
              No transmissions yet
            </p>
            <p className="text-[10px] text-text-secondary/30 mt-1">
              Friend activity will appear here
            </p>
          </div>
        ) : (
          <>
            {notifications.map((n, idx) => (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                aria-label={`${n.type}: ${n.title}`}
                onClick={() => handleItemClick(n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    void handleItemClick(n);
                  }
                }}
                className="contents"
              >
                <NotificationItem
                  notification={n}
                  isFocused={idx === focusedIndex}
                  onClick={handleItemClick}
                  onDismiss={handleItemDismiss}
                />
              </div>
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="w-full py-2.5 text-[10px] tracking-[0.18em] text-text-secondary/70 hover:text-accent disabled:opacity-50 transition-colors flex items-center justify-center gap-2 border-t border-border-primary/30"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </button>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-2 border-t border-border-primary/40 bg-card/50 text-[9px] tracking-[0.18em] text-text-secondary/40 uppercase text-center">
        Press Esc to close
      </div>

      <style jsx>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function navigateFromNotification(
  notification: NotificationEntry,
  router: ReturnType<typeof useRouter>,
): void {
  const payload = notification.data;
  if (!payload) {
    router.push('/friends');
    return;
  }
  switch (payload.kind) {
    case 'FRIEND_REQUEST':
      router.push('/friends?tab=requests');
      return;
    case 'FRIEND_ACCEPTED':
      router.push('/friends');
      return;
    case 'CHALLENGE_RECEIVED':
      router.push('/friends');
      return;
    case 'MATCH_RESULT':
      router.push(`/garage`);
      return;
    case 'SYSTEM':
      router.push('/friends');
      return;
  }
}

export { navigateFromNotification as _test_navigateFromNotification };
export type { NotificationPayload };
