"use client";

import React from "react";
import { PackageOpen, Loader2 } from "lucide-react";
import { RobotShowroom } from "../../black-market/components/RobotShowroom";
import { MarketItem } from "../../black-market/types";
import { CATEGORY_LABELS } from "../../black-market/constants";
import { VaultCategoryTabs, CategoryKey } from "./VaultCategoryTabs";
import { VaultItemCard } from "./VaultItemCard";
import { VaultEmptyState } from "./VaultEmptyState";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface VaultDesktopLayoutProps {
  equippedChassis: string;
  activePaintColor: string;
  activeTracerColor: string;
  activeCategory: CategoryKey;
  displayedItems: MarketItem[];
  isLoading: boolean;
  equippingId: string | null;
  getEquippedIdForCategory: (category: string) => string;
  onCategoryChange: (cat: CategoryKey) => void;
  onEquip: (item: MarketItem) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VaultDesktopLayout({
  equippedChassis,
  activePaintColor,
  activeTracerColor,
  activeCategory,
  displayedItems,
  isLoading,
  equippingId,
  getEquippedIdForCategory,
  onCategoryChange,
  onEquip,
}: VaultDesktopLayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-bg-primary font-mono text-accent/90 relative">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen"
          style={{ backgroundColor: "rgba(var(--accent-rgb), 0.08)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] mix-blend-screen"
          style={{ backgroundColor: "rgba(var(--accent-rgb), 0.04)" }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto h-[100dvh] flex flex-col p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <PackageOpen className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-widest text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)]">
              THE VAULT
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-accent/60 uppercase font-bold">
              Personal Hangar &amp; Loadout Configuration
            </p>
          </div>
        </div>

        {/* Side-by-side panels */}
        <div className="flex-1 flex flex-row gap-6 min-h-0">
          {/* Left: 3D Showroom */}
          <div className="w-[45%] rounded-2xl bg-[rgba(var(--accent-rgb),0.02)] backdrop-blur-md border border-accent/20 shadow-[0_0_40px_rgba(var(--accent-rgb),0.05)] overflow-hidden flex flex-col relative">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="flex-1 w-full cursor-grab active:cursor-grabbing">
              <RobotShowroom
                chassisId={equippedChassis}
                paintColor={activePaintColor}
                tracerColor={activeTracerColor}
              />
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
              <div className="bg-bg-primary/80 backdrop-blur px-6 py-2 rounded-full border border-accent/30">
                <p className="text-[10px] tracking-widest text-accent font-bold uppercase animate-pulse">
                  [ ACTIVE LOADOUT ]
                </p>
              </div>
            </div>
          </div>

          {/* Right: Inventory */}
          <div className="w-[55%] flex flex-col gap-4 min-h-0">
            <VaultCategoryTabs
              activeCategory={activeCategory}
              onChange={onCategoryChange}
            />

            <div className="flex-1 overflow-y-auto garage-scrollbar pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
              ) : displayedItems.length === 0 ? (
                <VaultEmptyState categoryLabel={CATEGORY_LABELS[activeCategory]} />
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-12">
                  {displayedItems.map((item) => (
                    <VaultItemCard
                      key={item.id}
                      item={item}
                      isEquipped={getEquippedIdForCategory(item.category) === item.id}
                      isEquipping={equippingId === item.id}
                      onEquip={onEquip}
                      isMobile={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
