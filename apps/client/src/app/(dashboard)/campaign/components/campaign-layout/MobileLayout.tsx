import { memo, useMemo } from "react";
import { Cpu, GitBranch } from "lucide-react";

import { MobileLevelCard } from "./MobileLevelCard";
import { TAB_ICONS, TAB_SHORT } from "./tabMeta";
import type { CampaignViewProps } from "./types";

export const MobileLayout = memo(function MobileLayout({
  tabs,
  activeTabId,
  setActiveTabId,
  setSelectedLevel,
}: CampaignViewProps) {
  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs],
  );
  const completedCount = useMemo(
    () => activeTab.levels.filter((l) => l.completed).length,
    [activeTab.levels],
  );
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
                onClick={() => setActiveTabId(tab.id)}
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
            onSelect={setSelectedLevel}
          />
        ))}
      </div>
    </div>
  );
});
