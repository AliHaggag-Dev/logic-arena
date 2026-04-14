"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

/* ─── Types ───────────────────────────────────────────────────────────── */
interface Player {
  id: string;
  username: string;
}
interface TMatch {
  id: string;
  round: number;
  matchIndex: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  status: string;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
}
interface Tournament {
  id: string;
  name: string;
  status: string;
  creatorId: string;
  creator: Player;
  participants: Player[];
  matches: TMatch[];
  winnerId: string | null;
}

/* ─── Constants ───────────────────────────────────────────────────────── */
const MATCH_W = 220;
const MATCH_H = 74;
const ROUND_GAP = 120;
const MATCH_GAP = 24;

const ROUND_LABELS: Record<number, Record<number, string>> = {
  3: { 1: "QUARTER FINALS", 2: "SEMI FINALS", 3: "GRAND FINAL" },
  2: { 1: "SEMI FINALS", 2: "GRAND FINAL" },
};

/* ─── Component ───────────────────────────────────────────────────────── */
export default function TournamentBracketPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  const fetchTournament = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3001/tournaments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTournament(data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournament();
    const interval = setInterval(fetchTournament, 3000);
    return () => clearInterval(interval);
  }, [fetchTournament]);

  const handleStart = async () => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3001/tournaments/${id}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    fetchTournament();
  };

  const handleSimulateWin = async (matchId: string) => {
    if (!userId) return;
    setSimulating(matchId);
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `http://localhost:3001/tournaments/${id}/matches/${matchId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ winnerId: userId }),
        }
      );
      fetchTournament();
    } catch {
      /* silent */
    } finally {
      setSimulating(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#030712",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-geist-mono), monospace",
          color: "rgba(34,211,238,0.3)",
          fontSize: "11px",
          letterSpacing: "0.2em",
        }}
      >
        LOADING BRACKET DATA...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#030712",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-geist-mono), monospace",
          color: "rgba(239,68,68,0.5)",
          fontSize: "11px",
          letterSpacing: "0.2em",
        }}
      >
        TOURNAMENT NOT FOUND
      </div>
    );
  }

  /* ─── Compute bracket layout ─────────────────────────────────────── */
  const totalRounds =
    tournament.participants.length === 8 || tournament.matches.some((m) => m.round === 3) ? 3 : 2;
  const roundLabels = ROUND_LABELS[totalRounds] || ROUND_LABELS[2];
  const rounds: TMatch[][] = [];
  for (let r = 1; r <= totalRounds; r++) {
    rounds.push(
      tournament.matches
        .filter((m) => m.round === r)
        .sort((a, b) => a.matchIndex - b.matchIndex)
    );
  }

  /* ─── Compute SVG dimensions ─────────────────────────────────────── */
  const maxMatchesInRound = Math.max(...rounds.map((r) => r.length));
  const svgW = totalRounds * (MATCH_W + ROUND_GAP) - ROUND_GAP + 60;
  const svgH = Math.max(
    maxMatchesInRound * (MATCH_H + MATCH_GAP) - MATCH_GAP + 80,
    400
  );

  /* Position each match */
  const matchPositions = new Map<string, { x: number; y: number }>();
  rounds.forEach((roundMatches, ri) => {
    const roundTotal = roundMatches.length;
    const totalH = roundTotal * MATCH_H + (roundTotal - 1) * MATCH_GAP;
    const startY = (svgH - totalH) / 2;
    const x = 30 + ri * (MATCH_W + ROUND_GAP);
    roundMatches.forEach((m, mi) => {
      const y = startY + mi * (MATCH_H + MATCH_GAP);
      matchPositions.set(m.id, { x, y });
    });
  });

  /* Connection lines between rounds */
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const nextRound = rounds[ri + 1];
    rounds[ri].forEach((m) => {
      const pos = matchPositions.get(m.id);
      if (!pos) return;
      const nextMatchIndex = Math.floor(m.matchIndex / 2);
      const nextMatch = nextRound.find(
        (nm) => nm.matchIndex === nextMatchIndex
      );
      if (!nextMatch) return;
      const nextPos = matchPositions.get(nextMatch.id);
      if (!nextPos) return;

      lines.push({
        x1: pos.x + MATCH_W,
        y1: pos.y + MATCH_H / 2,
        x2: nextPos.x,
        y2: nextPos.y + MATCH_H / 2,
      });
    });
  }

  /* ─── Find current user's active match ────────────────────────────── */
  const myMatch =
    tournament.status === "IN_PROGRESS" && userId
      ? tournament.matches.find(
          (m) =>
            m.status !== "COMPLETED" &&
            (m.player1Id === userId || m.player2Id === userId) &&
            m.player1Id &&
            m.player2Id
        )
      : null;

  const myOpponent =
    myMatch && userId
      ? myMatch.player1Id === userId
        ? myMatch.player2
        : myMatch.player1
      : null;

  const isCreator = userId === tournament.creatorId;
  const statusColor =
    tournament.status === "WAITING"
      ? "#facc15"
      : tournament.status === "IN_PROGRESS"
      ? "#22d3ee"
      : "#22c55e";

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(250,204,21,0.3); }
          50% { border-color: rgba(250,204,21,0.7); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 6px rgba(34,211,238,0.15); }
          50% { box-shadow: 0 0 18px rgba(34,211,238,0.35); }
        }
        @keyframes winner-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(34,197,94,0.3), 0 0 30px rgba(34,197,94,0.1); }
          50% { box-shadow: 0 0 24px rgba(34,197,94,0.6), 0 0 50px rgba(34,197,94,0.2); }
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
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "40px 24px 100px",
            position: "relative",
            zIndex: 1,
            animation: "fadeIn 0.35s ease",
          }}
        >
          {/* ── HEADER ── */}
          <div
            style={{
              borderBottom: "1px solid rgba(34,211,238,0.1)",
              paddingBottom: "28px",
              marginBottom: "32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.4em",
                  color: "rgba(34,211,238,0.25)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                }}
              >
                // TOURNAMENT_BRACKET
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(24px, 4vw, 40px)",
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  color: "#22d3ee",
                  textShadow:
                    "0 0 12px rgba(34,211,238,0.8), 0 0 40px rgba(34,211,238,0.4)",
                  lineHeight: 1.1,
                }}
              >
                {tournament.name}
              </h1>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  marginTop: "10px",
                }}
              >
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "4px",
                    backgroundColor:
                      tournament.status === "WAITING"
                        ? "rgba(250,204,21,0.08)"
                        : tournament.status === "IN_PROGRESS"
                        ? "rgba(34,211,238,0.08)"
                        : "rgba(34,197,94,0.08)",
                    border: `1px solid ${statusColor}55`,
                    color: statusColor,
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                  }}
                >
                  {tournament.status === "IN_PROGRESS"
                    ? "ACTIVE"
                    : tournament.status}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    color: "rgba(34,211,238,0.3)",
                    letterSpacing: "0.12em",
                  }}
                >
                  {tournament.participants.length} COMBATANTS
                </span>
              </div>
            </div>

            {/* Start button */}
            {isCreator && tournament.status === "WAITING" && (
              <button
                id="start-tournament-btn"
                onClick={handleStart}
                onMouseEnter={() => setHoveredBtn("start")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: "12px 32px",
                  backgroundColor:
                    hoveredBtn === "start"
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(34,197,94,0.08)",
                  border:
                    hoveredBtn === "start"
                      ? "1px solid rgba(34,197,94,0.7)"
                      : "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "8px",
                  color:
                    hoveredBtn === "start"
                      ? "#22c55e"
                      : "rgba(34,197,94,0.7)",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.25em",
                  fontFamily: "var(--font-geist-mono), monospace",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textShadow:
                    hoveredBtn === "start"
                      ? "0 0 12px rgba(34,197,94,0.5)"
                      : "none",
                  boxShadow:
                    hoveredBtn === "start"
                      ? "0 0 24px rgba(34,197,94,0.15)"
                      : "none",
                }}
              >
                ▶ START TOURNAMENT
              </button>
            )}
          </div>

          {/* ── MAIN CONTENT: Bracket + Sidebar ── */}
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {/* ── BRACKET AREA ── */}
            <div
              style={{
                flex: 1,
                minWidth: "600px",
                borderRadius: "16px",
                backgroundColor: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(34,211,238,0.1)",
                padding: "24px",
                overflowX: "auto",
              }}
            >
              {tournament.status === "WAITING" ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "80px 24px",
                    color: "rgba(34,211,238,0.2)",
                    fontSize: "11px",
                    letterSpacing: "0.2em",
                  }}
                >
                  WAITING FOR TOURNAMENT TO START...
                  <br />
                  <span style={{ fontSize: "9px", color: "rgba(34,211,238,0.12)" }}>
                    {tournament.participants.length >= 4
                      ? "CREATOR CAN START THE TOURNAMENT"
                      : `NEED ${4 - tournament.participants.length} MORE COMBATANTS`}
                  </span>
                </div>
              ) : (
                <>
                  {/* Round labels */}
                  <div
                    style={{
                      display: "flex",
                      gap: `${ROUND_GAP}px`,
                      marginBottom: "16px",
                      paddingLeft: "30px",
                    }}
                  >
                    {rounds.map((_, ri) => (
                      <div
                        key={ri}
                        style={{
                          width: `${MATCH_W}px`,
                          textAlign: "center",
                          fontSize: "8px",
                          fontWeight: 800,
                          letterSpacing: "0.3em",
                          color: "rgba(34,211,238,0.3)",
                          textTransform: "uppercase",
                        }}
                      >
                        {roundLabels[ri + 1] || `ROUND ${ri + 1}`}
                      </div>
                    ))}
                  </div>

                  {/* SVG Bracket */}
                  <svg
                    width={svgW}
                    height={svgH}
                    style={{ display: "block", margin: "0 auto" }}
                  >
                    {/* Connection lines */}
                    {lines.map((l, i) => (
                      <g key={`line-${i}`}>
                        <path
                          d={`M ${l.x1} ${l.y1} C ${l.x1 + 50} ${l.y1}, ${l.x2 - 50} ${l.y2}, ${l.x2} ${l.y2}`}
                          fill="none"
                          stroke="rgba(34,211,238,0.12)"
                          strokeWidth="2"
                          strokeDasharray="6,4"
                        />
                        <circle
                          cx={l.x1}
                          cy={l.y1}
                          r="3"
                          fill="rgba(34,211,238,0.2)"
                        />
                        <circle
                          cx={l.x2}
                          cy={l.y2}
                          r="3"
                          fill="rgba(34,211,238,0.2)"
                        />
                      </g>
                    ))}

                    {/* Match boxes */}
                    {tournament.matches.map((m) => {
                      const pos = matchPositions.get(m.id);
                      if (!pos) return null;

                      const isComplete = m.status === "COMPLETED";
                      const isMyMatch =
                        userId &&
                        (m.player1Id === userId || m.player2Id === userId);
                      const isHovered = hoveredMatch === m.id;
                      const borderColor = isComplete
                        ? "rgba(34,197,94,0.35)"
                        : isMyMatch
                        ? "rgba(250,204,21,0.35)"
                        : isHovered
                        ? "rgba(34,211,238,0.35)"
                        : "rgba(34,211,238,0.12)";

                      return (
                        <g
                          key={m.id}
                          onMouseEnter={() => setHoveredMatch(m.id)}
                          onMouseLeave={() => setHoveredMatch(null)}
                        >
                          {/* Box bg */}
                          <rect
                            x={pos.x}
                            y={pos.y}
                            width={MATCH_W}
                            height={MATCH_H}
                            rx={8}
                            fill={
                              isComplete
                                ? "rgba(34,197,94,0.04)"
                                : "rgba(0,0,0,0.6)"
                            }
                            stroke={borderColor}
                            strokeWidth={isHovered || isMyMatch ? 1.5 : 1}
                          />

                          {/* Accent line top */}
                          <line
                            x1={pos.x + 1}
                            y1={pos.y}
                            x2={pos.x + MATCH_W - 1}
                            y2={pos.y}
                            stroke={
                              isComplete
                                ? "rgba(34,197,94,0.4)"
                                : isMyMatch
                                ? "rgba(250,204,21,0.3)"
                                : "rgba(34,211,238,0.15)"
                            }
                            strokeWidth="2"
                          />

                          {/* Player 1 */}
                          <text
                            x={pos.x + 14}
                            y={pos.y + 26}
                            fill={
                              m.winnerId && m.winnerId === m.player1Id
                                ? "#22c55e"
                                : m.winnerId && m.winnerId !== m.player1Id
                                ? "rgba(34,211,238,0.2)"
                                : "rgba(34,211,238,0.7)"
                            }
                            fontSize="11"
                            fontFamily="var(--font-geist-mono), monospace"
                            fontWeight={
                              m.winnerId === m.player1Id ? "900" : "600"
                            }
                            letterSpacing="0.08em"
                          >
                            {m.player1
                              ? m.player1.username.toUpperCase()
                              : "TBD"}
                          </text>

                          {/* VS divider */}
                          <line
                            x1={pos.x + 10}
                            y1={pos.y + MATCH_H / 2}
                            x2={pos.x + MATCH_W - 10}
                            y2={pos.y + MATCH_H / 2}
                            stroke="rgba(34,211,238,0.06)"
                            strokeWidth="1"
                          />
                          <text
                            x={pos.x + MATCH_W - 30}
                            y={pos.y + MATCH_H / 2 + 4}
                            fill="rgba(34,211,238,0.15)"
                            fontSize="8"
                            fontFamily="var(--font-geist-mono), monospace"
                            fontWeight="700"
                            letterSpacing="0.15em"
                          >
                            VS
                          </text>

                          {/* Player 2 */}
                          <text
                            x={pos.x + 14}
                            y={pos.y + MATCH_H - 14}
                            fill={
                              m.winnerId && m.winnerId === m.player2Id
                                ? "#22c55e"
                                : m.winnerId && m.winnerId !== m.player2Id
                                ? "rgba(34,211,238,0.2)"
                                : "rgba(34,211,238,0.7)"
                            }
                            fontSize="11"
                            fontFamily="var(--font-geist-mono), monospace"
                            fontWeight={
                              m.winnerId === m.player2Id ? "900" : "600"
                            }
                            letterSpacing="0.08em"
                          >
                            {m.player2
                              ? m.player2.username.toUpperCase()
                              : "TBD"}
                          </text>

                          {/* Winner badge */}
                          {isComplete && m.winner && (
                            <text
                              x={pos.x + MATCH_W - 14}
                              y={pos.y + 16}
                              fill="#22c55e"
                              fontSize="12"
                              textAnchor="end"
                            >
                              ✓
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Champion badge */}
                    {tournament.status === "COMPLETED" &&
                      tournament.winnerId && (() => {
                        const finalMatch = tournament.matches.find(
                          (m) => m.round === totalRounds
                        );
                        if (!finalMatch) return null;
                        const pos = matchPositions.get(finalMatch.id);
                        if (!pos) return null;
                        const winner = finalMatch.winner;
                        return (
                          <g>
                            <rect
                              x={pos.x + MATCH_W + 30}
                              y={pos.y + 5}
                              width={140}
                              height={MATCH_H - 10}
                              rx={8}
                              fill="rgba(34,197,94,0.08)"
                              stroke="rgba(34,197,94,0.4)"
                              strokeWidth="1.5"
                            />
                            <text
                              x={pos.x + MATCH_W + 100}
                              y={pos.y + 28}
                              fill="rgba(34,197,94,0.5)"
                              fontSize="7"
                              fontFamily="var(--font-geist-mono), monospace"
                              fontWeight="700"
                              letterSpacing="0.3em"
                              textAnchor="middle"
                            >
                              CHAMPION
                            </text>
                            <text
                              x={pos.x + MATCH_W + 100}
                              y={pos.y + 50}
                              fill="#22c55e"
                              fontSize="13"
                              fontFamily="var(--font-geist-mono), monospace"
                              fontWeight="900"
                              letterSpacing="0.12em"
                              textAnchor="middle"
                            >
                              🏆 {winner?.username.toUpperCase() || ""}
                            </text>
                          </g>
                        );
                      })()}
                  </svg>
                </>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <div style={{ width: "280px", flexShrink: 0 }}>
              {/* Your Match card */}
              {myMatch && myOpponent && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "20px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(250,204,21,0.04)",
                    border: "1px solid rgba(250,204,21,0.25)",
                    animation: "pulse-border 2s infinite",
                  }}
                >
                  <div
                    style={{
                      fontSize: "8px",
                      fontWeight: 800,
                      letterSpacing: "0.3em",
                      color: "rgba(250,204,21,0.5)",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    ⚡ YOUR MATCH
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "rgba(250,204,21,0.8)",
                      letterSpacing: "0.1em",
                      marginBottom: "4px",
                    }}
                  >
                    VS {myOpponent.username.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: "8px",
                      color: "rgba(250,204,21,0.3)",
                      letterSpacing: "0.15em",
                      marginBottom: "14px",
                    }}
                  >
                    ROUND{" "}
                    {roundLabels[myMatch.round] || `#${myMatch.round}`}
                  </div>
                  <button
                    id="simulate-win-btn"
                    onClick={() => handleSimulateWin(myMatch.id)}
                    disabled={simulating === myMatch.id}
                    onMouseEnter={() => setHoveredBtn("sim")}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      backgroundColor:
                        hoveredBtn === "sim"
                          ? "rgba(34,197,94,0.2)"
                          : "rgba(34,197,94,0.08)",
                      border:
                        hoveredBtn === "sim"
                          ? "1px solid rgba(34,197,94,0.7)"
                          : "1px solid rgba(34,197,94,0.3)",
                      borderRadius: "6px",
                      color:
                        hoveredBtn === "sim"
                          ? "#22c55e"
                          : "rgba(34,197,94,0.7)",
                      fontSize: "9px",
                      fontWeight: 900,
                      letterSpacing: "0.2em",
                      fontFamily: "var(--font-geist-mono), monospace",
                      cursor:
                        simulating === myMatch.id ? "wait" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {simulating === myMatch.id
                      ? "SIMULATING..."
                      : "▶ SIMULATE WIN"}
                  </button>
                </div>
              )}

              {/* Participants list */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(34,211,238,0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: "8px",
                    fontWeight: 800,
                    letterSpacing: "0.3em",
                    color: "rgba(34,211,238,0.3)",
                    marginBottom: "16px",
                    textTransform: "uppercase",
                    paddingBottom: "10px",
                    borderBottom: "1px solid rgba(34,211,238,0.06)",
                  }}
                >
                  COMBATANTS ({tournament.participants.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {tournament.participants.map((p) => {
                    const isEliminated =
                      tournament.status !== "WAITING" &&
                      tournament.matches.some(
                        (m) =>
                          m.status === "COMPLETED" &&
                          (m.player1Id === p.id || m.player2Id === p.id) &&
                          m.winnerId !== p.id
                      );
                    const isChampion = tournament.winnerId === p.id;

                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          backgroundColor: isChampion
                            ? "rgba(34,197,94,0.08)"
                            : "rgba(34,211,238,0.02)",
                          border: isChampion
                            ? "1px solid rgba(34,197,94,0.3)"
                            : "1px solid rgba(34,211,238,0.06)",
                          opacity: isEliminated ? 0.4 : 1,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: isChampion
                              ? "#22c55e"
                              : isEliminated
                              ? "rgba(239,68,68,0.4)"
                              : "rgba(34,211,238,0.3)",
                            boxShadow: isChampion
                              ? "0 0 8px rgba(34,197,94,0.5)"
                              : "none",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: isChampion
                              ? "#22c55e"
                              : isEliminated
                              ? "rgba(34,211,238,0.3)"
                              : "rgba(34,211,238,0.6)",
                            textDecoration: isEliminated
                              ? "line-through"
                              : "none",
                            flex: 1,
                          }}
                        >
                          {p.username}
                        </span>
                        {isChampion && (
                          <span style={{ fontSize: "12px" }}>🏆</span>
                        )}
                        {isEliminated && !isChampion && (
                          <span
                            style={{
                              fontSize: "7px",
                              color: "rgba(239,68,68,0.4)",
                              letterSpacing: "0.15em",
                              fontWeight: 700,
                            }}
                          >
                            OUT
                          </span>
                        )}
                        {p.id === userId && !isChampion && !isEliminated && (
                          <span
                            style={{
                              fontSize: "7px",
                              color: "rgba(250,204,21,0.5)",
                              letterSpacing: "0.15em",
                              fontWeight: 700,
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
