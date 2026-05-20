"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { requestAdminWithRetry } from "./adminRequest";

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

interface UseAdminStatsOptions {
  initialDelayMs?: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to load admin stats";
}

export function useAdminStats(options: UseAdminStatsOptions = {}): UseAdminStatsResult {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef<boolean>(false);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(!hasLoadedRef.current);
    setError(null);

    try {
      const response = await requestAdminWithRetry(() => apiClient.get<OverviewStats>("/admin/stats/overview"));
      setStats(response.data);
      hasLoadedRef.current = true;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect((): (() => void) => {
    const timeoutId = window.setTimeout(() => {
      void refetch();
    }, options.initialDelayMs ?? 0);
    const intervalId = window.setInterval(() => {
      void refetch();
    }, REFRESH_INTERVAL_MS);

    return (): void => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [options.initialDelayMs, refetch]);

  return { stats, isLoading, error, refetch };
}
