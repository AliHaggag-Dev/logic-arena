"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { requestAdminWithRetry } from "./adminRequest";

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

interface UseAdminHealthOptions {
  initialDelayMs?: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return DEFAULT_ERROR_MESSAGE;
}

export function useAdminHealth(options: UseAdminHealthOptions = {}): UseAdminHealthResult {
  const [health, setHealth] = useState<HealthStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasLoadedRef = useRef<boolean>(false);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(!hasLoadedRef.current);
    setError(null);

    try {
      const response = await requestAdminWithRetry(() => apiClient.get<HealthStats>("/admin/health"));
      setHealth(response.data);
      setLastUpdated(new Date());
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

  return { health, isLoading, error, lastUpdated, refetch };
}
