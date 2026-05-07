import type React from "react";
import { Cpu, Palette, Target } from "lucide-react";

import { CATEGORIES, CATEGORY_LABELS } from "../constants";
import type { ItemCategory } from "../types";

const CATEGORY_ICONS: Record<ItemCategory, React.ReactNode> = {
  chassis: <Cpu className="w-3.5 h-3.5" />,
  paint: <Palette className="w-3.5 h-3.5" />,
  tracer: <Target className="w-3.5 h-3.5" />,
};

interface MarketCategoryTabsProps {
  activeCategory: ItemCategory;
  onCategoryChange: (category: ItemCategory) => void;
}

export function MarketCategoryTabs({ activeCategory, onCategoryChange }: MarketCategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => {
        const isActive = activeCategory === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[10px] font-black
              tracking-[0.2em] font-mono transition-all duration-200 uppercase cursor-pointer
              ${isActive ? "bg-accent/15 border-accent/50 text-accent shadow-[0_0_16px_rgba(var(--accent-rgb),0.15)]" : "bg-accent/[0.03] border-accent/10 text-accent/40 hover:border-accent/30 hover:text-accent/70"}
            `}
          >
            {CATEGORY_ICONS[category]}
            {CATEGORY_LABELS[category]}
          </button>
        );
      })}
    </div>
  );
}
