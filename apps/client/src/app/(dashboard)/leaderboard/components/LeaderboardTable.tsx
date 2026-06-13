"use client";

import React, { memo } from "react";
import type { LeaderboardUser } from "../types";
import { DesktopTable } from "./DesktopTable";
import { MobileList } from "./MobileList";
import type { LeaderboardViewProps } from "./types";

interface LeaderboardTableProps extends LeaderboardViewProps {
  isMobile: boolean;
}

export const LeaderboardTable = memo(function LeaderboardTable({
  users,
  isLoading,
  currentUserId,
  onChallenge,
  onSpectate,
  isGuest,
  isMobile,
  globalRankOffset,
}: LeaderboardTableProps) {
  return isMobile ? (
    <MobileList
      users={users}
      isLoading={isLoading}
      currentUserId={currentUserId}
      onChallenge={onChallenge}
      onSpectate={onSpectate}
      isGuest={isGuest}
      globalRankOffset={globalRankOffset}
    />
  ) : (
    <DesktopTable
      users={users}
      isLoading={isLoading}
      currentUserId={currentUserId}
      onChallenge={onChallenge}
      onSpectate={onSpectate}
      isGuest={isGuest}
      globalRankOffset={globalRankOffset}
    />
  );
});

export type { LeaderboardUser };
