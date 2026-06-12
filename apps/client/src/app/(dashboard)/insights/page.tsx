'use client';

import React from 'react';
import { Bell, Sparkles, Lightbulb, CheckCheck, Trash2 } from 'lucide-react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useInsights } from './components/useInsights';
import { InsightCard } from './components/InsightCard';
import { Pagination } from './components/Pagination';

export default function InsightsPage() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const {
    insights,
    unreadCount,
    page,
    loading,
    actionLoading,
    totalPages,
    fetchInsights,
    handleMarkRead,
    handleMarkAllRead,
    handleDelete,
    handleDeleteAll,
  } = useInsights();

  return (
    <div className="min-h-dvh bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-accent/60 hover:text-accent border border-accent/20 hover:border-accent/50 rounded transition-all cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-red-500/50 hover:text-red-400 border border-red-500/20 hover:border-red-500/50 rounded transition-all cursor-pointer"
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
              <InsightCard
                key={insight.id}
                insight={insight}
                actionLoading={actionLoading}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={fetchInsights}
          />
        )}
      </div>
    </div>
  );
}
