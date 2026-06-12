"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth }              from "../../../context/AuthContext";
import { ProfileData, CombatStats } from "./types";
import { EMPTY_STATS, STAT_COLORS } from "./constants";
import { useMediaQuery }        from "../../../hooks/useMediaQuery";

import { HeroSection }          from "./components/sections/HeroSection";
import { StatCardsSection }     from "./components/sections/StatCardsSection";
import { AchievementsList }     from "./components/sections/AchievementsList";
import { AnalyticsSection }     from "./components/sections/AnalyticsSection";
import { MatchHistorySection }  from "./components/sections/MatchHistorySection";
import { ProfileErrorState }    from "./components/sections/ProfileErrorState";

type ErrorKind = "NOT_FOUND" | "NETWORK" | "UNKNOWN" | null;

// ─── Fallback for guest / unauthenticated visitors ───────────────────────────
function makeAnonProfile(): ProfileData {
  return {
    id:           "",
    username:     "GUEST",
    avatarUrl:    null,
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

  const { profile: ctxProfile, loading: ctxLoading, isGuest: ctxIsGuest, refresh: ctxRefresh } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errKind, setErrKind] = useState<ErrorKind>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    ctxRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ctxLoading) return;

    if (ctxProfile) {
      setProfile(ctxProfile as unknown as ProfileData);
      setErrKind(null);
      setIsGuest(false);
    } else if (ctxIsGuest) {
      setIsGuest(true);
      setProfile(makeAnonProfile());
      setErrKind(null);
    } else {
      setErrKind("UNKNOWN");
    }
    setLoading(false);
  }, [ctxProfile, ctxLoading, ctxIsGuest]);

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

  const username = loading ? "LOADING…" : errKind ? "ERROR" : profile?.username ?? "UNKNOWN";

  return (
    <>
      <div
        className="min-h-dvh font-mono relative overflow-hidden"
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
        {!errKind && (
          <>
            <div
              className="fixed top-0 right-0 pointer-events-none z-0 w-[500px] h-[500px] rounded-full"
              style={{ background: `radial-gradient(circle, ${profileColor}08 0%, transparent 70%)` }}
            />
            <div
              className="fixed bottom-0 left-0 pointer-events-none z-0 w-[400px] h-[400px] rounded-full"
              style={{ background: `radial-gradient(circle, rgba(var(--accent-rgb),0.04) 0%, transparent 70%)` }}
            />
          </>
        )}

        {/* Content */}
        <div
          className="relative z-10 mx-auto animate-[fadeIn_0.4s_ease]"
          style={{
            maxWidth: isMobile ? "100%" : 960,
            padding:  isMobile ? "24px 16px 0" : "48px 32px 120px",
          }}
        >
          {errKind ? (
              <ProfileErrorState
                isMobile={isMobile}
                errorType={errKind}
                onRetry={ctxRefresh}
              />
          ) : (
            <>
              <HeroSection
                loading={loading}
                profile={profile}
                isMobile={isMobile}
                profileColor={profileColor}
                dominantKey={dominantKey}
                username={username}
              />
              <StatCardsSection loading={loading} profile={profile} isMobile={isMobile} />
              {profile && (
                <AchievementsList userId={profile.id} isGuest={isGuest} isMobile={isMobile} />
              )}
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
