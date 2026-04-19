"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { ProfileData } from "./types";
import { StatCard } from "./components/StatCard";
import { MatchHistoryTable } from "./components/MatchHistoryTable";
import { fmtDate } from "./utils";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/users/profile");
        setProfile(res.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push("/login");
        } else {
          setError(err.message ?? "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
        {/* Grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="max-w-[900px] mx-auto px-6 pt-12 pb-[80px] relative z-10 animate-[fadeIn_0.35s_ease]">
          {/* ── Header ── */}
          <div className="border-b border-accent/10 pb-6 mb-9">
            <p className="text-[9px] tracking-[0.28em] text-accent/35 mb-2 uppercase">
              // OPERATOR_FILE
            </p>
            <h1 className="m-0 text-[clamp(24px,4vw,36px)] font-black tracking-[0.18em] text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.7)] leading-tight">
              {loading ? "LOADING..." : error ? "ERROR" : profile?.username ?? "UNKNOWN"}
            </h1>
            {profile && (
              <p className="mt-2 text-[10px] text-accent/35 tracking-[0.15em] flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_var(--color-emerald-500)] inline-block" />
                RANK #{profile.rank} &nbsp;·&nbsp; MEMBER SINCE {fmtDate(profile.memberSince)}
              </p>
            )}
          </div>

          {/* ── Error state ── */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-[20px_24px] text-[#fca5a5] text-[11px] tracking-[0.12em]">
              [ERR] UPLINK FAILURE: {error}
            </div>
          )}

          {/* ── Stats grid ── */}
          {!error && (
            <>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5 mb-10">
                {loading ? (
                  [0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-[100px] rounded-[10px] animate-[shimmer_1.5s_infinite]"
                      style={{
                        background: "linear-gradient(90deg, rgba(var(--accent-rgb),0.03) 0%, rgba(var(--accent-rgb),0.08) 50%, rgba(var(--accent-rgb),0.03) 100%)",
                        backgroundSize: "200% 100%",
                      }}
                    />
                  ))
                ) : (
                  <>
                    <StatCard label="Total Matches" value={profile?.totalMatches ?? 0} accent="var(--accent)" />
                    <StatCard label="Wins" value={profile?.wins ?? 0} accent="var(--color-emerald-500)" />
                    <StatCard label="Losses" value={profile?.losses ?? 0} accent="var(--color-red-500)" />
                    <StatCard label="Win Rate" value={`${profile?.winRate ?? 0}%`} accent="#a855f7" />
                  </>
                )}
              </div>

              {/* ── Match History section ── */}
              <div>
                <div className="flex justify-between items-center mb-3.5">
                  <h2 className="text-[10px] tracking-[0.22em] font-bold text-accent/50 m-0 uppercase">
                    Match History
                  </h2>
                  {profile && (
                    <span className="text-[10px] text-accent/25 tracking-[0.15em]">
                      TOTAL: {profile.totalMatches}
                    </span>
                  )}
                </div>

                <MatchHistoryTable loading={loading} history={profile?.matchHistory ?? []} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
