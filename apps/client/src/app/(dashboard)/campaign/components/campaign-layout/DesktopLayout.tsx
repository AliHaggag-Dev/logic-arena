"use client";

import { memo, useMemo } from "react";
import { GitBranch, Star, Swords } from "lucide-react";

import { TAB_ICONS } from "./tabMeta";
import type { CampaignViewProps } from "./types";
import { LevelCard } from "./LevelCard";

// ─── Constants ───────────────────────────────────────────────────────────────
const TOTAL_LEVELS   = 60;
const TOTAL_STARS    = 180;
const LEVELS_PER_ROW = 5;

export const DesktopLayout = memo(function DesktopLayout({
  tabs,
  activeTabId,
  setActiveTabId,
  setSelectedLevel,
}: CampaignViewProps) {
  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs],
  );

  // ── Global progress stats ──────────────────────────────────────────────────
  const allLevels = useMemo(() => tabs.flatMap((t) => t.levels), [tabs]);
  const completedCount = useMemo(
    () => allLevels.filter((l) => l.completed).length,
    [allLevels],
  );
  const totalStars = useMemo(
    () => allLevels.reduce((acc, l) => acc + (l.bestStars ?? 0), 0),
    [allLevels],
  );
  const missionProgress = TOTAL_LEVELS > 0 ? (completedCount / TOTAL_LEVELS) * 100 : 0;

  return (
    <div className="desktop-layout">
      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <header className="desktop-layout__hero">
        <div className="desktop-layout__hero-title-row">
          <Swords className="desktop-layout__hero-icon" aria-hidden="true" />
          <h1 className="desktop-layout__hero-title">⚔ CAMPAIGN MODE</h1>
        </div>

        <div className="desktop-layout__hero-stats">
          {/* Missions progress */}
          <div className="desktop-layout__stat-block">
            <div className="desktop-layout__stat-label-row">
              <span className="desktop-layout__stat-label">MISSIONS COMPLETE</span>
              <span className="desktop-layout__stat-value">
                {completedCount} / {TOTAL_LEVELS}
              </span>
            </div>
            <div className="desktop-layout__progress-track">
              <div
                className="desktop-layout__progress-fill"
                style={{ width: `${missionProgress}%` }}
                role="progressbar"
                aria-valuenow={completedCount}
                aria-valuemin={0}
                aria-valuemax={TOTAL_LEVELS}
                aria-label={`${completedCount} of ${TOTAL_LEVELS} missions complete`}
              />
            </div>
          </div>

          {/* Star counter */}
          <div className="desktop-layout__star-counter" aria-label={`${totalStars} of ${TOTAL_STARS} stars earned`}>
            <Star className="desktop-layout__star-icon" aria-hidden="true" />
            <span className="desktop-layout__star-text">
              {totalStars} / {TOTAL_STARS} STARS
            </span>
          </div>
        </div>
      </header>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <nav className="desktop-layout__tab-bar" aria-label="Campaign categories">
        {tabs.map((tab) => {
          const Icon   = TAB_ICONS[tab.id] ?? GitBranch;
          const isActive = tab.id === activeTabId;
          const done   = tab.levels.filter((l) => l.completed).length;
          const total  = tab.levels.length;

          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              aria-label={`${tab.label} — ${done} of ${total} complete`}
              onClick={() => setActiveTabId(tab.id)}
              className={`desktop-layout__tab-btn ${isActive ? "desktop-layout__tab-btn--active" : ""}`}
            >
              <Icon className="desktop-layout__tab-icon" aria-hidden="true" />
              <span className="desktop-layout__tab-label">{tab.label}</span>
              <span className={`desktop-layout__tab-progress ${isActive ? "desktop-layout__tab-progress--active" : ""}`}>
                {done}/{total} ✓
              </span>
              {isActive && <div className="desktop-layout__tab-underline" />}
            </button>
          );
        })}
      </nav>

      {/* ── Level Grid (2 rows × 5 columns) ─────────────────────────────── */}
      <main>
        <div className="desktop-layout__grid" aria-label={`${activeTab.label} levels`}>
          {activeTab.levels.map((level) => (
            <LevelCard
              key={level.id}
              level={level}
              isMobile={false}
              onInfoClick={setSelectedLevel}
            />
          ))}

          {/* Pad to fill grid if fewer than LEVELS_PER_ROW × 2 */}
          {activeTab.levels.length < LEVELS_PER_ROW * 2 &&
            Array.from({ length: LEVELS_PER_ROW * 2 - activeTab.levels.length }).map((_, i) => (
              <div key={`pad-${i}`} className="desktop-layout__grid-placeholder" />
            ))}
        </div>
      </main>
    </div>
  );
});
