"use client";

import React, { useState } from "react";
import {
  Lock, Check, Zap, Cpu, GitBranch, RefreshCw,
  List, Database, Repeat, Network, ArrowUpDown, Layers,
} from "lucide-react";
import type { ApiTabInfo, ApiLevelInfo } from "../types/campaign.types";
import type { CampaignTabId } from "../constants/campaign.constants";
import { DIFFICULTY_CONFIG } from "../constants/difficulty.constants";
import { LevelDetailModal } from "./LevelDetailModal";

type IconComp = React.ComponentType<{ className?: string }>;

const TAB_ICONS: Record<string, IconComp> = {
  "conditionals":        GitBranch,
  "loops":               RefreshCw,
  "arrays":              List,
  "data-structures":     Database,
  "recursion":           Repeat,
  "graph-theory":        Network,
  "sorting":             ArrowUpDown,
  "dynamic-programming": Layers,
};

const TAB_SHORT: Record<string, string> = {
  "conditionals":        "IF",
  "loops":               "LOOP",
  "arrays":              "ARR",
  "data-structures":     "DS",
  "recursion":           "REC",
  "graph-theory":        "GFX",
  "sorting":             "SORT",
  "dynamic-programming": "DP",
};

interface CampaignLayoutProps {
  tabs: ApiTabInfo[];
  loading: boolean;
  isGuest: boolean;
  isMobile: boolean;
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-accent/10" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin" />
      </div>
      <p className="text-[10px] tracking-[0.4em] text-accent/50 uppercase font-black animate-pulse">
        Decrypting Campaign Data...
      </p>
    </div>
  );
}

function GuestState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6 text-center">
      <div className="w-20 h-20 bg-accent/5 border border-accent/15 rounded-2xl flex items-center justify-center">
        <Lock className="w-10 h-10 text-accent/30" />
      </div>
      <div>
        <h2 className="text-[18px] font-black tracking-[0.2em] text-accent uppercase mb-2">
          Access Restricted
        </h2>
        <p className="text-[11px] text-accent/40 tracking-wider max-w-sm uppercase leading-relaxed">
          Log in to access the algorithmic proving grounds.
        </p>
      </div>
    </div>
  );
}

