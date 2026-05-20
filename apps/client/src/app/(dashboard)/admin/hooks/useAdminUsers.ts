"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { requestAdminWithRetry } from "./adminRequest";

const DEFAULT_ERROR_MESSAGE = "Unable to load admin users";

export type AdminUserSortBy = "rank" | "points" | "createdAt";
export type AdminSortOrder = "asc" | "desc";

export interface DailyCount {
  date: string;
  count: number;
}

export interface UserStats {
  totalUsers: number;
  verifiedCount: number;
  providerBreakdown: {
    local: number;
    google: number;
    github: number;
  };
  registrationTimeline: DailyCount[];
}

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  provider: string | null;
  rank: number;
  points: number;
  createdAt: string;
}

interface PaginatedUsers {
  data: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UseAdminUsersParams {
  page: number;
  pageSize: number;
  search: string;
  sortBy: AdminUserSortBy;
  sortOrder: AdminSortOrder;
}

interface UseAdminUserStatsResult {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
}

interface UseAdminUserStatsOptions {
  initialDelayMs?: number;
}

interface UseAdminUsersResult {
  users: AdminUserListItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return DEFAULT_ERROR_MESSAGE;
}

export function useAdminUserStats(options: UseAdminUserStatsOptions = {}): UseAdminUserStatsResult {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect((): (() => void) => {
    let cancelled = false;

    async function loadStats(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const response = await requestAdminWithRetry(() => apiClient.get<UserStats>("/admin/stats/users"));
        if (!cancelled) setStats(response.data);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadStats();
    }, options.initialDelayMs ?? 0);

    return (): void => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [options.initialDelayMs]);

  return { stats, isLoading, error };
}

export function useAdminUsers(params: UseAdminUsersParams): UseAdminUsersResult {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestAdminWithRetry(() => apiClient.get<PaginatedUsers>("/admin/users", {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          search: params.search || undefined,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      }));
      setUsers(response.data.data);
      setTotal(response.data.total);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.pageSize, params.search, params.sortBy, params.sortOrder]);

  useEffect((): void => {
    void refetch();
  }, [refetch]);

  return { users, total, isLoading, error, refetch };
}
