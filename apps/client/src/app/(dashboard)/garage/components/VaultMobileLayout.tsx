"use client";

import React, { useCallback, useRef, useState } from "react";
import { PackageOpen, Loader2, ChevronUp } from "lucide-react";
import { RobotShowroom } from "../../black-market/components/RobotShowroom";
import { MarketItem } from "../../black-market/types";
import { CATEGORY_LABELS } from "../../black-market/constants";
import { VaultCategoryTabs, CategoryKey } from "./VaultCategoryTabs";
import { VaultItemCard } from "./VaultItemCard";
import { VaultEmptyState } from "./VaultEmptyState";

// ── Constants ─────────────────────────────────────────────────────────────────

type SheetState = "peek" | "open";

const DRAG_THRESHOLD_PX = 60;
/** Height of the bottom nav bar in pixels */
const MOBILE_NAV_HEIGHT_PX = 64;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface VaultMobileLayoutProps {
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

export function VaultMobileLayout({
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
}: VaultMobileLayoutProps) {
  const [sheetState, setSheetState] = useState<SheetState>("peek");

  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    dragCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragStartY.current === null) return;
    const delta = dragCurrentY.current - dragStartY.current;
    if (delta < -DRAG_THRESHOLD_PX) setSheetState("open");
    else if (delta > DRAG_THRESHOLD_PX) setSheetState("peek");
    dragStartY.current = null;
  }, []);

  const toggleSheet = useCallback(() => {
    setSheetState((s) => (s === "peek" ? "open" : "peek"));
  }, []);

  const handleCategoryChange = useCallback(
    (cat: CategoryKey) => {
      onCategoryChange(cat);
    },
    [onCategoryChange]
  );

  return (
    <div className="fixed inset-0 bg-bg-primary overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-10%] left-[20%] w-[60vw] h-[60vw] rounded-full blur-[100px]"
          style={{ backgroundColor: "rgba(var(--accent-rgb), 0.08)" }}
        />
        <div
          className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[80px]"
          style={{ backgroundColor: "rgba(var(--accent-rgb), 0.05)" }}
        />
      </div>

      {/* Hero header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-5 pt-4 pb-2">
        <PackageOpen className="w-5 h-5 text-accent" />
        <div>
          <h1 className="text-base font-black tracking-[0.22em] text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)]">
            THE VAULT
          </h1>
          <p className="text-[8px] tracking-[0.18em] text-accent/50 font-bold uppercase">
            Personal Hangar
          </p>
        </div>
      </div>

      {/* 3D Robot Hero */}
      <div className="absolute inset-0 bottom-[42%]" style={{ top: "60px" }}>
        <div className="w-full h-full cursor-grab active:cursor-grabbing">
          <RobotShowroom
            chassisId={equippedChassis}
            paintColor={activePaintColor}
            tracerColor={activeTracerColor}
          />
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-bg-primary/80 backdrop-blur-md px-5 py-1.5 rounded-full border border-accent/25">
            <p className="text-[9px] tracking-[0.2em] text-accent font-bold uppercase animate-pulse">
              [ ACTIVE LOADOUT ]
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div
        className="absolute left-0 right-0 z-20 flex flex-col transition-[height] duration-300 ease-out"
        style={{
          height: sheetState === "open" ? "60%" : "44%",
          bottom: `${MOBILE_NAV_HEIGHT_PX}px`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex-1 flex flex-col bg-bg-primary/95 backdrop-blur-2xl rounded-t-3xl border-t border-x border-accent/15 overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.6)]">
          {/* Drag handle */}
          <button
            type="button"
            aria-label={sheetState === "open" ? "Collapse inventory" : "Expand inventory"}
            onClick={toggleSheet}
            className="flex flex-col items-center gap-1 pt-3 pb-2 px-4 w-full active:bg-accent/5 transition-colors"
          >
            <div className="w-10 h-1 rounded-full bg-accent/25" />
            <div className="flex items-center gap-1.5 mt-1">
              <ChevronUp
                className={`w-3.5 h-3.5 text-accent/50 transition-transform duration-200 ${
                  sheetState === "open" ? "rotate-180" : ""
                }`}
              />
              <span className="text-[9px] tracking-[0.2em] text-accent/40 font-mono font-bold uppercase">
                {sheetState === "open" ? "collapse" : "loadout"}
              </span>
            </div>
          </button>

          {/* Category tabs */}
          <div className="px-4 pb-3">
            <VaultCategoryTabs
              activeCategory={activeCategory}
              onChange={handleCategoryChange}
            />
          </div>

          {/* Horizontal snap-scroll item list */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-7 h-7 text-accent animate-spin" />
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="px-4">
                <VaultEmptyState categoryLabel={CATEGORY_LABELS[activeCategory]} />
              </div>
            ) : (
              <div
                className="flex gap-3 px-4 pb-4 overflow-x-auto overflow-y-hidden no-scrollbar items-start"
                style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
              >
                {displayedItems.map((item) => (
                  <div
                    key={item.id}
                    style={{ scrollSnapAlign: "start" }}
                    className="flex-shrink-0"
                  >
                    <VaultItemCard
                      item={item}
                      isEquipped={getEquippedIdForCategory(item.category) === item.id}
                      isEquipping={equippingId === item.id}
                      onEquip={onEquip}
                      isMobile={true}
                    />
                  </div>
                ))}
                {/* Trailing spacer for last card */}
                <div className="flex-shrink-0 w-4" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
