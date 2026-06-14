"use client";

import { memo, useCallback, useMemo } from "react";
import { GitBranch, Star, Swords } from "lucide-react";

import { TAB_ICONS, TAB_SHORT } from "./tabMeta";
import type { CampaignViewProps } from "./types";
import { LevelCard } from "./LevelCard";
import type { CampaignTabId } from "../../constants/campaign.constants";

// ─── Constants ───────────────────────────────────────────────────────────────
const TOTAL_LEVELS = 60;
const TOTAL_STARS  = 180;

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
  const handleTabClick = useCallback((tabId: CampaignTabId): void => {
    setActiveTabId(tabId);
  }, [setActiveTabId]);

  // ── Global stats ───────────────────────────────────────────────────────────
  const allLevels      = useMemo(() => tabs.flatMap((t) => t.levels), [tabs]);
  const completedCount = useMemo(() => allLevels.filter((l) => l.completed).length, [allLevels]);
  const totalStars     = useMemo(() => allLevels.reduce((acc, l) => acc + (l.bestStars ?? 0), 0), [allLevels]);

  // ── Tab stats ──────────────────────────────────────────────────────────────
  const tabDone  = useMemo(() => activeTab.levels.filter((l) => l.completed).length, [activeTab.levels]);
  const tabTotal = activeTab.levels.length;
  const tabProg  = tabTotal > 0 ? (tabDone / tabTotal) * 100 : 0;

  return (
    <div className="mobile-layout">
      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <div className="mobile-layout__sticky-header">
        {/* Compact summary row */}
        <div className="mobile-layout__summary-row">
          <h1 className="mobile-layout__title flex items-center gap-2">
            <Swords size={20} />
            CAMPAIGN
          </h1>
          <span
            className="mobile-layout__summary-stats flex items-center gap-1"
            aria-label={`${completedCount} of ${TOTAL_LEVELS} missions, ${totalStars} of ${TOTAL_STARS} stars`}
          >
            {completedCount}/{TOTAL_LEVELS} · <Star size={12} className="ml-1 text-accent" fill="currentColor" /> {totalStars}
          </span>
        </div>

        {/* Horizontal scrollable tab selector */}
        <nav className="mobile-layout__tab-strip" aria-label="Campaign categories">
          {tabs.map((tab) => {
            const Icon     = TAB_ICONS[tab.id] ?? GitBranch;
            const isActive = tab.id === activeTabId;
            const done     = tab.levels.filter((l) => l.completed).length;
            const total    = tab.levels.length;

            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                aria-label={`${tab.label} — ${done} of ${total} complete`}
                onClick={() => handleTabClick(tab.id)}
                className={`mobile-layout__tab-btn ${isActive ? "mobile-layout__tab-btn--active" : ""}`}
              >
                <Icon className="mobile-layout__tab-icon" aria-hidden="true" />
                <span className="mobile-layout__tab-label">
                  {TAB_SHORT[tab.id] ?? tab.label}
                </span>
                <span className={`mobile-layout__tab-progress ${isActive ? "mobile-layout__tab-progress--active" : ""}`}>
                  {done}/{total}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Active tab progress bar */}
        <div className="mobile-layout__tab-progress-bar-wrap">
          <div className="mobile-layout__tab-progress-bar">
            <div
              className="mobile-layout__tab-progress-fill"
              style={{ width: "100%", transform: `scaleX(${tabProg / 100})` }}
              role="progressbar"
              aria-valuenow={tabDone}
              aria-valuemin={0}
              aria-valuemax={tabTotal}
              aria-label={`${tabDone} of ${tabTotal} levels complete in ${activeTab.label}`}
            />
          </div>
          <span className="mobile-layout__tab-progress-label">
            {activeTab.label} · {tabDone}/{tabTotal}
          </span>
        </div>
      </div>

      {/* ── Level list ──────────────────────────────────────────────────── */}
      <ol className="mobile-layout__level-list" aria-label={`${activeTab.label} levels`}>
        {activeTab.levels.map((level) => (
          <li key={level.id}>
            <LevelCard
              level={level}
              isMobile={true}
              onInfoClick={setSelectedLevel}
            />
          </li>
        ))}
      </ol>
    </div>
  );
});
