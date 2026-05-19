'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
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
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-accent/50 hover:text-accent border border-accent/20 hover:border-accent/50 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        NEXT
        <ChevronRight size={12} />
      </button>
    </div>
  );
}
