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
    open,
    close,
    markRead,
    markAllRead,
    deleteNotification,
    deleteAll,
    loadMore,
  } = notifications;

  // Use onMouseDown + stopPropagation instead of onClick.
  // The document-level mousedown handler in NotificationDropdown fires BEFORE
  // the button's onClick, creating a race: it sees a mousedown outside the dropdown
  // (even though it's on the bell button) and calls onClose(), then onClick fires open().
  // stopPropagation kills that document handler before it runs — guaranteed fix.
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isOpen) {
      close();
    } else {
      open();
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={handleMouseDown}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Notifications"
        className={`relative ${
          isMobile ? 'w-10 h-10 rounded-xl' : 'w-[28px] h-[28px] rounded-md'
        } border border-accent/20 bg-accent/5 hover:border-accent/40 hover:bg-accent/10 flex items-center justify-center text-accent transition-colors duration-150 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
      >
        <Bell size={isMobile ? 20 : 14} className={unreadCount > 0 ? 'animate-pulse' : ''} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-[14px] px-[3px] rounded-full bg-accent border border-bg-primary text-[7px] font-black text-bg-primary shadow-[0_0_6px_rgba(var(--accent-rgb),0.6)]"
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
        onDelete={deleteNotification}
        onDeleteAll={deleteAll}
        onLoadMore={loadMore}
        anchorRef={buttonRef}
      />
    </div>
  );
}
