"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { requestAdminWithRetry } from "./adminRequest";

export interface HistogramBucket {
  bucket: string;
  count: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface MarketStats {
  totalPointsInCirculation: number;
  avgPointsPerUser: number;
  pointsDistribution: HistogramBucket[];
  mostUnlockedItems: LabelCount[];
  popularChassis: LabelCount[];
  popularPaints: LabelCount[];
  popularTracers: LabelCount[];
}

interface UseAdminMarketResult {
  stats: MarketStats | null;
  isLoading: boolean;
  error: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to load market stats";
}

export function useAdminMarket(): UseAdminMarketResult {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestAdminWithRetry(() => apiClient.get<MarketStats>("/admin/stats/market"));
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
