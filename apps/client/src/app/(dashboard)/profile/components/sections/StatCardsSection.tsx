"use client";

import React from "react";
import { ProfileData } from "../../types";
import { Shimmer } from "../ui/Shimmer";
import { StatCard } from "../ui/StatCard";

interface Props {
  loading:  boolean;
  profile:  ProfileData | null;
  isMobile: boolean;
}

export function StatCardsSection({ loading, profile, isMobile }: Props) {
  return (
    <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-3 mb-8`}>
      {loading
        ? [0, 1, 2, 3].map((i) => (
            <Shimmer key={i} className={isMobile ? "h-[90px]" : "h-[100px]"} />
          ))
        : (
          <>
            <StatCard label="Total Matches" value={profile?.totalMatches ?? 0} accent="var(--accent)" />
            <StatCard label="Wins"          value={profile?.wins          ?? 0} accent="#4ade80" />
            <StatCard label="Losses"        value={profile?.losses        ?? 0} accent="#f87171" />
            <StatCard label="Win Rate"      value={`${profile?.winRate    ?? 0}%`} accent="#a855f7" />
          </>
        )
      }
    </div>
  );
}
