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
}

export function BracketSVG({ tournament, userId }: Props) {
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);

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
  const svgW = totalRounds * (MATCH_W + ROUND_GAP) - ROUND_GAP + 60;
  const svgH = Math.max(
    maxMatchesInRound * (MATCH_H + MATCH_GAP) - MATCH_GAP + 80,
    400
  );

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
        x1: pos.x + MATCH_W,
        y1: pos.y + MATCH_H / 2,
        x2: nextPos.x,
        y2: nextPos.y + MATCH_H / 2,
      });
    });
  }

  if (tournament.status === "WAITING") {
    return (
      <div className="text-center p-[80px_24px] text-accent/20 text-[11px] tracking-[0.2em]">
        WAITING FOR TOURNAMENT TO START...
        <br />
        <span className="text-[10px] text-accent/10">
          {tournament.participants.length >= 4
            ? "CREATOR CAN START THE TOURNAMENT"
            : `NEED ${4 - tournament.participants.length} MORE COMBATANTS`}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex mb-4 pl-[30px]" style={{ gap: `${ROUND_GAP}px` }}>
        {rounds.map((_, ri) => (
          <div
            key={ri}
            style={{ width: `${MATCH_W}px` }}
            className="text-center text-[9px] font-extrabold tracking-[0.3em] text-accent/30 uppercase"
          >
            {roundLabels[ri + 1] || `ROUND ${ri + 1}`}
          </div>
        ))}
      </div>

      <svg width={svgW} height={svgH} className="block mx-auto">
        {lines.map((l, i) => (
          <g key={`line-${i}`}>
            <path
              d={`M ${l.x1} ${l.y1} C ${l.x1 + 50} ${l.y1}, ${l.x2 - 50} ${l.y2}, ${l.x2} ${l.y2}`}
              fill="none"
              stroke="rgba(var(--accent-rgb),0.12)"
              strokeWidth="2"
              strokeDasharray="6,4"
            />
            <circle cx={l.x1} cy={l.y1} r="3" fill="rgba(var(--accent-rgb),0.2)" />
            <circle cx={l.x2} cy={l.y2} r="3" fill="rgba(var(--accent-rgb),0.2)" />
          </g>
        ))}

        {tournament.matches.map((m) => {
          const pos = matchPositions.get(m.id);
          if (!pos) return null;

          const isComplete = m.status === "COMPLETED";
          const isMyMatch = userId && (m.player1Id === userId || m.player2Id === userId);
          const isHovered = hoveredMatch === m.id;
          const borderColor = isComplete
            ? "rgba(var(--color-emerald-500),0.35)"
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
            >
              <rect
                x={pos.x}
                y={pos.y}
                width={MATCH_W}
                height={MATCH_H}
                rx={8}
                fill={isComplete ? "rgba(var(--color-emerald-500),0.04)" : "rgba(0,0,0,0.6)"}
                stroke={borderColor}
                strokeWidth={isHovered || isMyMatch ? 1.5 : 1}
                className="transition-all duration-200"
              />
              <line
                x1={pos.x + 1}
                y1={pos.y}
                x2={pos.x + MATCH_W - 1}
                y2={pos.y}
                stroke={
                  isComplete
                    ? "rgba(var(--color-emerald-500),0.4)"
                    : isMyMatch
                      ? "rgba(var(--color-yellow-500),0.3)"
                      : "rgba(var(--accent-rgb),0.15)"
                }
                strokeWidth="2"
              />
              {/* P1 */}
              <text
                x={pos.x + 14}
                y={pos.y + 26}
                fill={m.winnerId && m.winnerId === m.player1Id ? "var(--color-emerald-500)" : m.winnerId && m.winnerId !== m.player1Id ? "rgba(var(--accent-rgb),0.2)" : "rgba(var(--accent-rgb),0.7)"}
                fontSize="11"
                fontFamily="var(--font-geist-mono), monospace"
                fontWeight={m.winnerId === m.player1Id ? "900" : "600"}
                letterSpacing="0.08em"
              >
                {m.player1 ? m.player1.username.toUpperCase() : "TBD"}
              </text>
              <line
                x1={pos.x + 10}
                y1={pos.y + MATCH_H / 2}
                x2={pos.x + MATCH_W - 10}
                y2={pos.y + MATCH_H / 2}
                stroke="rgba(var(--accent-rgb),0.06)"
                strokeWidth="1"
              />
              <text
                x={pos.x + MATCH_W - 30}
                y={pos.y + MATCH_H / 2 + 4}
                fill="rgba(var(--accent-rgb),0.15)"
                fontSize="8"
                fontFamily="var(--font-geist-mono), monospace"
                fontWeight="700"
                letterSpacing="0.15em"
              >
                VS
              </text>
              {/* P2 */}
              <text
                x={pos.x + 14}
                y={pos.y + MATCH_H - 14}
                fill={m.winnerId && m.winnerId === m.player2Id ? "var(--color-emerald-500)" : m.winnerId && m.winnerId !== m.player2Id ? "rgba(var(--accent-rgb),0.2)" : "rgba(var(--accent-rgb),0.7)"}
                fontSize="11"
                fontFamily="var(--font-geist-mono), monospace"
                fontWeight={m.winnerId === m.player2Id ? "900" : "600"}
                letterSpacing="0.08em"
              >
                {m.player2 ? m.player2.username.toUpperCase() : "TBD"}
              </text>
              {isComplete && m.winner && (
                <text x={pos.x + MATCH_W - 14} y={pos.y + 16} fill="var(--color-emerald-500)" fontSize="12" textAnchor="end">
                  ✓
                </text>
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
                x={pos.x + MATCH_W + 30}
                y={pos.y + 5}
                width={140}
                height={MATCH_H - 10}
                rx={8}
                fill="rgba(var(--color-emerald-500),0.08)"
                stroke="rgba(var(--color-emerald-500),0.4)"
                strokeWidth="1.5"
              />
              <text
                x={pos.x + MATCH_W + 100}
                y={pos.y + 28}
                fill="rgba(var(--color-emerald-500),0.5)"
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
                fill="var(--color-emerald-500)"
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
  );
}
