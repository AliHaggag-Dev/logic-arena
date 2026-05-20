"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { requestAdminWithRetry } from "./adminRequest";

export interface LevelCompletionRate {
  levelId: string;
  completionCount: number;
  completionRate: number;
}

export interface FunnelStep {
  completedAtLeast: number;
  userCount: number;
}

export interface CampaignStats {
  levelCompletionRates: LevelCompletionRate[];
  mostFailedLevels: LevelCompletionRate[];
  campaignEngagementRate: number;
  progressionFunnel: FunnelStep[];
}

interface UseAdminCampaignResult {
  stats: CampaignStats | null;
  isLoading: boolean;
  error: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to load campaign stats";
}

export function useAdminCampaign(): UseAdminCampaignResult {
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestAdminWithRetry(() => apiClient.get<CampaignStats>("/admin/stats/campaign"));
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
