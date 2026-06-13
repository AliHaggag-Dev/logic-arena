import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MAX_VISIBLE_PAGES = 5;

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  totalPages,
  isLoading,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  /** Build the page number array with ellipsis markers (-1). */
  function buildPageNumbers(): (number | -1)[] {
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | -1)[] = [1];

    const windowStart = Math.max(2, page - 1);
    const windowEnd = Math.min(totalPages - 1, page + 1);

    if (windowStart > 2) pages.push(-1); // left ellipsis

    for (let p = windowStart; p <= windowEnd; p++) {
      pages.push(p);
    }

    if (windowEnd < totalPages - 1) pages.push(-1); // right ellipsis

    pages.push(totalPages);
    return pages;
  }

  const pages = buildPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 mt-6" role="navigation" aria-label="Leaderboard pagination">
      {/* Prev */}
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1 || isLoading}
        onClick={() => onPageChange(page - 1)}
        className="flex items-center justify-center w-8 h-8 rounded border border-accent/20 bg-accent/5 text-accent/60 hover:border-accent/50 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
      >
        <ChevronLeft size={14} aria-hidden="true" />
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === -1 ? (
          <span
            key={`ellipsis-${i}`}
            className="w-8 h-8 flex items-center justify-center text-accent/30 text-xs select-none cursor-pointer"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            disabled={isLoading}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded border text-xs font-bold font-mono tracking-wider transition-all duration-150 disabled:cursor-not-allowed cursor-pointer ${
              p === page
                ? "border-accent bg-accent/15 text-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.25)]"
                : "border-accent/15 bg-transparent text-accent/50 hover:border-accent/40 hover:text-accent hover:bg-accent/8"
            }`}
          >
            {p}
          </button>
        ),
      )}

      {/* Next */}
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages || isLoading}
        onClick={() => onPageChange(page + 1)}
        className="flex items-center justify-center w-8 h-8 rounded border border-accent/20 bg-accent/5 text-accent/60 hover:border-accent/50 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
      >
        <ChevronRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
