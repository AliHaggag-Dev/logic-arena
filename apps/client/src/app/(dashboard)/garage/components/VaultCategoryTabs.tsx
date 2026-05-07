"use client";

import React from "react";
import { Hexagon, PaintBucket, Target } from "lucide-react";
import { CATEGORY_LABELS } from "../../black-market/constants";

export type CategoryKey = "chassis" | "paint" | "tracer";

export const CATEGORY_KEYS: readonly CategoryKey[] = ["chassis", "paint", "tracer"] as const;

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
  chassis: <Hexagon className="w-4 h-4" />,
  paint: <PaintBucket className="w-4 h-4" />,
  tracer: <Target className="w-4 h-4" />,
};

interface VaultCategoryTabsProps {
  activeCategory: CategoryKey;
  onChange: (cat: CategoryKey) => void;
}

export function VaultCategoryTabs({ activeCategory, onChange }: VaultCategoryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Item categories"
      className="flex gap-1.5 p-1.5 rounded-2xl bg-[rgba(var(--accent-rgb),0.04)] border border-accent/10 backdrop-blur-md"
    >
      {CATEGORY_KEYS.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <button
            type="button"
            key={cat}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl
              font-bold text-[10px] tracking-[0.16em] transition-all duration-200
              min-h-[44px] whitespace-nowrap
              ${
                isActive
                  ? "bg-accent text-bg-primary shadow-[0_0_16px_rgba(var(--accent-rgb),0.35)]"
                  : "text-accent/50 hover:text-accent/80 hover:bg-accent/5 active:bg-accent/10"
              }
            `}
          >
            {CATEGORY_ICONS[cat]}
            <span className="hidden sm:inline">{CATEGORY_LABELS[cat]}</span>
          </button>
        );
      })}
    </div>
  );
}
