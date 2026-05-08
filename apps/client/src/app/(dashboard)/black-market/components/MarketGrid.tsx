import type { ItemCategory, MarketItem } from "../types";

import { MarketCategoryTabs } from "./MarketCategoryTabs";
import { MarketItemCard } from "./MarketItemCard";

interface MarketGridProps {
  activeCategory: ItemCategory;
  canAffordWith: number;
  equippedIds: Record<ItemCategory, string>;
  isGuest: boolean;
  items: MarketItem[];
  loading: boolean;
  previewItemId: string;
  onCategoryChange: (category: ItemCategory) => void;
  onPreview: (item: MarketItem) => void;
  onPurchase: (item: MarketItem) => void;
  isOwned: (itemId: string) => boolean;
}

export function MarketGrid({ activeCategory, canAffordWith, equippedIds, isGuest, items, loading, previewItemId, onCategoryChange, onPreview, onPurchase, isOwned }: MarketGridProps) {
  return (
    <div className="flex flex-col gap-6">
      <MarketCategoryTabs activeCategory={activeCategory} onCategoryChange={onCategoryChange} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-accent/10" />
        <span className="text-[9px] tracking-[0.3em] text-accent/25 uppercase font-bold">{items.length} ITEMS IN STOCK</span>
        <div className="h-px flex-1 bg-accent/10" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => <div key={item} className="h-40 rounded-xl border border-accent/10 bg-accent/[0.03] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <MarketItemCard
              key={item.id}
              item={item}
              isGuest={isGuest}
              isOwned={isOwned(item.id)}
              isEquipped={equippedIds[item.category] === item.id}
              isPreview={previewItemId === item.id}
              canAfford={canAffordWith >= item.price}
              onPreview={onPreview}
              onPurchase={onPurchase}
            />
          ))}
        </div>
      )}
    </div>
  );
}
