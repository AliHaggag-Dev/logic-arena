"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { apiClient } from "../lib/api-client";
import { setAuthSession, clearAuthSession, getAuthSession, getAuthUsername } from "../lib/client-security";

export interface ProfileResponse {
  id: string;
  username: string;
  avatarUrl: string | null;
  role?: string;
  email?: string;
  hasGoogle?: boolean;
  hasGithub?: boolean;
  rank?: number;
  memberSince?: string;
  totalMatches?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  combatStats?: Record<string, number>;
  matchHistory?: unknown[];
  arenaPreferences?: {
    defaultRobot: string;
    soundFx: boolean;
    music: boolean;
    graphicsQuality: string;
  };
  notificationSettings?: {
    challengeReqs: boolean;
    tournamentAlerts: boolean;
    matchResults: boolean;
    friendRequests?: boolean;
  };
  selectedRobotId?: string;
  selectedColor?: string;
}

interface AuthContextValue {
  isGuest: boolean;
  userId: string | null;
  username: string | null;
  avatarUrl: string | null;
  profile: ProfileResponse | null;
  loading: boolean;
  refresh: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const profileRef = React.useRef<ProfileResponse | null>(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const session = getAuthSession();
    if (!session.isAuthenticated && !getAuthUsername()) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!profile) {
      setLoading(true);
    }

    let cancelled = false;
    apiClient.get("/users/profile").then((res) => {
      if (cancelled) return;
      setProfile(res.data);
      setAuthSession({
        isAuthenticated: true,
        userId: res.data.id ?? null,
        username: res.data.username ?? null,
        avatarUrl: res.data.avatarUrl ?? null,
      });
    }).catch((error: unknown) => {
      if (!cancelled) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          clearAuthSession();
        }
        setProfile(null);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    const onExpired = () => {
      setProfile(null);
      setLoading(false);
    };
    const onChanged = () => {
      const session = getAuthSession();
      if (!session.userId) {
        setProfile(null);
        setLoading(false);
        return;
      }
      if (profileRef.current?.id === session.userId) {
        return;
      }
      if (session.username) {
        setProfile({
          id: session.userId,
          username: session.username,
          avatarUrl: session.avatarUrl ?? null,
        });
      }
      setLoading(true);
      refresh();
    };

    window.addEventListener("auth:expired", onExpired);
    window.addEventListener("auth:changed", onChanged);
    return () => {
      window.removeEventListener("auth:expired", onExpired);
      window.removeEventListener("auth:changed", onChanged);
    };
  }, [refresh]);

  const value: AuthContextValue = {
    isGuest: loading ? false : !profile,
    userId: profile?.id ?? null,
    username: profile?.username ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    profile,
    loading,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
