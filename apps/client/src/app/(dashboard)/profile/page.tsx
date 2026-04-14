"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/* ─── Types ─────────────────────────────────────────────── */
interface MatchEntry {
  id: string;
  date: string;
  type: string;
  opponent: string;
  result: "WIN" | "LOSS";
  duration: number; // seconds
}

interface ProfileData {
  username: string;
  rank: number;
  memberSince: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  matchHistory: MatchEntry[];
}

/* ─── Helpers ───────────────────────────────────────────── */
function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/* ─── Sub-components ────────────────────────────────────── */
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        border: `1px solid ${accent}22`,
        borderRadius: "10px",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        backdropFilter: "blur(12px)",
        boxShadow: `0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 ${accent}18`,
        transition: "border-color 0.25s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = `${accent}55`)
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = `${accent}22`)
      }
    >
      <span
        style={{
          fontSize: "8px",
          letterSpacing: "0.22em",
          fontWeight: 700,
          color: `${accent}88`,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "32px",
          fontWeight: 900,
          color: accent,
          textShadow: `0 0 14px ${accent}99`,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <td key={i} style={{ padding: "12px 16px" }}>
          <div
            style={{
              height: "12px",
              borderRadius: "4px",
              width: i === 1 ? "60%" : "80%",
              background:
                "linear-gradient(90deg, rgba(34,211,238,0.04) 0%, rgba(34,211,238,0.12) 50%, rgba(34,211,238,0.04) 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/users/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(`Server returned ${res.status}`);
        }
        const data: ProfileData = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  return (
    <>
      {/* Shimmer keyframe */}
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

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#030712",
          fontFamily: "var(--font-geist-mono), monospace",
          color: "rgba(34,211,238,0.9)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(8,145,178,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "48px 24px 80px",
            position: "relative",
            zIndex: 1,
            animation: "fadeIn 0.35s ease",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              borderBottom: "1px solid rgba(34,211,238,0.1)",
              paddingBottom: "24px",
              marginBottom: "36px",
            }}
          >
            <p
              style={{
                fontSize: "8px",
                letterSpacing: "0.28em",
                color: "rgba(34,211,238,0.35)",
                marginBottom: "8px",
              }}
            >
              // OPERATOR_FILE
            </p>
            <h1
              style={{
                fontSize: "clamp(24px, 4vw, 36px)",
                fontWeight: 900,
                letterSpacing: "0.18em",
                color: "#22d3ee",
                textShadow:
                  "0 0 10px rgba(34,211,238,0.7), 0 0 30px rgba(34,211,238,0.3)",
                margin: 0,
              }}
            >
              {loading ? "LOADING..." : error ? "ERROR" : profile?.username ?? "UNKNOWN"}
            </h1>
            {profile && (
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "10px",
                  color: "rgba(34,211,238,0.35)",
                  letterSpacing: "0.15em",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    boxShadow: "0 0 8px #22c55e",
                    display: "inline-block",
                  }}
                />
                RANK #{profile.rank} &nbsp;·&nbsp; MEMBER SINCE {fmtDate(profile.memberSince)}
              </p>
            )}
          </div>

          {/* ── Error state ── */}
          {error && (
            <div
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                padding: "20px 24px",
                color: "#fca5a5",
                fontSize: "11px",
                letterSpacing: "0.12em",
              }}
            >
              [ERR] UPLINK FAILURE: {error}
            </div>
          )}

          {/* ── Stats grid ── */}
          {!error && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "14px",
                  marginBottom: "40px",
                }}
              >
                {loading ? (
                  [0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: "100px",
                        borderRadius: "10px",
                        background:
                          "linear-gradient(90deg, rgba(34,211,238,0.03) 0%, rgba(34,211,238,0.08) 50%, rgba(34,211,238,0.03) 100%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s infinite",
                      }}
                    />
                  ))
                ) : (
                  <>
                    <StatCard label="Total Matches" value={profile?.totalMatches ?? 0} accent="#22d3ee" />
                    <StatCard label="Wins" value={profile?.wins ?? 0} accent="#22c55e" />
                    <StatCard label="Losses" value={profile?.losses ?? 0} accent="#ef4444" />
                    <StatCard label="Win Rate" value={`${profile?.winRate ?? 0}%`} accent="#a855f7" />
                  </>
                )}
              </div>

              {/* ── Match History table ── */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                      fontWeight: 700,
                      color: "rgba(34,211,238,0.5)",
                      margin: 0,
                      textTransform: "uppercase",
                    }}
                  >
                    Match History
                  </h2>
                  {profile && (
                    <span style={{ fontSize: "9px", color: "rgba(34,211,238,0.25)", letterSpacing: "0.15em" }}>
                      TOTAL: {profile.totalMatches}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    borderRadius: "10px",
                    border: "1px solid rgba(34,211,238,0.1)",
                    overflow: "hidden",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "10px",
                      letterSpacing: "0.1em",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(34,211,238,0.1)",
                          backgroundColor: "rgba(34,211,238,0.04)",
                        }}
                      >
                        {["Date", "Opponent", "Type", "Result", "Duration", "Replay"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "12px 16px",
                              textAlign: "left",
                              fontSize: "8px",
                              fontWeight: 700,
                              letterSpacing: "0.22em",
                              color: "rgba(34,211,238,0.35)",
                              textTransform: "uppercase",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                      ) : profile && profile.matchHistory.length > 0 ? (
                        profile.matchHistory.map((m, idx) => {
                          const isWin = m.result === "WIN";
                          return (
                            <tr
                              key={m.id}
                              style={{
                                borderBottom:
                                  idx < profile.matchHistory.length - 1
                                    ? "1px solid rgba(34,211,238,0.06)"
                                    : "none",
                                transition: "background-color 0.2s",
                              }}
                              onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                                  "rgba(34,211,238,0.03)")
                              }
                              onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                                  "transparent")
                              }
                            >
                              <td style={{ padding: "12px 16px", color: "rgba(34,211,238,0.45)" }}>
                                {fmtDate(m.date)}
                              </td>
                              <td
                                style={{
                                  padding: "12px 16px",
                                  color: "rgba(34,211,238,0.9)",
                                  fontWeight: 700,
                                }}
                              >
                                {m.opponent}
                              </td>
                              <td style={{ padding: "12px 16px", color: "rgba(34,211,238,0.4)" }}>
                                {m.type}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "3px 10px",
                                    borderRadius: "4px",
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    letterSpacing: "0.16em",
                                    backgroundColor: isWin
                                      ? "rgba(34,197,94,0.12)"
                                      : "rgba(239,68,68,0.12)",
                                    border: isWin
                                      ? "1px solid rgba(34,197,94,0.35)"
                                      : "1px solid rgba(239,68,68,0.35)",
                                    color: isWin ? "#4ade80" : "#f87171",
                                    textShadow: isWin
                                      ? "0 0 8px rgba(34,197,94,0.4)"
                                      : "0 0 8px rgba(239,68,68,0.4)",
                                  }}
                                >
                                  {m.result}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px", color: "rgba(34,211,238,0.45)" }}>
                                {fmtDuration(m.duration)}
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <button
                                  id={`replay-btn-${m.id}`}
                                  onClick={() => router.push(`/replay/${m.id}`)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "4px 10px",
                                    borderRadius: "4px",
                                    fontSize: "8px",
                                    fontWeight: 700,
                                    letterSpacing: "0.14em",
                                    cursor: "pointer",
                                    border: "1px solid rgba(34,211,238,0.3)",
                                    background: "rgba(34,211,238,0.06)",
                                    color: "#22d3ee",
                                    fontFamily: "inherit",
                                    transition: "all 0.2s",
                                    whiteSpace: "nowrap",
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,211,238,0.16)";
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(34,211,238,0.7)";
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 8px rgba(34,211,238,0.25)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(34,211,238,0.06)";
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(34,211,238,0.3)";
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                                  }}
                                >
                                  ▶ REPLAY
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              padding: "48px 16px",
                              textAlign: "center",
                              color: "rgba(34,211,238,0.2)",
                              fontSize: "11px",
                              letterSpacing: "0.18em",
                            }}
                          >
                            NO MATCH RECORDS FOUND. DEPLOY TO BATTLE LOBBY TO BEGIN.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
