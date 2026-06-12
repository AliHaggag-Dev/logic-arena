"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient }            from "../../../../lib/api-client";
import { ProfileData, CombatStats } from "../types";
import { EMPTY_STATS, STAT_COLORS } from "../constants";
import { useMediaQuery }        from "../../../../hooks/useMediaQuery";

import { HeroSection }          from "../components/sections/HeroSection";
import { StatCardsSection }     from "../components/sections/StatCardsSection";
import { AchievementsList }     from "../components/sections/AchievementsList";
import { AnalyticsSection }     from "../components/sections/AnalyticsSection";
import { MatchHistorySection }  from "../components/sections/MatchHistorySection";
import { ProfileErrorState }    from "../components/sections/ProfileErrorState";

type ErrorKind = "NOT_FOUND" | "NETWORK" | "UNKNOWN" | null;

// ─── Root page ────────────────────────────────────────────────────────────────
export default function PublicProfilePage() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const usernameParam = useMemo(() => {
    const raw = params?.username ?? "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params?.username]);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errKind, setErrKind] = useState<ErrorKind>(null);

  const load = async () => {
    setLoading(true);
    setErrKind(null);
    try {
      const res = await apiClient.get(`/users/${encodeURIComponent(usernameParam)}/public`);
      setProfile(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number }; message?: string };
      if (e.response?.status === 404) {
        setErrKind("NOT_FOUND");
      } else if (e.message?.includes("Network") || e.message?.includes("timeout")) {
        setErrKind("NETWORK");
      } else {
        setErrKind("UNKNOWN");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usernameParam) load();
  }, [usernameParam]);

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
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-max border rounded-full md:rounded px-5 py-2 min-h-[44px] md:min-h-0 md:px-3 md:py-1 bg-accent/[0.03] md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-accent/20 md:border-accent/15 text-accent/80 md:text-accent/70 hover:border-accent/50 hover:bg-accent/20 hover:text-accent hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] cursor-pointer text-[11px] md:text-[10px] tracking-[0.25em] font-mono flex items-center justify-center gap-2 transition-all duration-300 uppercase active:scale-95"
            >
              ← <span className="md:hidden">BACK</span><span className="hidden md:inline">GO BACK</span>
            </button>
          </div>
          {errKind ? (
            <ProfileErrorState
              isMobile={isMobile}
              username={usernameParam}
              errorType={errKind}
              onRetry={load}
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
                <AchievementsList userId={profile.id} isGuest={false} isMobile={isMobile} />
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
                isGuest={false}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
