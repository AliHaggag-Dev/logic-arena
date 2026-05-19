'use client';

import React from 'react';
import { CheckCheck, Trash2 } from 'lucide-react';
import type { AriaInsight } from '../types';
import { CATEGORY_COLORS } from '../types';
import { formatTime } from './useInsights';

interface InsightCardProps {
  insight: AriaInsight;
  actionLoading: string | null;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InsightCard({ insight, actionLoading, onMarkRead, onDelete }: InsightCardProps) {
  return (
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

            <p className="text-[11px] text-accent/40 leading-relaxed mt-1.5 whitespace-pre-wrap">
              {insight.content.replace(/\*\*(.*?)\*\*/g, '$1')}
            </p>

            <div className="mt-2 text-[8px] tracking-[0.15em] text-accent/20">
              {formatTime(insight.createdAt)}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!insight.isRead && (
              <button
                type="button"
                onClick={() => onMarkRead(insight.id)}
                disabled={actionLoading === insight.id}
                className="p-1.5 rounded text-accent/30 hover:text-accent hover:bg-accent/10 transition-all"
                aria-label="Mark as read"
              >
                <CheckCheck size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(insight.id)}
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
  );
}
