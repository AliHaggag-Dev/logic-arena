"use client";

import { BlackMarketStyles } from "./components/BlackMarketStyles";
import { MarketGrid } from "./components/MarketGrid";
import { MarketHeader } from "./components/MarketHeader";
import { MarketToast } from "./components/MarketToast";
import { ShowroomPanel } from "./components/ShowroomPanel";
import { useBlackMarket } from "./hooks/useBlackMarket";

export default function BlackMarketPage() {
  const market = useBlackMarket();

  return (
    <>
      <BlackMarketStyles />

      <div className="min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-x-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(var(--accent-rgb),0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] pointer-events-none z-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center top, rgba(var(--accent-rgb),0.5) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-[1300px] mx-auto px-6 pt-10 pb-24" style={{ animation: "marketFadeIn 0.4s ease" }}>
          <MarketHeader isGuest={market.isGuest} loading={market.loading} points={market.points} />

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8">
            <MarketGrid
              activeCategory={market.activeCategory}
              canAffordWith={market.points}
              equippedIds={market.equippedIds}
              isGuest={market.isGuest}
              items={market.filteredItems}
              loading={market.loading}
              previewItemId={market.previewItem.id}
              isOwned={market.isOwned}
              onCategoryChange={market.setActiveCategory}
              onPreview={market.handlePreview}
              onPurchase={market.handlePurchase}
            />

            <ShowroomPanel
              actionLoading={market.actionLoading}
              equippedIds={market.equippedIds}
              isGuest={market.isGuest}
              isOwned={market.isOwned}
              ownedCount={market.ownedItemIds.size}
              points={market.points}
              previewItem={market.previewItem}
              previewLoadout={market.previewLoadout}
              onPurchase={market.handlePurchase}
            />
          </div>
        </div>
      </div>

      {market.toast && <MarketToast message={market.toast.message} type={market.toast.type} />}
    </>
  );
}
