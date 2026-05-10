'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { Bell, Trash2, CheckCheck, Sparkles, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import type { AriaInsight, InsightsResponse } from './types';
import { CATEGORY_COLORS } from './types';

const POLL_INTERVAL = 30_000;
const ITEMS_PER_PAGE = 20;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

export default function InsightsPage() {
  const isMobile = useMediaQuery('(max-width: 768px)');
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
      // Redirect to login if unauthorized
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

  return (
    <div className="min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, var(--accent) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" />
            <div>
              <h1 className="text-lg font-black tracking-[0.15em] text-accent">ARIA INSIGHTS</h1>
              <p className="text-[10px] tracking-[0.3em] text-accent/30 uppercase">Post-match analysis & tips</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={actionLoading === 'all'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-accent/60 hover:text-accent border border-accent/20 hover:border-accent/50 rounded transition-all"
              >
                <CheckCheck size={12} />
                {isMobile ? '' : 'Mark all read'}
              </button>
            )}
            {insights.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={actionLoading === 'all'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-red-500/50 hover:text-red-400 border border-red-500/20 hover:border-red-500/50 rounded transition-all"
              >
                <Trash2 size={12} />
                {isMobile ? '' : 'Delete all'}
              </button>
            )}
          </div>
        </div>

        {/* Unread banner */}
        {unreadCount > 0 && (
          <div className="mb-6 p-3 rounded border border-accent/15 bg-accent/[0.04] flex items-center gap-2">
            <Bell size={14} className="text-accent/60 animate-pulse shrink-0" />
            <span className="text-[11px] tracking-[0.15em] text-accent/60">
              {unreadCount} unread insight{unreadCount !== 1 ? 's' : ''} available
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && insights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles size={40} className="text-accent/20 mb-4" />
            <p className="text-[12px] tracking-[0.2em] text-accent/40 uppercase font-bold mb-2">No insights yet</p>
            <p className="text-[10px] tracking-[0.15em] text-accent/25 max-w-xs">
              Insights appear after completing a match. Head to the arena and battle to unlock post-match analysis.
            </p>
          </div>
        )}

        {/* Insights list */}
        {!loading && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map(insight => (
              <div
                key={insight.id}
                className={`relative group rounded border transition-all duration-200 ${
                  insight.isRead
                    ? 'border-accent/8 bg-bg-secondary/30'
                    : 'border-accent/25 bg-accent/[0.04] shadow-[0_0_15px_rgba(var(--accent-rgb),0.05)]'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 mb-1.5">
                        {!insight.isRead && (
                          <span className="w-2 h-2 rounded-full bg-accent shrink-0 shadow-[0_0_6px_rgba(var(--accent-rgb),0.6)]" />
                        )}
                        <h3 className={`text-[13px] font-bold tracking-[0.1em] truncate ${
                          insight.isRead ? 'text-accent/60' : 'text-accent'
                        }`}>
                          {insight.title}
                        </h3>
                      </div>

                      {/* Category badge */}
                      <span
                        className="inline-block text-[8px] font-bold tracking-[0.2em] uppercase px-1.5 py-0.5 rounded border mb-2"
                        style={{
                          borderColor: `${CATEGORY_COLORS[insight.category]}40`,
                          color: CATEGORY_COLORS[insight.category],
                          backgroundColor: `${CATEGORY_COLORS[insight.category]}10`,
                        }}
                      >
                        {insight.category}
                      </span>

                      {/* Content */}
                      <p className="text-[11px] text-accent/40 leading-relaxed mt-1.5 whitespace-pre-wrap">
                        {insight.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                      </p>

                      {/* Timestamp */}
                      <div className="mt-2 text-[8px] tracking-[0.15em] text-accent/20">
                        {formatTime(insight.createdAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!insight.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(insight.id)}
                          disabled={actionLoading === insight.id}
                          className="p-1.5 rounded text-accent/30 hover:text-accent hover:bg-accent/10 transition-all"
                          aria-label="Mark as read"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(insight.id)}
                        disabled={actionLoading === insight.id}
                        className="p-1.5 rounded text-accent/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        aria-label="Delete insight"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={() => fetchInsights(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-accent/50 hover:text-accent border border-accent/20 hover:border-accent/50 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={12} />
              PREV
            </button>
            <span className="text-[10px] tracking-[0.15em] text-accent/40">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => fetchInsights(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-accent/50 hover:text-accent border border-accent/20 hover:border-accent/50 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              NEXT
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
