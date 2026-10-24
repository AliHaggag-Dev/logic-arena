"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { PackageOpen, Loader2, ChevronUp } from "lucide-react";
import dynamic from "next/dynamic";
import { MarketItem } from "../../black-market/types";
import { CATEGORY_LABELS, MARKET_ITEMS } from "../../black-market/constants";
import { VaultCategoryTabs, CategoryKey } from "./VaultCategoryTabs";
import { VaultItemCard } from "./VaultItemCard";
import { VaultEmptyState } from "./VaultEmptyState";
import { getRarityTheme } from "../constants/rarity.constants";

const RobotShowroom = dynamic(
  () => import("../../black-market/components/RobotShowroom").then((m) => m.RobotShowroom),
  { ssr: false },
);

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
  getPreviewedIdForCategory: (category: string) => string | null;
  onCategoryChange: (cat: CategoryKey) => void;
  onEquip: (item: MarketItem) => void;
  onPreview: (item: MarketItem) => void;
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
  getPreviewedIdForCategory,
  onCategoryChange,
  onEquip,
  onPreview,
}: VaultMobileLayoutProps) {
  const [sheetState, setSheetState] = useState<SheetState>("peek");

  const activeRobot = useMemo(
    () => MARKET_ITEMS.find((i) => i.id === equippedChassis),
    [equippedChassis]
  );

  const rarityTheme = useMemo(
    () => getRarityTheme(activeRobot?.rarity),
    [activeRobot?.rarity]
  );

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
    <div
      className="fixed inset-x-0 bg-bg-primary overflow-hidden font-mono select-none"
      style={{ top: "56px", bottom: "64px" }}
    >
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

      {/* Floating iOS Dynamic Status Island */}
      <div className="absolute top-2.5 inset-x-0 z-10 flex items-center justify-between px-3.5 pointer-events-none">
        {/* Left: Garage designation */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-secondary/85 backdrop-blur-md border border-border/50 shadow-md">
          <PackageOpen className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] font-black tracking-widest text-text-primary uppercase">
            GARAGE
          </span>
        </div>

        {/* Right: Active Robot Rarity Badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-md backdrop-blur-md bg-bg-secondary/85"
          style={{ borderColor: `${rarityTheme.color}60` }}
        >
          <span className="text-[10px]">{rarityTheme.iconSymbol}</span>
          <span
            className="text-[10px] font-black tracking-wider truncate max-w-[110px]"
            style={{ color: rarityTheme.color }}
          >
            {activeRobot?.name}
          </span>
          <span className="w-1 h-1 rounded-full bg-border mx-0.5" />
          <span className="text-[9px] font-bold text-text-secondary uppercase">
            {activeRobot?.rarity}
          </span>
        </div>
      </div>

      {/* 3D Robot Stage */}
      <div
        className="absolute inset-x-0 top-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ bottom: sheetState === "open" ? "62%" : "235px" }}
      >
        {/* Dynamic Rarity Holographic Floor Pedestal */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 pointer-events-none w-56 h-20 flex items-center justify-center z-0">
          <div
            className="absolute inset-0 rounded-full blur-xl"
            style={{
              background: `radial-gradient(ellipse at center, ${rarityTheme.glowColor} 0%, transparent 70%)`,
              animation: "pedestalCorePulse 3s ease-in-out infinite",
            }}
          />
          <div
            className="w-48 h-15 rounded-full border border-dashed"
            style={{
              borderColor: rarityTheme.color,
              opacity: 0.6,
              boxShadow: `0 0 20px ${rarityTheme.glowColor}`,
              animation: "pedestalSpinSlow 24s linear infinite",
            }}
          />
          <div
            className="absolute w-34 h-10 rounded-full border-2"
            style={{
              borderColor: rarityTheme.color,
              boxShadow: `0 0 24px ${rarityTheme.glowColor}`,
              transform: "rotateX(68deg)",
            }}
          />
        </div>

        <div className="w-full h-full cursor-grab active:cursor-grabbing relative z-0">
          <RobotShowroom
            chassisId={equippedChassis}
            paintColor={activePaintColor}
            tracerColor={activeTracerColor}
          />
        </div>

        {/* Bottom Stage Hint + Loadout dots */}
        <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-2 pointer-events-none z-10 px-4">
          <div className="bg-bg-primary/80 backdrop-blur-md px-3 py-1 rounded-full border border-border/50 shadow-md flex items-center gap-1.5 text-[9px] text-text-secondary font-mono tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>360° INSPECT</span>
          </div>
          <div className="bg-bg-primary/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-border/50 shadow-md flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/20"
              style={{
                background: activePaintColor === "DEFAULT" ? "var(--accent)" : activePaintColor,
              }}
              title="Paint color"
            />
            <span
              className="w-3.5 h-1 rounded-full"
              style={{
                backgroundColor: activeTracerColor,
                boxShadow: `0 0 6px ${activeTracerColor}`,
              }}
              title="Laser tracer"
            />
          </div>
        </div>
      </div>

      {/* iOS Native Style Bottom Sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 z-20 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          height: sheetState === "open" ? "62%" : "235px",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex-1 flex flex-col bg-bg-secondary/95 backdrop-blur-2xl rounded-t-[28px] border-t border-x border-border/60 overflow-hidden shadow-[0_-12px_40px_rgba(0,0,0,0.75)]">
          {/* iOS Grabber Handle */}
          <button
            type="button"
            aria-label={sheetState === "open" ? "Collapse inventory" : "Expand inventory"}
            onClick={toggleSheet}
            className="flex flex-col items-center pt-2.5 pb-1 px-4 w-full active:opacity-60 transition-opacity cursor-pointer group"
          >
            <div className="w-9 h-1 rounded-full bg-border group-hover:bg-accent/50 transition-colors" />
            <div className="flex items-center gap-1 mt-1 text-[8px] font-bold text-text-secondary tracking-widest uppercase">
              <ChevronUp
                className={`w-3 h-3 text-accent transition-transform duration-200 ${
                  sheetState === "open" ? "rotate-180" : ""
                }`}
              />
              <span>{sheetState === "open" ? "COLLAPSE" : "LOADOUT"}</span>
            </div>
          </button>

          {/* Segmented Control Category Tabs */}
          <div className="px-4 pb-2.5">
            <VaultCategoryTabs
              activeCategory={activeCategory}
              onChange={handleCategoryChange}
            />
          </div>

          {/* Sheet Body: Custom Layout per Category */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-7 h-7 text-accent animate-spin" />
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="px-4">
                <VaultEmptyState categoryLabel={CATEGORY_LABELS[activeCategory]} />
              </div>
            ) : activeCategory === "paint" ? (
              /* Dedicated iOS Color Palette Swatches */
              <div className="flex items-center justify-around px-4 py-3 w-full gap-2 overflow-x-auto no-scrollbar">
                {displayedItems.map((item) => {
                  const isEquipped = getEquippedIdForCategory(item.category) === item.id;
                  const isDefault = item.color === "DEFAULT";
                  const swatchBg = isDefault
                    ? "linear-gradient(135deg, #475569 50%, #1e293b 50%)"
                    : item.color;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onPreview(item);
                        onEquip(item);
                      }}
                      aria-label={`Select ${item.name} paint`}
                      className="flex flex-col items-center gap-2 p-1 rounded-xl active:scale-95 transition-transform flex-shrink-0 cursor-pointer"
                    >
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative transition-all duration-200 ${
                          isEquipped
                            ? "border-emerald-400 ring-2 ring-emerald-400/50 scale-110 shadow-lg"
                            : "border-border/60 hover:border-accent/60"
                        }`}
                        style={{
                          background: swatchBg,
                          boxShadow: isDefault
                            ? undefined
                            : isEquipped
                            ? `0 0 16px ${item.glowColor}`
                            : `0 0 8px ${item.glowColor}50`,
                        }}
                      >
                        {isEquipped && (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold tracking-wider uppercase ${
                          isEquipped ? "text-emerald-400" : "text-text-secondary"
                        }`}
                      >
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Robots & Lasers horizontal snap scroll */
              <div
                className="flex gap-3 px-4 pb-3 overflow-x-auto overflow-y-hidden no-scrollbar items-start"
                style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
              >
                {displayedItems.map((item) => {
                  const isEquipped = getEquippedIdForCategory(item.category) === item.id;
                  const previewId = getPreviewedIdForCategory(item.category);
                  const isPreviewed = previewId ? previewId === item.id : isEquipped;

                  return (
                    <div
                      key={item.id}
                      style={{ scrollSnapAlign: "start" }}
                      className="flex-shrink-0"
                    >
                      <VaultItemCard
                        item={item}
                        isEquipped={isEquipped}
                        isPreviewed={isPreviewed}
                        isEquipping={equippingId === item.id}
                        onEquip={onEquip}
                        onPreview={onPreview}
                        isMobile={true}
                      />
                    </div>
                  );
                })}
                <div className="flex-shrink-0 w-4" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

