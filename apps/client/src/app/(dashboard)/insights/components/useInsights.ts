'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../lib/api-client';
import type { AriaInsight, InsightsResponse } from '../types';

const POLL_INTERVAL = 30_000;
const ITEMS_PER_PAGE = 20;

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

export function useInsights() {
  const router = useRouter();

  const [insights, setInsights] = useState<AriaInsight[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInsights = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<InsightsResponse>('/ai/insights', {
        params: { page: p, limit: ITEMS_PER_PAGE },
      });
      setInsights(data.items);
      setTotal(data.total);
      setUnreadCount(data.unreadCount);
      setPage(data.page);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInsights(1);
  }, [fetchInsights]);

  useEffect(() => {
    const interval = setInterval(() => fetchInsights(page), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchInsights, page]);

  const handleMarkRead = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/ai/insights/${id}/read`);
      setInsights(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleMarkAllRead = async () => {
    setActionLoading('all');
    try {
      await apiClient.patch('/ai/insights/read-all');
      setInsights(prev => prev.map(i => ({ ...i, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.delete(`/ai/insights/${id}`);
      setInsights(prev => prev.filter(i => i.id !== id));
      setTotal(prev => prev - 1);
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleDeleteAll = async () => {
    setActionLoading('all');
    try {
      await apiClient.delete('/ai/insights');
      setInsights([]);
      setTotal(0);
      setUnreadCount(0);
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return {
    insights,
    unreadCount,
    total,
    page,
    loading,
    actionLoading,
    totalPages,
    fetchInsights,
    handleMarkRead,
    handleMarkAllRead,
    handleDelete,
    handleDeleteAll,
  };
}
