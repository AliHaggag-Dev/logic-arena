"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { requestAdminWithRetry } from "./adminRequest";

export interface LabelCount {
  label: string;
  count: number;
}

export interface AIStats {
  totalInsights: number;
  readCount: number;
  unreadCount: number;
  categoryBreakdown: LabelCount[];
  avgInsightsPerUser: number;
}

interface UseAdminAIResult {
  stats: AIStats | null;
  isLoading: boolean;
  error: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to load AI insight stats";
}

export function useAdminAI(): UseAdminAIResult {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestAdminWithRetry(() => apiClient.get<AIStats>("/admin/stats/ai"));
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
