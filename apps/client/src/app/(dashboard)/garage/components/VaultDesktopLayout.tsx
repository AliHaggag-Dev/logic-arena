"use client";

import React, { useMemo } from "react";
import { PackageOpen, Loader2 } from "lucide-react";
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
  getPreviewedIdForCategory: (category: string) => string | null;
  onCategoryChange: (cat: CategoryKey) => void;
  onEquip: (item: MarketItem) => void;
  onPreview: (item: MarketItem) => void;
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
  getPreviewedIdForCategory,
  onCategoryChange,
  onEquip,
  onPreview,
}: VaultDesktopLayoutProps) {
  const activeRobot = useMemo(
    () => MARKET_ITEMS.find((i) => i.id === equippedChassis),
    [equippedChassis]
  );

  const rarityTheme = useMemo(
    () => getRarityTheme(activeRobot?.rarity),
    [activeRobot?.rarity]
  );

  return (
    <div className="min-h-[100dvh] bg-bg-primary font-mono text-accent/90 relative">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] mix-blend-screen opacity-60"
          style={{ backgroundColor: "rgba(var(--accent-rgb), 0.08)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] mix-blend-screen opacity-50"
          style={{ backgroundColor: "rgba(var(--accent-rgb), 0.04)" }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto h-[100dvh] flex flex-col p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center">
            <PackageOpen className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-text-primary drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.5)]">
              GARAGE
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-text-secondary uppercase font-bold">
              Choose your robot and colors
            </p>
          </div>
        </div>

        {/* Side-by-side panels */}
        <div className="flex-1 flex flex-row gap-6 min-h-0">
          {/* Left: 3D Showroom */}
          <div className="w-[42%] rounded-2xl bg-bg-secondary/60 backdrop-blur-md border border-border/60 shadow-[0_0_35px_rgba(var(--accent-rgb),0.06)] overflow-hidden flex flex-col relative group">
            {/* Top viewport status bar */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-2.5 bg-bg-primary/75 backdrop-blur-md border-b border-border/40">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-xs font-black tracking-widest text-text-primary uppercase truncate">
                  {activeRobot?.name ?? "ROBOT"}
                </span>
              </div>

              {/* Gaming rarity badge with tier animation */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className={`
                    flex items-center gap-1 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full border
                    transition-all duration-300 ${rarityTheme.badgeClass}
                  `}
                >
                  <span className="text-[10px]">{rarityTheme.iconSymbol}</span>
                  <span>{activeRobot?.rarity ?? "COMMON"}</span>
                </span>
              </div>
            </div>

            {/* Corner tech accents */}
            <div className="absolute top-11 left-3 w-3 h-3 border-t border-l border-accent/40 rounded-tl pointer-events-none z-10" />
            <div className="absolute top-11 right-3 w-3 h-3 border-t border-r border-accent/40 rounded-tr pointer-events-none z-10" />
            <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-accent/40 rounded-bl pointer-events-none z-10" />
            <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-accent/40 rounded-br pointer-events-none z-10" />

            {/* 3D Canvas Area */}
            <div className="flex-1 w-full cursor-grab active:cursor-grabbing relative pt-8 pb-10">
              {/* Dynamic Rarity Holographic Floor Pedestal */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none w-72 h-28 flex items-center justify-center z-0">
                {/* Primary core glow */}
                <div
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{
                    background: `radial-gradient(ellipse at center, ${rarityTheme.glowColor} 0%, transparent 70%)`,
                    animation: "pedestalCorePulse 3s ease-in-out infinite",
                  }}
                />

                {/* Outer spinning cyber ring */}
                <div
                  className="w-64 h-20 rounded-full border border-dashed"
                  style={{
                    borderColor: rarityTheme.color,
                    opacity: 0.55,
                    boxShadow: `0 0 25px ${rarityTheme.glowColor}`,
                    animation: "pedestalSpinSlow 24s linear infinite",
                  }}
                />

                {/* Middle solid ring with glowing aura */}
                <div
                  className="absolute w-52 h-16 rounded-full border-2"
                  style={{
                    borderColor: rarityTheme.color,
                    boxShadow: `0 0 30px ${rarityTheme.glowColor}, inset 0 0 15px ${rarityTheme.glowColor}`,
                    transform: "rotateX(68deg)",
                  }}
                />

                {/* Inner counter-spinning segmented ring */}
                <div
                  className="absolute w-40 h-12 rounded-full border border-dotted"
                  style={{
                    borderColor: rarityTheme.color,
                    opacity: 0.8,
                    animation: "pedestalSpinReverse 16s linear infinite",
                  }}
                />

                {/* Center power node */}
                <div
                  className="absolute w-12 h-4 rounded-full blur-[2px]"
                  style={{
                    backgroundColor: rarityTheme.color,
                    boxShadow: `0 0 16px ${rarityTheme.color}`,
                    transform: "rotateX(68deg)",
                  }}
                />
              </div>

              <RobotShowroom
                chassisId={equippedChassis}
                paintColor={activePaintColor}
                tracerColor={activeTracerColor}
              />
            </div>


            {/* Bottom active loadout summary badge */}
            <div className="absolute bottom-3 inset-x-0 flex flex-col items-center gap-1.5 pointer-events-none z-20">
              <div className="bg-bg-primary/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-border/60 shadow-lg flex items-center gap-2.5">
                <span className="text-[10px] font-bold tracking-wider text-text-primary">
                  {activeRobot?.name}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5">
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
              <p className="text-[8px] tracking-[0.2em] text-text-secondary/80 font-mono uppercase">
                DRAG TO ROTATE 360°
              </p>
            </div>
          </div>

          {/* Right: Inventory */}
          <div className="w-[58%] flex flex-col gap-4 min-h-0">
            <VaultCategoryTabs
              activeCategory={activeCategory}
              onChange={onCategoryChange}
            />

            <div className="flex-1 overflow-y-auto garage-scrollbar pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
              ) : displayedItems.length === 0 ? (
                <VaultEmptyState categoryLabel={CATEGORY_LABELS[activeCategory]} />
              ) : (
                <div
                  className={`
                    ${
                      activeCategory === "chassis"
                        ? "grid grid-cols-1 xl:grid-cols-2 gap-3.5 pb-10"
                        : activeCategory === "paint"
                        ? "grid grid-cols-1 md:grid-cols-2 gap-3 pb-10"
                        : "grid grid-cols-1 gap-3 pb-10"
                    }
                  `}
                >
                  {displayedItems.map((item) => {
                    const isEquipped = getEquippedIdForCategory(item.category) === item.id;
                    const previewId = getPreviewedIdForCategory(item.category);
                    const isPreviewed = previewId ? previewId === item.id : isEquipped;

                    return (
                      <VaultItemCard
                        key={item.id}
                        item={item}
                        isEquipped={isEquipped}
                        isPreviewed={isPreviewed}
                        isEquipping={equippingId === item.id}
                        onEquip={onEquip}
                        onPreview={onPreview}
                        isMobile={false}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

