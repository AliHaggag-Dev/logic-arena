"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import type { ApiTabInfo } from "./types/campaign.types";
import { CampaignLayout } from "./components/CampaignLayout";
import { useAuthState } from "../../../hooks/useAuthState";

export default function CampaignPageClient() {
  const [tabs, setTabs] = useState<ApiTabInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { isGuest } = useAuthState();

  useEffect(() => {
    let cancelled = false;

    const fetchTabs = () => {
      setLoading(true);
      apiClient
        .get('/campaign/tabs')
        .then((r) => {
          if (!cancelled) setTabs(r.data);
        })
        .catch((err) => {
          if (cancelled) return;
          if (process.env.NODE_ENV === 'development') console.error(err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    fetchTabs();

    window.addEventListener("global-refresh", fetchTabs);

    return () => {
      cancelled = true;
      window.removeEventListener("global-refresh", fetchTabs);
    };
  }, []);

  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className={`min-h-dvh bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : "pb-12"}`}>
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <CampaignLayout tabs={tabs} loading={loading} isGuest={isGuest} isMobile={isMobile} />
    </div>
  );
}
