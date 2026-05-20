"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { requestAdminWithRetry } from "./adminRequest";

export interface HistogramBucket {
  bucket: string;
  count: number;
}

export interface RevisedScript {
  id: string;
  title: string;
  username: string;
  version: number;
}

export interface ScriptStats {
  totalScripts: number;
  avgScriptsPerUser: number;
  mostRevisedScripts: RevisedScript[];
  scriptLengthDistribution: HistogramBucket[];
}

interface UseAdminScriptsResult {
  stats: ScriptStats | null;
  isLoading: boolean;
  error: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unable to load script stats";
}

export function useAdminScripts(): UseAdminScriptsResult {
  const [stats, setStats] = useState<ScriptStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestAdminWithRetry(() => apiClient.get<ScriptStats>("/admin/stats/scripts"));
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
