'use client';

import React, { useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  notifications: ReturnType<typeof useNotifications>;
  isMobile?: boolean;
}

export function NotificationBell({ notifications, isMobile = false }: NotificationBellProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const {
    notifications: items,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    isOpen,
    toggle,
    close,
    markRead,
    markAllRead,
    loadMore,
  } = notifications;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`relative ${
          isMobile ? 'w-10 h-10' : 'w-9 h-9'
        } rounded-md border border-accent/30 bg-card/60 hover:bg-card hover:border-accent/60 flex items-center justify-center text-text-secondary hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
      >
        <Bell size={isMobile ? 16 : 15} className={unreadCount > 0 ? 'animate-pulse' : ''} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-[9px] font-mono font-semibold text-bg-primary flex items-center justify-center border border-bg-primary"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        notifications={items}
        unreadCount={unreadCount}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        isOpen={isOpen}
        onClose={close}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onLoadMore={loadMore}
        anchorRef={buttonRef}
      />
    </div>
  );
}
