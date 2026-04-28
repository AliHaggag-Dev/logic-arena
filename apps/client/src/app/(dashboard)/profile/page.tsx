"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { ProfileData, CombatStats } from "./types";
import { StatCard } from "./components/StatCard";
import { MatchHistoryTable } from "./components/MatchHistoryTable";
import { RadarChart } from "./components/RadarChart";
import { StatRing } from "./components/StatRing";
import { OperatorBadge } from "./components/OperatorBadge";
import { fmtDate } from "./utils";
import { useMediaQuery } from "../../../hooks/useMediaQuery";

const EMPTY_STATS: CombatStats = {
  efficiency: 0, aggression: 0, defense: 0, precision: 0, speed: 0,
};

const ANONYMOUS_PROFILE: ProfileData = {
  username: "GUEST",
  rank: 9999,
  memberSince: new Date().toISOString(),
  totalMatches: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  combatStats: EMPTY_STATS,
  matchHistory: []
};

// ─── Skeleton shimmer block ──────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-[shimmer_1.5s_infinite] ${className ?? ""}`}
      style={{
        background:
          "linear-gradient(90deg, rgba(var(--accent-rgb),0.03) 0%, rgba(var(--accent-rgb),0.09) 50%, rgba(var(--accent-rgb),0.03) 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

// ─── HEX avatar component ────────────────────────────────────────────────────
function HexAvatar({
  username,
  color,
  size,
}: {
  username: string;
  color: string;
  size: number;
}) {
  const initials = username.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        flexShrink: 0,
      }}
      aria-label={`Avatar for ${username}`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <filter id="hex-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Outer hex */}
        <polygon
          points="50,4 95,27.5 95,72.5 50,96 5,72.5 5,27.5"
          fill={`${color}18`}
          stroke={color}
          strokeWidth="2"
          filter="url(#hex-glow)"
        />
        {/* Inner hex */}
        <polygon
          points="50,16 84,34.5 84,65.5 50,84 16,65.5 16,34.5"
          fill={`${color}10`}
          stroke={`${color}40`}
          strokeWidth="1"
        />
        {/* Initials */}
        <text
          x="50" y="58"
          textAnchor="middle"
          fontFamily="monospace"
          fontWeight="900"
          fontSize="28"
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        >
          {initials}
        </text>
      </svg>
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="h-[1px] w-4 shrink-0"
        style={{ background: "var(--accent)", opacity: 0.6 }}
      />
      <h2
        className="text-[10px] font-black tracking-[0.3em] uppercase m-0 shrink-0"
        style={{ color: "var(--accent)", opacity: 0.7 }}
      >
        {label}
      </h2>
      {sub && (
        <span className="text-[8px] text-accent/30 tracking-[0.15em] font-mono shrink-0">
          {sub}
        </span>
      )}
      <div
        className="h-[1px] flex-1"
        style={{
          background:
            "linear-gradient(90deg, rgba(var(--accent-rgb),0.3), transparent)",
        }}
      />
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router  = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get("/users/profile");
        setProfile(res.data);
      } catch (err: unknown) {
        const e = err as { response?: { status?: number }; message?: string };
        if (e.response?.status === 401) {
          setIsGuest(true);
          setProfile(ANONYMOUS_PROFILE);
        } else {
          setError(e.message ?? "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [router]);

  const stats   = profile?.combatStats ?? EMPTY_STATS;
  const username = loading ? "LOADING…" : error ? "ERROR" : profile?.username ?? "UNKNOWN";
  const accentColor = profile?.combatStats
    ? "var(--accent)"
    : "var(--accent)";

  // Dominant stat label
  const dominantKey = profile
    ? (Object.entries(stats).sort((a, b) => b[1] - a[1])[0][0] as keyof CombatStats)
    : null;
  const STAT_LABELS: Record<keyof CombatStats, string> = {
    efficiency: "EFFICIENT", aggression: "AGGRESSIVE",
    defense: "DEFENSIVE", precision: "PRECISE", speed: "SWIFT",
  };

  const profileColor = profile?.combatStats
    ? (() => {
        const dom = dominantKey!;
        const map: Record<keyof CombatStats, string> = {
          efficiency: "#22d3ee",
          aggression: "#f97316",
          defense:    "#4ade80",
          precision:  "#a855f7",
          speed:      "#facc15",
        };
        return map[dom];
      })()
    : "var(--accent)";

  // ── Shared Hero section ────────────────────────────────────────────────────
  const HeroSection = (
    <div
      className={`relative flex ${isMobile ? "flex-col items-center text-center gap-5" : "flex-row items-center gap-7"} pb-7 mb-7`}
      style={{ borderBottom: "1px solid rgba(var(--accent-rgb),0.15)" }}
    >
      {/* Hex avatar */}
      {loading ? (
        <div
          className="rounded-full animate-[shimmer_1.5s_infinite] shrink-0"
          style={{
            width: isMobile ? 80 : 100,
            height: isMobile ? 80 : 100,
            background: "rgba(var(--accent-rgb),0.07)",
            backgroundSize: "200% 100%",
          }}
        />
      ) : (
        <HexAvatar
          username={profile?.username ?? "XX"}
          color={profileColor}
          size={isMobile ? 80 : 100}
        />
      )}

      <div className={`flex flex-col ${isMobile ? "items-center" : "items-start"} gap-2 flex-1 min-w-0`}>
        <h1
          className="m-0 font-black tracking-[0.18em] leading-none break-words"
          style={{
            fontSize: isMobile ? "clamp(24px,6vw,32px)" : "clamp(28px,4vw,42px)",
            color: profileColor,
            textShadow: `0 0 20px ${profileColor}80`,
          }}
        >
          {username}
        </h1>

        {profile && !error && (
          <div className={`flex ${isMobile ? "flex-col items-center" : "flex-row items-center"} gap-3 flex-wrap`}>
            <OperatorBadge rank={profile.rank} />

            {dominantKey && (
              <span
                className="text-[9px] font-bold tracking-[0.2em] font-mono px-2 py-1 rounded"
                style={{
                  color: profileColor,
                  background: `${profileColor}15`,
                  border: `1px solid ${profileColor}30`,
                }}
              >
                {STAT_LABELS[dominantKey]} PLAYER
              </span>
            )}
          </div>
        )}

        {profile && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-[10px] text-accent/50 tracking-[0.12em] font-mono">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: "#4ade80",
                  boxShadow: "0 0 6px #4ade80",
                }}
              />
              ONLINE
            </span>
            <span className="text-accent/20 text-[10px]">•</span>
            <span className="text-[10px] text-accent/40 tracking-[0.12em] font-mono">
              RANK #{profile.rank}
            </span>
            <span className="text-accent/20 text-[10px]">•</span>
            <span className="text-[10px] text-accent/40 tracking-[0.12em] font-mono">
              SINCE {fmtDate(profile.memberSince).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Corner scanline decoration (desktop) */}
      {!isMobile && (
        <div
          className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-20"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(var(--accent-rgb),0.3) 0px, rgba(var(--accent-rgb),0.3) 1px, transparent 1px, transparent 8px)",
          }}
        />
      )}
    </div>
  );

  // ── Stat cards row ─────────────────────────────────────────────────────────
  const StatCardsSection = (
    <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-3 mb-8`}>
      {loading ? (
        [0, 1, 2, 3].map((i) => (
          <Shimmer key={i} className={isMobile ? "h-[90px]" : "h-[100px]"} />
        ))
      ) : (
        <>
          <StatCard label="Total Matches" value={profile?.totalMatches ?? 0} accent="var(--accent)" />
          <StatCard label="Wins"          value={profile?.wins ?? 0}         accent="#4ade80" />
          <StatCard label="Losses"        value={profile?.losses ?? 0}       accent="#f87171" />
          <StatCard label="Win Rate"      value={`${profile?.winRate ?? 0}%`} accent="#a855f7" />
        </>
      )}
    </div>
  );

  // ── Analytics section (Radar + Rings) ─────────────────────────────────────
  const AnalyticsSection = (
    <div className="mb-8">
      <SectionHeader label="PLAYER STATS" sub="YOUR STATS" />

      {loading ? (
        <Shimmer className={isMobile ? "h-[340px]" : "h-[300px]"} />
      ) : (
        <div
          className={`rounded-xl overflow-hidden`}
          style={{
            background: "rgba(var(--accent-rgb),0.025)",
            border: "1px solid rgba(var(--accent-rgb),0.12)",
            boxShadow: "0 0 40px rgba(var(--accent-rgb),0.05)",
          }}
        >
          {/* Top strip — glows */}
          <div
            className="h-[2px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${profileColor}, transparent)`,
              opacity: 0.6,
            }}
          />

          <div className={`flex ${isMobile ? "flex-col items-center gap-8" : "flex-row items-center justify-around gap-4"} p-6`}>
            {/* Radar chart */}
            <div className="flex flex-col items-center gap-2">
              <RadarChart stats={stats} size={isMobile ? 260 : 280} />
              <p className="text-[8px] text-accent/30 tracking-[0.18em] font-mono m-0">
                PERFORMANCE METRICS
              </p>
            </div>

            {/* Stat rings */}
            <div className={`grid ${isMobile ? "grid-cols-3" : "grid-cols-2"} gap-6`}>
              <StatRing
                value={profile?.winRate ?? 0}
                label="WIN RATE"
                sublabel="%"
                color="#a855f7"
                size={isMobile ? 78 : 88}
              />
              <StatRing
                value={Math.min(100, (profile?.wins ?? 0) * 10)}
                label="WIN COUNT"
                sublabel={`${profile?.wins ?? 0} wins`}
                color="#4ade80"
                size={isMobile ? 78 : 88}
              />
              <StatRing
                value={Math.min(100, profile?.rank ?? 0)}
                label="RANK PTS"
                sublabel={`#${profile?.rank ?? 0}`}
                color="var(--accent)"
                size={isMobile ? 78 : 88}
              />
              <StatRing
                value={stats.efficiency}
                label="EFFICIENCY"
                sublabel="dmg/energy"
                color="#22d3ee"
                size={isMobile ? 78 : 88}
              />
              <StatRing
                value={stats.aggression}
                label="AGGRESSION"
                sublabel="dmg output"
                color="#f97316"
                size={isMobile ? 78 : 88}
              />
              <StatRing
                value={stats.precision}
                label="PRECISION"
                sublabel="targeting"
                color="#a855f7"
                size={isMobile ? 78 : 88}
              />
            </div>
          </div>

          {/* Bottom strip */}
          <div
            className="h-[1px] w-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(var(--accent-rgb),0.25), transparent)",
            }}
          />
        </div>
      )}
    </div>
  );

  // ── Match history section ──────────────────────────────────────────────────
  const HistorySection = (
    <div>
      <SectionHeader
        label="MATCHES HISTORY"
        sub={profile ? `TOTAL: ${profile.totalMatches}` : undefined}
      />
      <MatchHistoryTable
        loading={loading}
        history={profile?.matchHistory ?? []}
        isMobile={isMobile}
        isGuest={isGuest}
      />
    </div>
  );

  // ── Error banner ───────────────────────────────────────────────────────────
  const ErrorBanner = error ? (
    <div
      className="rounded-lg p-4 text-[11px] tracking-[0.12em] mb-8 font-mono"
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        color: "#fca5a5",
      }}
    >
      [ERR] Failed to load profile: {error}
    </div>
  ) : null;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      <div
        className={`min-h-screen font-mono relative overflow-hidden`}
        style={{
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          paddingBottom: isMobile ? "calc(80px + env(safe-area-inset-bottom))" : undefined,
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

        {/* Corner glow accent */}
        <div
          className="fixed top-0 right-0 pointer-events-none z-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${profileColor}08 0%, transparent 70%)`,
          }}
        />
        <div
          className="fixed bottom-0 left-0 pointer-events-none z-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(var(--accent-rgb),0.04) 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div
          className="relative z-10 mx-auto animate-[fadeIn_0.4s_ease]"
          style={{
            maxWidth: isMobile ? "100%" : 960,
            padding: isMobile ? "24px 16px 0" : "48px 32px 120px",
          }}
        >
          {HeroSection}
          {ErrorBanner}
          {!error && (
            <>
              {StatCardsSection}
              {AnalyticsSection}
              {HistorySection}
            </>
          )}

        </div>
      </div>
    </>
  );
}
