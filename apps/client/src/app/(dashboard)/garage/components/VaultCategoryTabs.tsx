"use client";

import React from "react";
import { Bot, Palette, Zap } from "lucide-react";
import { CATEGORY_LABELS } from "../../black-market/constants";

export type CategoryKey = "chassis" | "paint" | "tracer";

export const CATEGORY_KEYS: readonly CategoryKey[] = ["chassis", "paint", "tracer"] as const;

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
  chassis: <Bot className="w-4 h-4" />,
  paint: <Palette className="w-4 h-4" />,
  tracer: <Zap className="w-4 h-4" />,
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
      className="flex gap-2 p-1.5 rounded-2xl bg-bg-secondary/70 border border-border/60 backdrop-blur-md shadow-sm"
    >
      {CATEGORY_KEYS.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <button
            type="button"
            key={cat}
            role="tab"
            aria-selected={isActive}
            aria-label={CATEGORY_LABELS[cat]}
            onClick={() => onChange(cat)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              font-bold text-xs tracking-wider transition-all duration-200
              min-h-[40px] whitespace-nowrap cursor-pointer
              ${
                isActive
                  ? "bg-accent text-bg-primary shadow-[0_0_18px_rgba(var(--accent-rgb),0.35)] scale-[1.02]"
                  : "text-text-secondary hover:text-text-primary hover:bg-accent/5 active:scale-95"
              }
            `}
          >
            {CATEGORY_ICONS[cat]}
            <span>{CATEGORY_LABELS[cat]}</span>
          </button>
        );
      })}
    </div>
  );
}

