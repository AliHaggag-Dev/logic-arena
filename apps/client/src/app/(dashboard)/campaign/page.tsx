"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { LevelInfo } from "./types";
import { CampaignDesktopLayout } from "./components/CampaignDesktopLayout";
import { CampaignMobileLayout } from "./components/CampaignMobileLayout";

export default function CampaignPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    apiClient
      .get("/campaign/levels")
      .then((r) => setLevels(r.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          setIsGuest(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const currentLevel = React.useMemo(() => levels.find((l) => l.unlocked && !l.completed), [levels]);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
      <div className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : "pb-12"}`}>
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {isMobile ? (
          <CampaignMobileLayout levels={levels} loading={loading} currentLevel={currentLevel} router={router} isGuest={isGuest} />
        ) : (
          <CampaignDesktopLayout levels={levels} loading={loading} currentLevel={currentLevel} router={router} isGuest={isGuest} />
        )}
    </div>
  );
}
