"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const REFRESH_INTERVAL_MS = 60_000;

export interface OverviewStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalMatches: number;
  activeMatches: number;
  totalTournaments: number;
  totalScripts: number;
  totalPoints: number;
  onlineUsers: number;
}

interface UseAdminStatsResult {
  stats: OverviewStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to load admin stats";
}

export function useAdminStats(): UseAdminStatsResult {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading((current) => current || stats === null);
    setError(null);

    try {
      const response = await apiClient.get<OverviewStats>("/admin/stats/overview");
      setStats(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [stats]);

  useEffect((): (() => void) => {
    void refetch();
    const intervalId = window.setInterval(() => {
      void refetch();
    }, REFRESH_INTERVAL_MS);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, [refetch]);

  return { stats, isLoading, error, refetch };
}
