"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export interface DailyCount {
  date: string;
  count: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface ActiveUserMatchCount {
  userId: string;
  username: string;
  matchCount: number;
}

export interface MatchStats {
  totalMatches: number;
  avgDuration: number;
  matchesPerDay: DailyCount[];
  matchTypeBreakdown: LabelCount[];
  statusBreakdown: LabelCount[];
  mostActiveUsers: ActiveUserMatchCount[];
}

interface UseAdminMatchesResult {
  stats: MatchStats | null;
  isLoading: boolean;
  error: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to load match stats";
}

export function useAdminMatches(): UseAdminMatchesResult {
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<MatchStats>("/admin/stats/matches");
      setStats(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect((): void => {
    void refetch();
  }, [refetch]);

  return { stats, isLoading, error };
}
