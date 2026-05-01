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
  isGuest,
  isMobile,
}: LeaderboardTableProps) {
  return isMobile ? (
    <MobileList
      users={users}
      isLoading={isLoading}
      currentUserId={currentUserId}
      onChallenge={onChallenge}
      isGuest={isGuest}
    />
  ) : (
    <DesktopTable
      users={users}
      isLoading={isLoading}
      currentUserId={currentUserId}
      onChallenge={onChallenge}
      isGuest={isGuest}
    />
  );
});

export type { LeaderboardUser };
