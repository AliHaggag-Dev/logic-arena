"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { requestAdminWithRetry } from "./adminRequest";

export interface TournamentTopWinner {
  userId: string;
  username: string;
  winCount: number;
}

export interface TournamentStats {
  total: number;
  byStatus: {
    waiting: number;
    inProgress: number;
    completed: number;
  };
  mostWins: TournamentTopWinner[];
}

interface UseAdminTournamentsResult {
  stats: TournamentStats | null;
  isLoading: boolean;
  error: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to load tournament stats";
}

export function useAdminTournaments(): UseAdminTournamentsResult {
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestAdminWithRetry(() => apiClient.get<TournamentStats>("/admin/stats/tournaments"));
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
