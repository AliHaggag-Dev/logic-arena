"use client";

import React from "react";
import { ProfileData } from "../../types";
import { SectionHeader } from "../ui/SectionHeader";
import { MatchHistoryTable } from "../match-history/MatchHistoryTable";

interface Props {
  profile:  ProfileData | null;
  loading:  boolean;
  isMobile: boolean;
  isGuest:  boolean;
}

export function MatchHistorySection({ profile, loading, isMobile, isGuest }: Props) {
  return (
    <div>
      <SectionHeader
        label="MATCH HISTORY"
        sub={profile ? `TOTAL: ${profile.totalMatches}` : undefined}
      />
      <MatchHistoryTable
        userId={profile?.id}
        profileLoading={loading}
        isMobile={isMobile}
        isGuest={isGuest}
      />
    </div>
  );
}
