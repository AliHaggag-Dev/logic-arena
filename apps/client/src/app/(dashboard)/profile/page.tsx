"use client";

import React, { useEffect, useState, useMemo } from "react";
import { apiClient }            from "../../../lib/api-client";
import { ProfileData, CombatStats } from "./types";
import { EMPTY_STATS, STAT_COLORS } from "./constants";
import { useMediaQuery }        from "../../../hooks/useMediaQuery";

import { HeroSection }          from "./components/sections/HeroSection";
import { StatCardsSection }     from "./components/sections/StatCardsSection";
import { AnalyticsSection }     from "./components/sections/AnalyticsSection";
import { MatchHistorySection }  from "./components/sections/MatchHistorySection";

// ─── Fallback for guest / unauthenticated visitors ───────────────────────────
function makeAnonProfile(): ProfileData {
  return {
    username:     "GUEST",
    rank:         0,
    memberSince:  new Date().toISOString(),
    totalMatches: 0,
    wins:         0,
    losses:       0,
    winRate:      0,
    combatStats:  EMPTY_STATS,
    matchHistory: [],
  };
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/users/profile");
        setProfile(res.data);
      } catch (err: unknown) {
        const e = err as { response?: { status?: number }; message?: string };
        if (e.response?.status === 401) {
          setIsGuest(true);
          setProfile(makeAnonProfile());
        } else {
          setError(e.message ?? "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = profile?.combatStats ?? EMPTY_STATS;

  const dominantKey = useMemo<keyof CombatStats | null>(() => {
    if (!profile) return null;
    const allZero = Object.values(stats).every((v) => v === 0);
    if (allZero) return null;
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    return sorted[0][0] as keyof CombatStats;
  }, [profile, stats]);

  const profileColor = useMemo<string>(() => {
    if (!dominantKey) return "var(--accent)";
    return STAT_COLORS[dominantKey];
  }, [dominantKey]);

  const username = loading ? "LOADING…" : error ? "ERROR" : profile?.username ?? "UNKNOWN";

  return (
    <>
      <div
        className="min-h-screen font-mono relative overflow-hidden"
        style={{
          background: "var(--bg-primary)",
          color:      "var(--text-primary)",
          paddingBottom: isMobile ? "calc(80px + env(safe-area-inset-bottom, 0px))" : undefined,
        }}
      >
        {/* Grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Corner glow accents */}
        <div
          className="fixed top-0 right-0 pointer-events-none z-0 w-[500px] h-[500px] rounded-full"
          style={{ background: `radial-gradient(circle, ${profileColor}08 0%, transparent 70%)` }}
        />
        <div
          className="fixed bottom-0 left-0 pointer-events-none z-0 w-[400px] h-[400px] rounded-full"
          style={{ background: `radial-gradient(circle, rgba(var(--accent-rgb),0.04) 0%, transparent 70%)` }}
        />

        {/* Content */}
        <div
          className="relative z-10 mx-auto animate-[fadeIn_0.4s_ease]"
          style={{
            maxWidth: isMobile ? "100%" : 960,
            padding:  isMobile ? "24px 16px 0" : "48px 32px 120px",
          }}
        >
          <HeroSection
            loading={loading}
            profile={profile}
            isMobile={isMobile}
            profileColor={profileColor}
            dominantKey={dominantKey}
            username={username}
          />

          {/* Error banner */}
          {error && (
            <div
              className="rounded-lg p-4 text-[11px] tracking-[0.12em] mb-8 font-mono"
              style={{
                background: "rgba(239,68,68,0.08)",
                border:     "1px solid rgba(239,68,68,0.25)",
                color:      "#fca5a5",
              }}
            >
              [ERR] Failed to load profile: {error}
            </div>
          )}

          {!error && (
            <>
              <StatCardsSection loading={loading} profile={profile} isMobile={isMobile} />
              <AnalyticsSection
                loading={loading}
                profile={profile}
                isMobile={isMobile}
                profileColor={profileColor}
                stats={stats}
              />
              <MatchHistorySection
                profile={profile}
                loading={loading}
                isMobile={isMobile}
                isGuest={isGuest}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