/* ─── MOBILE CARD ─────────────────────────────────────────────────────────── */
function MobileLevelCard({
  level,
  onClick,
}: {
  level: ApiLevelInfo;
  onClick: () => void;
}) {
  const dc = DIFFICULTY_CONFIG[level.difficulty] ?? DIFFICULTY_CONFIG.EASY;

  if (!level.unlocked) {
    return (
      <div className="relative flex items-stretch min-h-[100px] rounded-2xl border border-accent/10 overflow-hidden bg-bg-primary opacity-60">
        {/* Left bar — muted */}
        <div className="w-1 shrink-0 bg-accent/10" />
        <div className="flex-1 px-4 py-3 relative z-10">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <span className="text-[9px] tracking-[0.35em] text-accent/30 font-black uppercase block mb-1">
                ORDER {String(level.order).padStart(2, "0")}
              </span>
              <h3 className="text-[14px] font-black tracking-[0.12em] uppercase leading-tight text-accent/30">
                {level.title}
              </h3>
            </div>
            <Lock className="w-4 h-4 text-accent/25 shrink-0 mt-1" />
          </div>
          <p className="text-[10px] text-accent/20 tracking-[0.04em] leading-relaxed line-clamp-2 mb-3">
            {level.description}
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-[8px] font-black tracking-[0.25em] border rounded-full px-2.5 py-0.5 opacity-40 ${dc.text} ${dc.border} ${dc.bg}`}>
              {level.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-accent/20">
              <Zap className="w-3 h-3" /> +{level.pointsReward}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-stretch min-h-[100px] rounded-2xl border overflow-hidden cursor-pointer text-left w-full group transition-all duration-200 active:scale-[0.98]"
      style={{
        borderColor: level.completed ? "rgba(var(--accent-rgb),0.15)" : "rgba(var(--accent-rgb),0.25)",
        background: level.completed ? "rgba(var(--accent-rgb),0.02)" : "var(--bg-primary)",
      }}
    >
      {/* Difficulty accent left bar */}
      <div
        className="w-1 shrink-0 transition-all duration-300"
        style={{ background: dc.color, boxShadow: `0 0 8px ${dc.color}60` }}
      />

      <div className="flex-1 px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] tracking-[0.35em] text-accent/40 font-black uppercase block mb-1">
              ORDER {String(level.order).padStart(2, "0")}
            </span>
            <h3 className={`text-[14px] font-black tracking-[0.12em] uppercase leading-tight ${level.completed ? "text-accent/50" : "text-accent"}`}>
              {level.title}
            </h3>
          </div>
          {level.completed && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[8px] font-black tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
              <Check className="w-2.5 h-2.5" /> CLEAR
            </span>
          )}
        </div>

        <p className="text-[10px] text-accent/35 tracking-[0.04em] leading-relaxed line-clamp-2 mb-3">
          {level.description}
        </p>

        <div className="flex items-center justify-between">
          <span className={`text-[8px] font-black tracking-[0.25em] border rounded-full px-2.5 py-0.5 ${dc.text} ${dc.border} ${dc.bg}`}>
            {level.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-accent/50">
            <Zap className="w-3 h-3 text-yellow-400/80" />
            <span className="text-yellow-400/80">+{level.pointsReward}</span>
          </span>
        </div>
      </div>

      {/* Hover shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}

/* ─── MOBILE LAYOUT ───────────────────────────────────────────────────────── */
function MobileLayout({
  tabs,
  activeTabId,
  setActiveTabId,
  setSelectedLevel,
}: {
  tabs: ApiTabInfo[];
  activeTabId: CampaignTabId;
  setActiveTabId: (id: CampaignTabId) => void;
  setSelectedLevel: (l: ApiLevelInfo | null) => void;
}) {
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const completedCount = activeTab.levels.filter((l) => l.completed).length;
  const totalCount = activeTab.levels.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col relative z-10">
      {/* ── Sticky header + tab strip ── */}
      <div
        className="sticky top-0 z-30 pb-3"
        style={{ background: "rgba(var(--bg-primary-rgb,10,10,20),0.96)", backdropFilter: "blur(16px)" }}
      >
        {/* Title row */}
        <div className="flex items-baseline justify-between px-4 pt-4 pb-2">
          <div>
            <h1 className="text-[22px] font-black tracking-[0.18em] text-accent leading-none uppercase"
              style={{ textShadow: "0 0 20px rgba(var(--accent-rgb),0.6)" }}>
              PROVING GROUNDS
            </h1>
            <p className="text-[8px] text-accent/40 tracking-[0.25em] uppercase mt-0.5">
              Phase 6 · Algorithmic Warfare
            </p>
          </div>
          <Cpu className="w-5 h-5 text-accent/30" />
        </div>

        {/* Scrollable tab pills */}
        <div className="flex gap-2 px-4 overflow-x-auto hide-scrollbar pb-1">
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab.id] ?? GitBranch;
            const isActive = tab.id === activeTabId;
            const done = tab.levels.filter((l) => l.completed).length;
            const total = tab.levels.length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id as CampaignTabId)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer"
                style={
                  isActive
                    ? { background: "rgba(var(--accent-rgb),0.15)", borderColor: "rgba(var(--accent-rgb),0.5)", boxShadow: "0 0 12px rgba(var(--accent-rgb),0.2)" }
                    : { background: "rgba(var(--accent-rgb),0.03)", borderColor: "rgba(var(--accent-rgb),0.12)" }
                }
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-accent" : "text-accent/40"}`} />
                <span className={`text-[9px] font-black tracking-[0.2em] uppercase whitespace-nowrap ${isActive ? "text-accent" : "text-accent/40"}`}>
                  {TAB_SHORT[tab.id] ?? tab.label}
                </span>
                {done > 0 && (
                  <span className={`text-[8px] font-black ${isActive ? "text-accent/70" : "text-accent/30"}`}>
                    {done}/{total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active tab progress bar */}
        <div className="px-4 pt-2">
          <div className="flex justify-between text-[8px] font-black tracking-[0.25em] text-accent/40 uppercase mb-1.5">
            <span>{activeTab.label} Progress</span>
            <span>{completedCount} / {totalCount}</span>
          </div>
          <div className="h-[2px] bg-accent/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%`, boxShadow: "0 0 6px rgba(var(--accent-rgb),0.8)" }}
            />
          </div>
        </div>
      </div>

      {/* ── Level cards ── */}
      <div className="px-4 pt-3 pb-[120px] flex flex-col gap-3">
        {activeTab.levels.map((level) => (
          <MobileLevelCard
            key={level.id}
            level={level}
            onClick={() => setSelectedLevel(level)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── DESKTOP LAYOUT ──────────────────────────────────────────────────────── */
function DesktopLayout({
  tabs,
  activeTabId,
  setActiveTabId,
  setSelectedLevel,
}: {
  tabs: ApiTabInfo[];
  activeTabId: CampaignTabId;
  setActiveTabId: (id: CampaignTabId) => void;
  setSelectedLevel: (l: ApiLevelInfo | null) => void;
}) {
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  return (
    <div className="max-w-[1280px] mx-auto px-8 pt-16 pb-[120px] relative z-10 animate-[fadeIn_0.4s_ease]">
      <div className="flex gap-10">
        {/* ── Left sidebar ── */}
        <aside className="w-[240px] shrink-0">
          <div className="mb-8">
            <h1 className="text-[28px] font-black tracking-[0.2em] text-accent drop-shadow-[0_0_14px_rgba(var(--accent-rgb),0.8)] leading-none uppercase mb-1">
              Proving Grounds
            </h1>
            <p className="text-[9px] text-accent/40 tracking-[0.2em] uppercase">
              Phase 6: Algorithmic Warfare
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            {tabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id] ?? GitBranch;
              const isActive = tab.id === activeTabId;
              const done = tab.levels.filter((l) => l.completed).length;
              const total = tab.levels.length;
              const prog = total > 0 ? (done / total) * 100 : 0;
              const allDone = done === total && total > 0;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id as CampaignTabId)}
                  className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer overflow-hidden group ${
                    isActive
                      ? "bg-accent/10 border-accent/50"
                      : "bg-bg-primary border-accent/10 hover:bg-accent/5 hover:border-accent/30"
                  }`}
                  style={isActive ? { boxShadow: "0 0 20px rgba(var(--accent-rgb),0.12)" } : {}}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.9)]" />
                  )}

                  <div className="flex items-center justify-between w-full mb-2.5 relative z-10">
                    <span className={`flex items-center gap-2 text-[12px] font-black tracking-[0.18em] uppercase ${isActive ? "text-accent" : "text-accent/60"}`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {tab.label}
                    </span>
                    {allDone && <Check className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.9)]" />}
                  </div>

                  <p className="text-[9px] text-accent/35 tracking-[0.04em] leading-relaxed mb-3 relative z-10">
                    {tab.description}
                  </p>

                  <div className="w-full relative z-10">
                    <div className="flex justify-between text-[7px] font-black tracking-[0.25em] text-accent/40 uppercase mb-1">
                      <span>Progress</span>
                      <span>{done}/{total}</span>
                    </div>
                    <div className="h-[2px] bg-accent/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${prog}%`, boxShadow: "0 0 6px rgba(var(--accent-rgb),0.7)" }}
                      />
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Right content grid ── */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="w-4 h-4 text-accent/40" />
            <h2 className="text-[14px] font-black tracking-[0.3em] text-accent/70 uppercase">
              {activeTab.label} Sequence
            </h2>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {activeTab.levels.map((level) => {
              const dc = DIFFICULTY_CONFIG[level.difficulty] ?? DIFFICULTY_CONFIG.EASY;

              if (!level.unlocked) {
                return (
                  <div
                    key={level.id}
                    className="relative p-5 rounded-xl border border-accent/10 bg-bg-primary overflow-hidden min-h-[190px] flex flex-col justify-between opacity-50"
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="text-[9px] tracking-[0.35em] text-accent/30 font-black uppercase">
                        ORDER {String(level.order).padStart(2, "0")}
                      </span>
                      <Lock className="w-4 h-4 text-accent/25" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-[13px] font-black tracking-[0.15em] uppercase leading-tight mb-2 text-accent/30">
                        {level.title}
                      </h3>
                      <p className="text-[10px] text-accent/20 leading-relaxed line-clamp-3 tracking-[0.04em]">
                        {level.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-accent/8 pt-3">
                      <span className={`text-[8px] font-black tracking-[0.25em] border rounded px-1.5 py-0.5 opacity-40 ${dc.text} ${dc.border} ${dc.bg}`}>
                        {level.difficulty}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-accent/20">
                        <Zap className="w-3 h-3" /> +{level.pointsReward}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`group text-left relative p-5 rounded-xl border transition-all min-h-[190px] flex flex-col justify-between overflow-hidden cursor-pointer ${
                    level.completed
                      ? "bg-accent/[0.025] border-accent/15 hover:border-accent/35"
                      : "bg-bg-primary border-accent/25 hover:border-accent/55 hover:bg-accent/[0.03]"
                  }`}
                  style={!level.completed ? { boxShadow: "inset 0 0 30px rgba(var(--accent-rgb),0.015)" } : {}}
                >
                  <div className="flex justify-between items-start mb-2.5 relative z-10">
                    <span className="text-[9px] tracking-[0.35em] text-accent/50 font-black uppercase">
                      ORDER {String(level.order).padStart(2, "0")}
                    </span>
                    {level.completed && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" /> CLEAR
                      </span>
                    )}
                  </div>

                  <div className="relative z-10 flex-1">
                    <h3 className={`text-[13px] font-black tracking-[0.15em] uppercase leading-tight mb-2 ${level.completed ? "text-accent/45" : "text-accent"}`}>
                      {level.title}
                    </h3>
                    <p className="text-[10px] text-accent/35 leading-relaxed line-clamp-3 tracking-[0.04em]">
                      {level.description}
                    </p>
                  </div>

                  <div className="relative z-10 mt-4 flex items-center justify-between border-t border-accent/8 pt-3">
                    <span className={`text-[8px] font-black tracking-[0.25em] border rounded px-1.5 py-0.5 ${dc.text} ${dc.border} ${dc.bg}`}>
                      {level.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-accent/45">
                      <Zap className="w-3 h-3 text-yellow-400/70" />
                      +{level.pointsReward}
                    </span>
                  </div>

                  {!level.completed && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/0 via-accent/[0.04] to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── ROOT COMPONENT ──────────────────────────────────────────────────────── */
export function CampaignLayout({ tabs, loading, isGuest, isMobile }: CampaignLayoutProps) {
  const [activeTabId, setActiveTabId] = useState<CampaignTabId>("conditionals");
  const [selectedLevel, setSelectedLevel] = useState<ApiLevelInfo | null>(null);

  if (loading) return <LoadingState />;
  if (isGuest || tabs.length === 0) return <GuestState />;

  return (
    <>
      {isMobile ? (
        <MobileLayout
          tabs={tabs}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          setSelectedLevel={setSelectedLevel}
        />
      ) : (
        <DesktopLayout
          tabs={tabs}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          setSelectedLevel={setSelectedLevel}
        />
      )}

      <LevelDetailModal level={selectedLevel} onClose={() => setSelectedLevel(null)} />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%)  skewX(-12deg); }
        }
        @keyframes scanLine {
          0%   { top: -2px; }
          100% { top: 100%; }
        }
      `}</style>
    </>
  );
}
