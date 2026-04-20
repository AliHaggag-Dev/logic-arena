import React, { useState } from "react";
import { Tournament, TMatch } from "../types";

const MATCH_W = 220;
const MATCH_H = 74;
const ROUND_GAP = 120;
const MATCH_GAP = 24;

const ROUND_LABELS: Record<number, Record<number, string>> = {
  3: { 1: "QUARTER FINALS", 2: "SEMI FINALS", 3: "GRAND FINAL" },
  2: { 1: "SEMI FINALS", 2: "GRAND FINAL" },
};

interface Props {
  tournament: Tournament;
  userId: string | null;
  isMobile?: boolean;
}

export function BracketSVG({ tournament, userId, isMobile }: Props) {
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);

  // Scaled dimensions for mobile
  const m_W = isMobile ? 180 : MATCH_W;
  const m_H = isMobile ? 64 : MATCH_H;
  const r_G = isMobile ? 70 : ROUND_GAP;
  const m_G = isMobile ? 20 : MATCH_GAP;

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

  const maxMatchesInRound = Math.max(...rounds.map((r) => r.length));
  const svgW = totalRounds * (m_W + r_G) - r_G + 60;
  const svgH = Math.max(
    maxMatchesInRound * (m_H + m_G) - m_G + 80,
    isMobile ? 320 : 400
  );

  const matchPositions = new Map<string, { x: number; y: number }>();
  rounds.forEach((roundMatches, ri) => {
    const roundTotal = roundMatches.length;
    const totalH = roundTotal * m_H + (roundTotal - 1) * m_G;
    const startY = (svgH - totalH) / 2;
    const x = 30 + ri * (m_W + r_G);
    roundMatches.forEach((m, mi) => {
      const y = startY + mi * (m_H + m_G);
      matchPositions.set(m.id, { x, y });
    });
  });

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const nextRound = rounds[ri + 1];
    rounds[ri].forEach((m) => {
      const pos = matchPositions.get(m.id);
      if (!pos) return;
      const nextMatchIndex = Math.floor(m.matchIndex / 2);
      const nextMatch = nextRound.find((nm) => nm.matchIndex === nextMatchIndex);
      if (!nextMatch) return;
      const nextPos = matchPositions.get(nextMatch.id);
      if (!nextPos) return;

      lines.push({
        x1: pos.x + m_W,
        y1: pos.y + m_H / 2,
        x2: nextPos.x,
        y2: nextPos.y + m_H / 2,
      });
    });
  }

  if (tournament.status === "WAITING") {
    return (
      <div className="text-center p-[80px_24px] text-accent/20 text-[10px] tracking-[0.25em] animate-pulse uppercase font-bold">
        AWAITING_ARENA_INITIALIZATION...
        <br />
        <span className="text-[9px] text-accent/10 mt-2 block">
          {tournament.participants.length >= 4
            ? "COMMANDS: CREATOR_AUTH_REQUIRED_TO_LAUNCH"
            : `UPLINK_REQUIRED: ${4 - tournament.participants.length} ADDITIIONAL_PILOTS_NEEDED`}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-visible">
      {isMobile && (
        <div className="absolute top-0 right-0 z-20 flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-bl-lg backdrop-blur-md pointer-events-none">
            <span className="text-[8px] font-black tracking-[0.2em] text-accent/40 animate-pulse">
                DRAG_TO_PAN_BRACKET
            </span>
            <span className="text-[10px] text-accent/30">↔</span>
        </div>
      )}

      <div className="flex mb-6 pl-[30px]" style={{ gap: `${r_G}px` }}>
        {rounds.map((_, ri) => (
          <div
            key={ri}
            style={{ width: `${m_W}px` }}
            className="text-center text-[8px] font-black tracking-[0.4em] text-accent/20 uppercase"
          >
            {roundLabels[ri + 1] || `PHASE_${ri + 1}`}
          </div>
        ))}
      </div>

      <svg width={svgW} height={svgH} className="block mx-auto relative z-0">
        {lines.map((l, i) => (
          <g key={`line-${i}`}>
            <path
              d={`M ${l.x1} ${l.y1} C ${l.x1 + 40} ${l.y1}, ${l.x2 - 40} ${l.y2}, ${l.x2} ${l.y2}`}
              fill="none"
              stroke="rgba(var(--accent-rgb),0.1)"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <circle cx={l.x1} cy={l.y1} r="2" fill="rgba(var(--accent-rgb),0.3)" />
            <circle cx={l.x2} cy={l.y2} r="2" fill="rgba(var(--accent-rgb),0.3)" />
          </g>
        ))}

        {tournament.matches.map((m) => {
          const pos = matchPositions.get(m.id);
          if (!pos) return null;

          const isComplete = m.status === "COMPLETED";
          const isMyMatch = userId && (m.player1Id === userId || m.player2Id === userId);
          const isHovered = hoveredMatch === m.id;
          const borderColor = isComplete
            ? "rgba(var(--color-emerald-500),0.3)"
            : isMyMatch
              ? "rgba(var(--color-yellow-500),0.35)"
              : isHovered
                ? "rgba(var(--accent-rgb),0.35)"
                : "rgba(var(--accent-rgb),0.12)";

          return (
            <g
              key={m.id}
              onMouseEnter={() => setHoveredMatch(m.id)}
              onMouseLeave={() => setHoveredMatch(null)}
              className="cursor-crosshair"
            >
              <rect
                x={pos.x}
                y={pos.y + 10}
                width={m_W}
                height={m_H - 20}
                rx={6}
                fill={isComplete ? "rgba(var(--color-emerald-500),0.02)" : "rgba(0,0,0,0.4)"}
                stroke={borderColor}
                strokeWidth={isHovered || isMyMatch ? 1.5 : 1}
                className="transition-all duration-300"
              />
              
              {/* P1 Name */}
              <text
                x={pos.x + 10}
                y={pos.y + m_H / 2 - 8}
                fill={m.winnerId && m.winnerId === m.player1Id ? "var(--color-emerald-500)" : m.winnerId && m.winnerId !== m.player1Id ? "rgba(var(--accent-rgb),0.1)" : "rgba(var(--accent-rgb),0.8)"}
                fontSize={isMobile ? "9" : "10"}
                fontFamily="var(--font-mono), monospace"
                fontWeight={m.winnerId === m.player1Id ? "900" : "600"}
                letterSpacing="0.1em"
                className="uppercase"
              >
                {m.player1 ? m.player1.username.toUpperCase() : "SYNC_PENDING"}
              </text>
              
              {/* Divider / VS */}
              <text
                x={pos.x + m_W - 10}
                y={pos.y + m_H / 2 + 1}
                fill="rgba(var(--accent-rgb),0.1)"
                fontSize="7"
                fontFamily="var(--font-mono), monospace"
                fontWeight="900"
                letterSpacing="0.2em"
                textAnchor="end"
              >
                VS
              </text>

              {/* P2 Name */}
              <text
                x={pos.x + 10}
                y={pos.y + m_H / 2 + 12}
                fill={m.winnerId && m.winnerId === m.player2Id ? "var(--color-emerald-500)" : m.winnerId && m.winnerId !== m.player2Id ? "rgba(var(--accent-rgb),0.1)" : "rgba(var(--accent-rgb),0.8)"}
                fontSize={isMobile ? "9" : "10"}
                fontFamily="var(--font-mono), monospace"
                fontWeight={m.winnerId === m.player2Id ? "900" : "600"}
                letterSpacing="0.1em"
                className="uppercase"
              >
                {m.player2 ? m.player2.username.toUpperCase() : "SYNC_PENDING"}
              </text>

              {isComplete && m.winner && (
                <circle cx={pos.x + m_W - 12} cy={pos.y + m_H / 2 + (m.winnerId === m.player1Id ? -8 : 12)} r="2" fill="var(--color-emerald-500)" />
              )}
            </g>
          );
        })}

        {tournament.status === "COMPLETED" && tournament.winnerId && (() => {
          const finalMatch = tournament.matches.find((m) => m.round === totalRounds);
          if (!finalMatch) return null;
          const pos = matchPositions.get(finalMatch.id);
          if (!pos) return null;
          const winner = finalMatch.winner;
          return (
            <g>
              <rect
                x={pos.x + m_W + (isMobile ? 20 : 30)}
                y={pos.y + 10}
                width={isMobile ? 110 : 140}
                height={m_H - 20}
                rx={6}
                fill="rgba(var(--color-emerald-500),0.05)"
                stroke="rgba(var(--color-emerald-500),0.4)"
                strokeWidth="1.5"
                className="animate-pulse"
              />
              <text
                x={pos.x + m_W + (isMobile ? 75 : 100)}
                y={pos.y + m_H / 2 - 8}
                fill="rgba(var(--color-emerald-500),0.4)"
                fontSize="7"
                fontFamily="var(--font-mono), monospace"
                fontWeight="900"
                letterSpacing="0.3em"
                textAnchor="middle"
              >
                WINNER
              </text>
              <text
                x={pos.x + m_W + (isMobile ? 75 : 100)}
                y={pos.y + m_H / 2 + 10}
                fill="var(--color-emerald-500)"
                fontSize={isMobile ? "10" : "12"}
                fontFamily="var(--font-mono), monospace"
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
    </div>
  );
}
