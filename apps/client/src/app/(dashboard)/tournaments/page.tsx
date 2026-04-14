"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Participant {
  id: string;
  username: string;
}
interface Creator {
  id: string;
  username: string;
}
interface Tournament {
  id: string;
  name: string;
  status: string;
  creatorId: string;
  creator: Creator;
  participants: Participant[];
  winnerId: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  WAITING: {
    color: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.35)",
    glow: "0 0 10px rgba(250,204,21,0.25)",
  },
  IN_PROGRESS: {
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.08)",
    border: "rgba(34,211,238,0.35)",
    glow: "0 0 10px rgba(34,211,238,0.25)",
  },
  COMPLETED: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.35)",
    glow: "0 0 10px rgba(34,197,94,0.25)",
  },
};

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
    const interval = setInterval(fetchTournaments, 5000);
    return () => clearInterval(interval);
  }, [fetchTournaments]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/tournaments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setName("");
        setShowCreate(false);
        fetchTournaments();
      }
    } catch {
      /* silent */
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (tournamentId: string) => {
    setJoining(tournamentId);
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3001/tournaments/${tournamentId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      fetchTournaments();
    } catch {
      /* silent */
    } finally {
      setJoining(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(34,211,238,0.3), 0 0 24px rgba(34,211,238,0.1); }
          50%       { box-shadow: 0 0 16px rgba(34,211,238,0.6), 0 0 48px rgba(34,211,238,0.2); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(34,211,238,0.15); }
          50% { border-color: rgba(34,211,238,0.35); }
        }
        .tournament-card:hover {
          transform: translateY(-3px);
          border-color: rgba(34,211,238,0.4) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(34,211,238,0.08) !important;
        }
        .tournament-card { transition: all 0.25s ease; }
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
        {/* Grid bg */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(8,145,178,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(8,145,178,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "48px 24px 100px",
            position: "relative",
            zIndex: 1,
            animation: "fadeIn 0.35s ease",
          }}
        >
          {/* ── HERO ── */}
          <div
            style={{
              borderBottom: "1px solid rgba(34,211,238,0.1)",
              paddingBottom: "36px",
              marginBottom: "40px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.4em",
                  color: "rgba(34,211,238,0.3)",
                  marginBottom: "10px",
                  textTransform: "uppercase",
                }}
              >
                // BRACKET_SYSTEM_v1.0
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(28px, 5vw, 48px)",
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  color: "#22d3ee",
                  textShadow:
                    "0 0 12px rgba(34,211,238,0.9), 0 0 40px rgba(34,211,238,0.5), 0 0 80px rgba(34,211,238,0.2)",
                  lineHeight: 1,
                }}
              >
                TOURNAMENT
                <span
                  style={{
                    display: "block",
                    fontSize: "0.38em",
                    color: "rgba(34,211,238,0.4)",
                    letterSpacing: "0.35em",
                    marginTop: "6px",
                  }}
                >
                  _HUB
                </span>
              </h1>
            </div>

            {/* CREATE button */}
            {!showCreate && (
              <button
                id="create-tournament-btn"
                onMouseEnter={() => setHoveredBtn("create")}
                onMouseLeave={() => setHoveredBtn(null)}
                onClick={() => setShowCreate(true)}
                style={{
                  padding: "12px 28px",
                  backgroundColor:
                    hoveredBtn === "create"
                      ? "rgba(34,211,238,0.18)"
                      : "rgba(34,211,238,0.08)",
                  border:
                    hoveredBtn === "create"
                      ? "1px solid rgba(34,211,238,0.7)"
                      : "1px solid rgba(34,211,238,0.3)",
                  borderRadius: "8px",
                  color:
                    hoveredBtn === "create"
                      ? "#22d3ee"
                      : "rgba(34,211,238,0.7)",
                  fontSize: "10px",
                  fontWeight: 900,
                  letterSpacing: "0.28em",
                  fontFamily: "var(--font-geist-mono), monospace",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textShadow:
                    hoveredBtn === "create"
                      ? "0 0 12px rgba(34,211,238,0.6)"
                      : "none",
                  boxShadow:
                    hoveredBtn === "create"
                      ? "0 0 20px rgba(34,211,238,0.15)"
                      : "none",
                }}
              >
                [+] DEPLOY TOURNAMENT
              </button>
            )}
          </div>

          {/* ── CREATE FORM ── */}
          {showCreate && (
            <div
              style={{
                marginBottom: "32px",
                padding: "24px",
                borderRadius: "12px",
                backgroundColor: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(34,211,238,0.2)",
                backdropFilter: "blur(12px)",
                animation: "fadeIn 0.25s ease",
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: "8px",
                  letterSpacing: "0.22em",
                  color: "rgba(34,211,238,0.3)",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                NAME:
              </div>
              <input
                id="tournament-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="ENTER TOURNAMENT DESIGNATION..."
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  borderRadius: "6px",
                  color: "#22d3ee",
                  fontSize: "12px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  letterSpacing: "0.08em",
                  outline: "none",
                }}
              />
              <button
                id="deploy-tournament-btn"
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                onMouseEnter={() => setHoveredBtn("deploy")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: "10px 24px",
                  backgroundColor:
                    hoveredBtn === "deploy"
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(34,197,94,0.08)",
                  border:
                    hoveredBtn === "deploy"
                      ? "1px solid rgba(34,197,94,0.7)"
                      : "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "6px",
                  color:
                    hoveredBtn === "deploy"
                      ? "#22c55e"
                      : "rgba(34,197,94,0.7)",
                  fontSize: "10px",
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  fontFamily: "var(--font-geist-mono), monospace",
                  cursor: creating ? "wait" : "pointer",
                  transition: "all 0.2s ease",
                  opacity: !name.trim() ? 0.4 : 1,
                }}
              >
                {creating ? "DEPLOYING..." : "▶ DEPLOY"}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setName("");
                }}
                style={{
                  padding: "10px 14px",
                  backgroundColor: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "6px",
                  color: "rgba(239,68,68,0.5)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  fontFamily: "var(--font-geist-mono), monospace",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ── STATUS BADGES ROW ── */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "28px",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "TOTAL", value: tournaments.length },
              {
                label: "ACTIVE",
                value: tournaments.filter((t) => t.status === "IN_PROGRESS")
                  .length,
              },
              {
                label: "WAITING",
                value: tournaments.filter((t) => t.status === "WAITING").length,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: "6px 16px",
                  border: "1px solid rgba(34,211,238,0.15)",
                  borderRadius: "4px",
                  backgroundColor: "rgba(34,211,238,0.03)",
                  fontSize: "9px",
                  letterSpacing: "0.18em",
                  color: "rgba(34,211,238,0.45)",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "rgba(34,211,238,0.25)" }}>
                  {label}:
                </span>
                <span style={{ color: "#22d3ee", fontWeight: 700 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* ── TOURNAMENT GRID ── */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                color: "rgba(34,211,238,0.25)",
                fontSize: "11px",
                letterSpacing: "0.2em",
              }}
            >
              SCANNING TOURNAMENT NODES...
            </div>
          ) : tournaments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 24px",
                color: "rgba(34,211,238,0.2)",
                fontSize: "11px",
                letterSpacing: "0.18em",
                border: "1px dashed rgba(34,211,238,0.12)",
                borderRadius: "12px",
                backgroundColor: "rgba(0,0,0,0.3)",
              }}
            >
              NO TOURNAMENTS DETECTED. DEPLOY A NEW TOURNAMENT TO BEGIN.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "16px",
              }}
            >
              {tournaments.map((t, idx) => {
                const s = STATUS_STYLES[t.status] || STATUS_STYLES.WAITING;
                const isJoined = t.participants.some((p) => p.id === userId);
                const canJoin =
                  t.status === "WAITING" && !isJoined && t.participants.length < 8;
                return (
                  <div
                    key={t.id}
                    className="tournament-card"
                    onMouseEnter={() => setHoveredCard(t.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      padding: "24px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(0,0,0,0.55)",
                      border: "1px solid rgba(34,211,238,0.12)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                      animation: `fadeIn 0.3s ease ${idx * 0.05}s both`,
                      display: "flex",
                      flexDirection: "column" as const,
                      gap: "16px",
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 900,
                            letterSpacing: "0.12em",
                            color: "#22d3ee",
                            textShadow:
                              hoveredCard === t.id
                                ? "0 0 10px rgba(34,211,238,0.5)"
                                : "none",
                            marginBottom: "6px",
                            transition: "text-shadow 0.2s ease",
                          }}
                        >
                          {t.name}
                        </div>
                        <div
                          style={{
                            fontSize: "8px",
                            color: "rgba(34,211,238,0.25)",
                            letterSpacing: "0.15em",
                          }}
                        >
                          BY {t.creator.username.toUpperCase()}
                        </div>
                      </div>
                      {/* Status badge */}
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "4px",
                          backgroundColor: s.bg,
                          border: `1px solid ${s.border}`,
                          color: s.color,
                          fontSize: "8px",
                          fontWeight: 800,
                          letterSpacing: "0.18em",
                          boxShadow: s.glow,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.status === "IN_PROGRESS" ? "ACTIVE" : t.status}
                      </span>
                    </div>

                    {/* Players bar */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "8px",
                            color: "rgba(34,211,238,0.3)",
                            letterSpacing: "0.15em",
                          }}
                        >
                          COMBATANTS
                        </span>
                        <span
                          style={{
                            fontSize: "9px",
                            color: "rgba(34,211,238,0.5)",
                            fontWeight: 700,
                          }}
                        >
                          {t.participants.length}/8
                        </span>
                      </div>
                      <div
                        style={{
                          height: "3px",
                          borderRadius: "2px",
                          backgroundColor: "rgba(34,211,238,0.08)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(t.participants.length / 8) * 100}%`,
                            borderRadius: "2px",
                            background:
                              "linear-gradient(90deg, #22d3ee, #06b6d4)",
                            boxShadow: "0 0 8px rgba(34,211,238,0.4)",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>

                    {/* Participant avatars */}
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        flexWrap: "wrap",
                      }}
                    >
                      {t.participants.map((p) => (
                        <span
                          key={p.id}
                          title={p.username}
                          style={{
                            padding: "2px 8px",
                            borderRadius: "3px",
                            backgroundColor: "rgba(34,211,238,0.06)",
                            border: "1px solid rgba(34,211,238,0.15)",
                            fontSize: "8px",
                            color: "rgba(34,211,238,0.5)",
                            letterSpacing: "0.1em",
                            fontWeight: 600,
                          }}
                        >
                          {p.username}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "auto",
                        paddingTop: "8px",
                        borderTop: "1px solid rgba(34,211,238,0.06)",
                      }}
                    >
                      {canJoin && (
                        <button
                          id={`join-tournament-${t.id}`}
                          onClick={() => handleJoin(t.id)}
                          disabled={joining === t.id}
                          onMouseEnter={() => setHoveredBtn(`join-${t.id}`)}
                          onMouseLeave={() => setHoveredBtn(null)}
                          style={{
                            flex: 1,
                            padding: "8px 14px",
                            backgroundColor:
                              hoveredBtn === `join-${t.id}`
                                ? "rgba(250,204,21,0.15)"
                                : "rgba(250,204,21,0.06)",
                            border:
                              hoveredBtn === `join-${t.id}`
                                ? "1px solid rgba(250,204,21,0.6)"
                                : "1px solid rgba(250,204,21,0.25)",
                            borderRadius: "6px",
                            color:
                              hoveredBtn === `join-${t.id}`
                                ? "#facc15"
                                : "rgba(250,204,21,0.6)",
                            fontSize: "9px",
                            fontWeight: 800,
                            letterSpacing: "0.18em",
                            fontFamily: "var(--font-geist-mono), monospace",
                            cursor: joining === t.id ? "wait" : "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {joining === t.id ? "JOINING..." : "⚡ JOIN"}
                        </button>
                      )}
                      <button
                        id={`view-tournament-${t.id}`}
                        onClick={() => router.push(`/tournaments/${t.id}`)}
                        onMouseEnter={() => setHoveredBtn(`view-${t.id}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          flex: 1,
                          padding: "8px 14px",
                          backgroundColor:
                            hoveredBtn === `view-${t.id}`
                              ? "rgba(34,211,238,0.15)"
                              : "rgba(34,211,238,0.06)",
                          border:
                            hoveredBtn === `view-${t.id}`
                              ? "1px solid rgba(34,211,238,0.6)"
                              : "1px solid rgba(34,211,238,0.2)",
                          borderRadius: "6px",
                          color:
                            hoveredBtn === `view-${t.id}`
                              ? "#22d3ee"
                              : "rgba(34,211,238,0.6)",
                          fontSize: "9px",
                          fontWeight: 800,
                          letterSpacing: "0.18em",
                          fontFamily: "var(--font-geist-mono), monospace",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        ◉ VIEW BRACKET
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
