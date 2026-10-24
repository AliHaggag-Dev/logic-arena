'use client';

import React, { useCallback, useEffect, useRef, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, Inbox, Trash2 } from 'lucide-react';
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
  onDelete: (id: string) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  onLoadMore: () => Promise<void>;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const SHOW_SKELETON_THRESHOLD = 0;
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
  onDelete,
  onDeleteAll,
  onLoadMore,
  anchorRef,
}: NotificationDropdownProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const [focusedIndex, setFocusedIndex] = useReducer(
    (_prev: number, next: number): number => next,
    0,
  );
  const [confirmingClear, setConfirmingClear] = useReducer(
    (prev: boolean, next: boolean): boolean => (prev === next ? prev : next),
    false,
  );

  useEffect(() => {
    if (!isOpen) return;
    setFocusedIndex(0);
    setConfirmingClear(false);
    const t = setTimeout(() => firstFocusableRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest?.('[data-action]')) {
        return;
      }
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
        setFocusedIndex(Math.min(notifications.length - 1, focusedIndex + 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(Math.max(0, focusedIndex - 1));
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
  }, [isOpen, onClose, anchorRef, notifications.length, focusedIndex]);

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

  const handleItemDelete = useCallback(
    async (id: string) => {
      await onDelete(id);
    },
    [onDelete],
  );

  const handleMarkAll = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount === 0) return;
    await onMarkAllRead();
  }, [onMarkAllRead, unreadCount]);

  const handleClearAll = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (notifications.length === 0) return;
    if (!confirmingClear) {
      setConfirmingClear(true);
      window.setTimeout(() => setConfirmingClear(false), 3000);
      return;
    }
    void onDeleteAll();
    setConfirmingClear(false);
  }, [confirmingClear, notifications.length, onDeleteAll]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Notifications"
      className="max-sm:fixed max-sm:inset-x-4 max-sm:top-[64px] max-sm:w-auto max-sm:max-w-full sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[420px] max-sm:max-h-[80vh] sm:max-h-[560px] z-[120] font-mono flex flex-col overflow-hidden"
      style={{
        borderRadius: 16,
        backgroundColor: '#0a0f1d',
        backgroundImage: 'linear-gradient(180deg, #0e1526 0%, #080d19 100%)',
        border: '1px solid rgba(var(--accent-rgb), 0.35)',
        boxShadow:
          '0 24px 64px rgba(0,0,0,0.95), 0 0 30px rgba(var(--accent-rgb),0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
        animation: 'dropdownIn 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          borderBottom: '1px solid rgba(var(--accent-rgb),0.15)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(var(--accent-rgb),0.12)',
              border: '1px solid rgba(var(--accent-rgb),0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={15} className="text-accent" />
          </div>
          <span className="text-[12px] tracking-[0.16em] text-accent font-bold uppercase drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]">
            Transmissions
          </span>
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(var(--accent-rgb),0.2)',
                border: '1px solid rgba(var(--accent-rgb),0.4)',
                color: 'var(--accent)',
              }}
            >
              {unreadCount} NEW
            </span>
          )}
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          <button
            ref={firstFocusableRef}
            type="button"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
            aria-label="Mark all transmissions as read"
            title="Mark all as read"
            className="flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-20 text-accent/70 hover:text-accent hover:bg-accent/10 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            style={{
              width: 34,
              height: 34,
            }}
          >
            <CheckCheck size={16} />
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            aria-label={confirmingClear ? 'Confirm clear all transmissions' : 'Clear all transmissions'}
            title={confirmingClear ? 'Click again to confirm' : 'Clear all'}
            className="flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-20 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--sem-danger)]"
            style={{
              width: 34,
              height: 34,
              color: confirmingClear ? 'var(--sem-danger)' : 'rgba(var(--accent-rgb),0.6)',
              background: confirmingClear ? 'rgba(var(--sem-danger-rgb),0.15)' : 'transparent',
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* List content */}
      <div
        ref={listRef}
        className="overflow-y-auto flex-1 max-h-[440px] scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent divide-y divide-accent/10"
      >
        {isLoading && notifications.length === 0 && unreadCount > SHOW_SKELETON_THRESHOLD ? (
          <div className="py-2" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="px-4 py-3 flex gap-3 items-start border-b border-accent/10 last:border-b-0 animate-pulse"
                aria-hidden="true"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg border border-accent/15 bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-1/3 rounded bg-white/10" />
                  <div className="h-3 w-3/4 rounded bg-white/5" />
                  <div className="h-2 w-1/2 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 border border-white/5"
              style={{ background: 'rgba(var(--accent-rgb),0.05)' }}
            >
              <Inbox size={22} className="text-accent/40" />
            </div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-text-primary/70 uppercase">
              ALL SECTORS QUIET
            </p>
            <p className="text-[10px] text-text-secondary/50 mt-1 max-w-[240px]">
              No active battle challenges or allied transmissions.
            </p>
          </div>
        ) : (
          <>
            {notifications.map((n, idx) => (
              <NotificationItem
                key={n.id}
                notification={n}
                isFocused={idx === focusedIndex}
                onClick={handleItemClick}
                onDismiss={handleItemDismiss}
                onDelete={handleItemDelete}
              />
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                aria-label="Load older transmissions"
                className="w-full py-3 text-[10px] font-bold tracking-[0.18em] text-text-secondary hover:text-accent hover:bg-accent/5 disabled:opacity-50 transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2 border-t border-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    ACQUIRING TRANSMISSIONS...
                  </>
                ) : (
                  'LOAD OLDER TRANSMISSIONS'
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 border-t border-accent/15 bg-black/70 text-[9px] tracking-[0.16em] text-text-secondary/60 uppercase flex items-center justify-between shrink-0"
      >
        <span>PRESS ESC TO CLOSE</span>
        <span className="font-mono text-accent/60">
          {notifications.length} {notifications.length === 1 ? 'ENTRY' : 'ENTRIES'}
        </span>
      </div>

      <style jsx>{`
        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function navigateFromNotification(
  notification: NotificationEntry,
  router: ReturnType<typeof useRouter>,
): void {
  switch (notification.type) {
    case 'CHALLENGE_RECEIVED':
      router.push('/friends?tab=challenges');
      return;
    case 'FRIEND_REQUEST':
      router.push('/friends?tab=requests');
      return;
    case 'FRIEND_ACCEPTED':
      router.push('/friends');
      return;
    case 'MATCH_RESULT':
      router.push('/garage');
      return;
    case 'SYSTEM':
    default:
      router.push('/friends');
      return;
  }
}

export { navigateFromNotification as _test_navigateFromNotification };
export type { NotificationPayload };
