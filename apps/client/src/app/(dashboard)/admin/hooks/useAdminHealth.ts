"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const REFRESH_INTERVAL_MS = 30_000;
const DEFAULT_ERROR_MESSAGE = "Unable to load server health";

export interface HealthStats {
  uptimeSeconds: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  nodeVersion: string;
  redisHealthy: boolean;
  dbHealthy: boolean;
}

interface UseAdminHealthResult {
  health: HealthStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return DEFAULT_ERROR_MESSAGE;
}

export function useAdminHealth(): UseAdminHealthResult {
  const [health, setHealth] = useState<HealthStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading((current) => current || health === null);
    setError(null);

    try {
      const response = await apiClient.get<HealthStats>("/admin/health");
      setHealth(response.data);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [health]);

  useEffect((): (() => void) => {
    void refetch();
    const intervalId = window.setInterval(() => {
      void refetch();
    }, REFRESH_INTERVAL_MS);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, [refetch]);

  return { health, isLoading, error, lastUpdated, refetch };
}
