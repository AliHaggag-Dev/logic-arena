'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationsApi } from '@/lib/api/notifications';
import type { NotificationEntry } from '@/lib/api/notifications.types';
import { useGlobalSocket } from './useGlobalSocket';

const PAGE_SIZE = 20;
const MAX_NOTIFICATIONS = 200;

interface NotificationToast {
  id: string;
  notification: NotificationEntry;
}

interface NotificationsStore {
  items: NotificationEntry[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  isOpen: boolean;
  toasts: NotificationToast[];
  refCount: number;
  timers: Map<string, ReturnType<typeof setTimeout>>;
  fetchedOnce: boolean;
  destroyed: boolean;
  listeners: Set<() => void>;
}

let store: NotificationsStore | null = null;

function createStore(): NotificationsStore {
  return {
    items: [],
    unreadCount: 0,
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    isOpen: false,
    toasts: [],
    refCount: 0,
    timers: new Map(),
    fetchedOnce: false,
    destroyed: false,
    listeners: new Set(),
  };
}

function getStore(): NotificationsStore {
  if (!store) store = createStore();
  return store;
}

function notify(): void {
  if (!store) return;
  store.listeners.forEach((fn) => fn());
}

interface NotificationsSnapshot {
  items: NotificationEntry[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  isOpen: boolean;
  toasts: NotificationToast[];
}

function selectSnapshot(s: NotificationsStore): NotificationsSnapshot {
  return {
    items: s.items,
    unreadCount: s.unreadCount,
    isLoading: s.isLoading,
    isLoadingMore: s.isLoadingMore,
    hasMore: s.hasMore,
    isOpen: s.isOpen,
    toasts: s.toasts,
  };
}

function useStoreSnapshot(): NotificationsSnapshot {
  const [snapshot, setSnapshot] = useState<NotificationsSnapshot>(() =>
    selectSnapshot(getStore()),
  );

  useEffect(() => {
    const s = getStore();
    const listener = () => {
      setSnapshot((prev) => {
        const next = selectSnapshot(s);
        if (
          prev.items === next.items &&
          prev.unreadCount === next.unreadCount &&
          prev.isLoading === next.isLoading &&
          prev.isLoadingMore === next.isLoadingMore &&
          prev.hasMore === next.hasMore &&
          prev.isOpen === next.isOpen &&
          prev.toasts === next.toasts
        ) {
          return prev;
        }
        return next;
      });
    };
    s.listeners.add(listener);
    return () => {
      s.listeners.delete(listener);
    };
  }, []);

  return snapshot;
}

async function refresh(): Promise<void> {
  if (!store) return;
  store.isLoading = true;
  notify();
  try {
    const res = await notificationsApi.list(0, PAGE_SIZE);
    store.items = res.items;
    store.unreadCount = res.unreadCount;
    store.hasMore = res.hasMore;
    store.fetchedOnce = true;
  } catch (err) {
    console.error('[useNotifications] refresh failed', err);
  } finally {
    if (store) {
      store.isLoading = false;
      notify();
    }
  }
}

async function loadMore(): Promise<void> {
  if (!store) return;
  if (store.isLoadingMore || !store.hasMore) return;
  store.isLoadingMore = true;
  notify();
  try {
    const res = await notificationsApi.list(store.items.length, PAGE_SIZE);
    const next = [...store.items, ...res.items];
    store.items = next.length > MAX_NOTIFICATIONS ? next.slice(0, MAX_NOTIFICATIONS) : next;
    store.unreadCount = res.unreadCount;
    store.hasMore = res.hasMore;
  } catch (err) {
    console.error('[useNotifications] loadMore failed', err);
  } finally {
    if (store) {
      store.isLoadingMore = false;
      notify();
    }
  }
}

async function markRead(id: string): Promise<void> {
  if (!store) return;
  store.items = store.items.map((n) => (n.id === id ? { ...n, read: true } : n));
  store.unreadCount = Math.max(0, store.unreadCount - 1);
  notify();
  try {
    const res = await notificationsApi.markRead(id);
    if (store) {
      store.unreadCount = res.unreadCount;
      notify();
    }
  } catch (err) {
    console.error('[useNotifications] markRead failed', err);
    if (store) {
      void refresh();
    }
  }
}

async function markAllRead(): Promise<void> {
  if (!store) return;
  store.items = store.items.map((n) => ({ ...n, read: true }));
  store.unreadCount = 0;
  notify();
  try {
    await notificationsApi.markAllRead();
  } catch (err) {
    console.error('[useNotifications] markAllRead failed', err);
    if (store) {
      void refresh();
    }
  }
}

async function deleteOne(id: string): Promise<void> {
  if (!store) return;
  const target = store.items.find((n) => n.id === id);
  if (!target) return;
  const wasUnread = !target.read;
  store.items = store.items.filter((n) => n.id !== id);
  if (wasUnread) {
    store.unreadCount = Math.max(0, store.unreadCount - 1);
  }
  const timerId = `toast-${id}`;
  const timer = store.timers.get(timerId);
  if (timer) {
    clearTimeout(timer);
    store.timers.delete(timerId);
  }
  store.toasts = store.toasts.filter((t) => t.id !== timerId);
  notify();
  try {
    const res = await notificationsApi.delete(id);
    if (store) {
      store.unreadCount = res.unreadCount;
      notify();
    }
  } catch (err) {
    console.error('[useNotifications] deleteOne failed', err);
    if (store) {
      void refresh();
    }
  }
}

async function deleteAll(): Promise<void> {
  if (!store) return;
  store.items = [];
  store.unreadCount = 0;
  store.timers.forEach((timer) => clearTimeout(timer));
  store.timers.clear();
  store.toasts = [];
  notify();
  try {
    await notificationsApi.deleteAll();
  } catch (err) {
    console.error('[useNotifications] deleteAll failed', err);
    if (store) {
      void refresh();
    }
  }
}

function toggleOpen(): void {
  if (!store) return;
  store.isOpen = !store.isOpen;
  if (store.isOpen) {
    void refresh();
  }
  notify();
}

function closeOpen(): void {
  if (!store) return;
  if (!store.isOpen) return;
  store.isOpen = false;
  notify();
}

function dismissToast(id: string): void {
  if (!store) return;
  store.toasts = store.toasts.filter((t) => t.id !== id);
  const timer = store.timers.get(id);
  if (timer) {
    clearTimeout(timer);
    store.timers.delete(id);
  }
  notify();
}

function handleNotificationNew(notification: NotificationEntry): void {
  if (!store) return;
  if (store.items.some((n) => n.id === notification.id)) return;
  const next = [notification, ...store.items];
  store.items = next.length > MAX_NOTIFICATIONS ? next.slice(0, MAX_NOTIFICATIONS) : next;
  if (!notification.read) {
    store.unreadCount = store.unreadCount + 1;
    const toastId = `toast-${notification.id}`;
    if (!store.toasts.some((t) => t.id === toastId)) {
      store.toasts = [...store.toasts, { id: toastId, notification }];
      const timer = setTimeout(() => {
        dismissToast(toastId);
      }, 6_000);
      store.timers.set(toastId, timer);
    }
  }
  notify();
}

function useSocketBridge(): void {
  useGlobalSocket({
    onNotificationNew: handleNotificationNew,
    onNotificationsInvalidate: () => {
      void refresh();
    },
  });
}

async function initialUnreadFetch(): Promise<void> {
  if (!store) return;
  if (store.fetchedOnce) return;
  try {
    const count = await notificationsApi.unreadCount();
    if (store) {
      store.unreadCount = count;
      store.fetchedOnce = true;
      notify();
    }
  } catch (err: any) {
    if (store) {
      store.fetchedOnce = true;
    }
    if (err?.response?.status === 401) {
      return; // Guest user, safely ignore
    }
    console.error('[useNotifications] initial unreadCount failed', err);
  }
}

export interface UseNotificationsReturn {
  notifications: NotificationEntry[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  unreadFriendsRequestCount: number;
  toasts: NotificationToast[];
  dismissToast: (id: string) => void;
}

export function useNotifications(): UseNotificationsReturn {
  useSocketBridge();

  const { items, unreadCount, isLoading, isLoadingMore, hasMore, isOpen, toasts } = useStoreSnapshot();

  useEffect(() => {
    const s = getStore();
    s.refCount += 1;
    if (!s.fetchedOnce) {
      void initialUnreadFetch();
    }
    return () => {
      s.refCount -= 1;
      if (s.refCount <= 0) {
        s.timers.forEach((timer) => clearTimeout(timer));
        s.timers.clear();
        store = null;
      }
    };
  }, []);

  const open = useCallback(() => {
    if (!store) return;
    if (!store.isOpen) {
      store.isOpen = true;
      notify();
    }
    void refresh();
  }, []);

  const close = useCallback(() => {
    closeOpen();
  }, []);

  const toggle = useCallback(() => {
    toggleOpen();
  }, []);

  const refreshFn = useCallback(async () => {
    await refresh();
  }, []);

  const loadMoreFn = useCallback(async () => {
    await loadMore();
  }, []);

  const markReadFn = useCallback(async (id: string) => {
    await markRead(id);
  }, []);

  const markAllReadFn = useCallback(async () => {
    await markAllRead();
  }, []);

  const deleteNotificationFn = useCallback(async (id: string) => {
    await deleteOne(id);
  }, []);

  const deleteAllFn = useCallback(async () => {
    await deleteAll();
  }, []);

  const dismissToastFn = useCallback((id: string) => {
    dismissToast(id);
  }, []);

  const unreadFriendsRequestCount = items.filter(
    (n) => n.type === 'FRIEND_REQUEST' && !n.read,
  ).length;

  return {
    notifications: items,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    isOpen,
    open,
    close,
    toggle,
    refresh: refreshFn,
    loadMore: loadMoreFn,
    markRead: markReadFn,
    markAllRead: markAllReadFn,
    deleteNotification: deleteNotificationFn,
    deleteAll: deleteAllFn,
    unreadFriendsRequestCount,
    toasts,
    dismissToast: dismissToastFn,
  };
}
