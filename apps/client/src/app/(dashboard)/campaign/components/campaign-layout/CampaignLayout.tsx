"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type { CampaignTabId } from "../../constants/campaign.constants";
import type { ApiLevelInfo } from "../../types/campaign.types";
import { CampaignLayoutStyles } from "./CampaignLayoutStyles";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import { GuestState, LoadingState } from "./states";
import type { CampaignLayoutProps } from "./types";

const LevelDetailModal = dynamic(
  () => import("../LevelDetailModal").then((module) => module.LevelDetailModal),
  { ssr: false },
);

export function CampaignLayout({ tabs, loading, isGuest, isMobile }: CampaignLayoutProps) {
  const [activeTabId, setActiveTabId] = useState<CampaignTabId>("conditionals");
  const [selectedLevel, setSelectedLevel] = useState<ApiLevelInfo | null>(null);

  if (loading) return <LoadingState />;
  if (tabs.length === 0) return <GuestState />;

  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return (
    <>
      <Layout
        tabs={tabs}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
        setSelectedLevel={setSelectedLevel}
      />

      {selectedLevel && (
        <LevelDetailModal level={selectedLevel} onClose={() => setSelectedLevel(null)} />
      )}
      <CampaignLayoutStyles />
    </>
  );
}
