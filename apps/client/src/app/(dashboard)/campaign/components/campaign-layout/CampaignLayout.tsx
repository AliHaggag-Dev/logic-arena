"use client";

import { useState } from "react";

import type { CampaignTabId } from "../../constants/campaign.constants";
import type { ApiLevelInfo } from "../../types/campaign.types";
import { LevelDetailModal } from "../LevelDetailModal";
import { CampaignLayoutStyles } from "./CampaignLayoutStyles";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import { GuestState, LoadingState } from "./states";
import type { CampaignLayoutProps } from "./types";

export function CampaignLayout({ tabs, loading, isGuest, isMobile }: CampaignLayoutProps) {
  const [activeTabId, setActiveTabId] = useState<CampaignTabId>("conditionals");
  const [selectedLevel, setSelectedLevel] = useState<ApiLevelInfo | null>(null);

  if (loading) return <LoadingState />;
  if (isGuest || tabs.length === 0) return <GuestState />;

  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <>
      <Layout
        tabs={tabs}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
        setSelectedLevel={setSelectedLevel}
      />

      <LevelDetailModal level={selectedLevel} onClose={() => setSelectedLevel(null)} />
      <CampaignLayoutStyles />
    </>
  );
}
