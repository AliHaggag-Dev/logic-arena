import React, { useState } from "react";
import { Tournament, TMatch } from "../types";

const ROUND_LABELS: Record<number, Record<number, string>> = {
  3: { 1: "QUARTER FINALS", 2: "SEMI FINALS", 3: "GRAND FINAL" },
  2: { 1: "SEMI FINALS", 2: "GRAND FINAL" },
  1: { 1: "GRAND FINAL" },
};

interface Props {
  tournament: Tournament;
  userId: string | null;
  isMobile?: boolean;
}

export function BracketSVG({ tournament, userId, isMobile }: Props) {
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);

  // Scaled dimensions for mobile vs desktop for a premium feel
  const m_W = isMobile ? 210 : 250; // Wider match cards
  const m_H = isMobile ? 74 : 86;   // Taller match cards for nice spacing
  const r_G = isMobile ? 60 : 100;  // Gap between rounds
  const m_G = isMobile ? 24 : 32;   // Vertical gap between matches

  const totalRounds =
    tournament.participants.length >= 8 || tournament.matches.some((m) => m.round === 3)
      ? 3
      : tournament.participants.length >= 4
        ? 2
        : 1;

  const roundLabels = ROUND_LABELS[totalRounds] ?? ROUND_LABELS[2];

  const rounds: TMatch[][] = [];
  for (let r = 1; r <= totalRounds; r++) {
    rounds.push(
      tournament.matches
        .filter((m) => m.round === r)
        .sort((a, b) => a.matchIndex - b.matchIndex)
    );
  }

  const maxMatchesInRound = Math.max(...rounds.map((r) => r.length), 1);

  // Calculate SVG Dimensions accurately
  const champGap = isMobile ? 20 : 40;
  const champW = isMobile ? 150 : 180;

  // FIX: Dynamic height instead of hardcoded 400px so Grand Final isn't floating
  const baseH = maxMatchesInRound * (m_H + m_G) - m_G;
  const svgH = Math.max(baseH + 60, isMobile ? 140 : 160); // Padding top/bottom

  const svgW =
    30 + // Left padding
    totalRounds * (m_W + r_G) - r_G + // Total width of all rounds
    (tournament.status === "COMPLETED" ? champGap + champW : 0) + // Champion card if done
    60; // Extra right padding

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
    if (!nextRound) continue;
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
        AWAITING MATCH SETUP...
        <br />
        <span className="text-[9px] text-accent/10 mt-2 block">
          {tournament.participants.length >= 4
            ? "Waiting for creator to start match..."
            : `NEED ${4 - tournament.participants.length} MORE PLAYERS TO START`}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-visible pb-10">
      {isMobile && (
        <div className="absolute top-0 right-0 z-20 flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-bl-lg backdrop-blur-md pointer-events-none shadow-lg">
          <span className="text-[8px] font-black tracking-[0.2em] text-accent/70 animate-pulse">
            SCROLL_TO_VIEW
          </span>
          <span className="text-[10px] text-accent/30">↔</span>
        </div>
      )}

      {/* PHASE LABELS */}
      <div className="flex mb-4 pl-[30px]" style={{ gap: `${r_G}px` }}>
        {rounds.map((_, ri) => (
          <div
            key={ri}
            style={{ width: `${m_W}px` }}
            className="text-center text-[9px] md:text-[10px] font-black tracking-[0.4em] text-accent/40 uppercase relative"
          >
            {roundLabels[ri + 1] ?? `PHASE_${ri + 1}`}
            <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-8 h-[2px] bg-accent/20 rounded-full" />
          </div>
        ))}
      </div>

      <svg
        width={svgW}
        height={svgH}
        className="block mx-auto relative z-0"
        role="img"
        aria-label={`Tournament bracket for ${tournament.name}`}
      >
        <title>Tournament Bracket — {tournament.name}</title>

        {/* 1. CONNECTOR LINES */}
        {lines.map((l, i) => (
          <g key={`line-${i}`}>
            <path
              d={`M ${l.x1} ${l.y1} C ${l.x1 + r_G / 2} ${l.y1}, ${l.x2 - r_G / 2} ${l.y2}, ${l.x2} ${l.y2}`}
              fill="none"
              stroke="rgba(var(--accent-rgb),0.25)"
              strokeWidth="2"
            />
            {/* Connection nodes */}
            <circle cx={l.x1} cy={l.y1} r="3" fill="rgba(var(--accent-rgb),0.5)" />
            <circle cx={l.x2} cy={l.y2} r="3" fill="rgba(var(--accent-rgb),0.5)" />
          </g>
        ))}

        {/* Champion Connector Line */}
        {tournament.status === "COMPLETED" && tournament.winnerId && (() => {
          const finalMatch = tournament.matches.find((m) => m.round === totalRounds);
          if (!finalMatch) return null;
          const pos = matchPositions.get(finalMatch.id);
          if (!pos) return null;

          const startX = pos.x + m_W;
          const startY = pos.y + m_H / 2;
          const endX = startX + champGap;
          return (
            <g key="champion-line">
              <path
                d={`M ${startX} ${startY} L ${endX} ${startY}`}
                fill="none"
                stroke="var(--color-emerald-500)"
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeDasharray="4,4"
                className="animate-[pulse-border_2s_ease-in-out_infinite]"
              />
              <circle cx={startX} cy={startY} r="3" fill="var(--color-emerald-500)" opacity="0.6" />
              <circle cx={endX} cy={startY} r="4" fill="var(--color-emerald-500)" className="animate-pulse" />
            </g>
          );
        })()}

        {/* 2. MATCH CARDS (Glassmorphism via foreignObject) */}
        {tournament.matches.map((m) => {
          const pos = matchPositions.get(m.id);
          if (!pos) return null;

          const isComplete = m.status === "COMPLETED";
          const isMyMatch = userId && (m.player1Id === userId || m.player2Id === userId);
          const isHovered = hoveredMatch === m.id;

          return (
            <g
              key={m.id}
              onMouseEnter={() => setHoveredMatch(m.id)}
              onMouseLeave={() => setHoveredMatch(null)}
              className={isComplete ? "cursor-default" : "cursor-crosshair"}
            >
              <foreignObject
                x={pos.x - 20}
                y={pos.y - 20}
                width={m_W + 40}
                height={m_H + 40}
                className="overflow-visible"
              >
                <div className="relative transition-all duration-300 w-full h-full flex items-center justify-center">
                  <div
                    style={{ width: m_W, height: m_H }}
                    className={`relative rounded-xl border flex flex-col justify-center px-4 transition-all duration-300 backdrop-blur-md overflow-hidden group
                      ${isComplete
                        ? 'bg-emerald-500/[0.04] border-emerald-500/20 shadow-[0_0_15px_rgba(var(--color-emerald-500),0.05)]'
                        : isMyMatch
                          ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_20px_rgba(var(--color-yellow-500),0.15)] scale-[1.02]'
                          : isHovered
                            ? 'bg-accent/15 border-accent/40 shadow-[0_8px_32px_rgba(var(--accent-rgb),0.25)] -translate-y-[2px]'
                            : 'bg-card/60 border-accent/10 shadow-lg hover:border-accent/30'}`}
                  >
                    {/* Glass sheen */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

                    {/* P1 */}
                    <div className="flex items-center justify-between z-10 relative">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.winnerId === m.player1Id ? 'bg-emerald-500 shadow-[0_0_8px_rgba(var(--color-emerald-500),0.8)]' : isComplete ? 'bg-accent/10' : 'bg-accent/40'}`} />
                        <span className={`text-[10px] md:text-[11px] font-black tracking-[0.1em] uppercase truncate ${m.winnerId === m.player1Id ? 'text-emerald-400 [text-shadow:0_0_8px_rgba(var(--color-emerald-500),0.5)]' : isComplete && m.winnerId !== m.player1Id ? 'text-accent/30 line-through' : 'text-accent/90'
                          }`}>
                          {m.player1 ? m.player1.username : "TBD"}
                        </span>
                      </div>
                      {m.winnerId === m.player1Id && <span className="text-[12px] animate-pulse [text-shadow:0_0_5px_rgba(var(--color-emerald-500),0.5)] shrink-0">🏆</span>}
                      {m.player1Id === userId && m.winnerId !== m.player1Id && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-black tracking-widest shrink-0 border border-yellow-500/20">YOU</span>}
                    </div>

                    {/* VS */}
                    <div className="flex items-center gap-2 opacity-60 my-1.5 z-10 relative">
                      <div className={`h-[1px] flex-1 bg-gradient-to-r from-transparent ${isMyMatch && !isComplete ? 'via-yellow-500/50' : isComplete ? 'via-emerald-500/30' : 'via-accent/50'} to-transparent`} />
                      <span className={`text-[8px] font-black tracking-[0.2em] italic ${isMyMatch && !isComplete ? 'text-yellow-500 [text-shadow:0_0_5px_rgba(var(--color-yellow-500),0.5)]' : isComplete ? 'text-emerald-500/50' : 'text-accent'}`}>VS</span>
                      <div className={`h-[1px] flex-1 bg-gradient-to-r from-transparent ${isMyMatch && !isComplete ? 'via-yellow-500/50' : isComplete ? 'via-emerald-500/30' : 'via-accent/50'} to-transparent`} />
                    </div>

                    {/* P2 */}
                    <div className="flex items-center justify-between z-10 relative">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.winnerId === m.player2Id ? 'bg-emerald-500 shadow-[0_0_8px_rgba(var(--color-emerald-500),0.8)]' : isComplete ? 'bg-accent/10' : 'bg-accent/40'}`} />
                        <span className={`text-[10px] md:text-[11px] font-black tracking-[0.1em] uppercase truncate ${m.winnerId === m.player2Id ? 'text-emerald-400 [text-shadow:0_0_8px_rgba(var(--color-emerald-500),0.5)]' : isComplete && m.winnerId !== m.player2Id ? 'text-accent/30 line-through' : 'text-accent/90'
                          }`}>
                          {m.player2 ? m.player2.username : "TBD"}
                        </span>
                      </div>
                      {m.winnerId === m.player2Id && <span className="text-[12px] animate-pulse [text-shadow:0_0_5px_rgba(var(--color-emerald-500),0.5)] shrink-0">🏆</span>}
                      {m.player2Id === userId && m.winnerId !== m.player2Id && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-black tracking-widest shrink-0 border border-yellow-500/20">YOU</span>}
                    </div>
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* 3. CHAMPION CARD */}
        {tournament.status === "COMPLETED" && tournament.winnerId && (() => {
          const finalMatch = tournament.matches.find((m) => m.round === totalRounds);
          if (!finalMatch) return null;
          const pos = matchPositions.get(finalMatch.id);
          if (!pos) return null;
          const winner = finalMatch.winner;

          return (
            <foreignObject
              x={pos.x + m_W + champGap - 20}
              y={pos.y - 20}
              width={champW + 40}
              height={m_H + 40}
              className="overflow-visible"
            >
              <div className="w-full h-full flex items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                <div
                  style={{ width: champW, height: m_H }}
                  className="relative rounded-xl bg-emerald-500/10 border border-emerald-500/40 shadow-[0_0_30px_rgba(var(--color-emerald-500),0.15)] flex flex-col items-center justify-center p-3 backdrop-blur-md overflow-hidden group"
                >
                  {/* Premium shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  <div className="text-[8px] font-black tracking-[0.3em] text-emerald-500/60 uppercase mb-1.5 relative z-10">
                    CHAMPION
                  </div>
                  <div className="text-[11px] md:text-[13px] font-black tracking-[0.15em] text-emerald-400 uppercase truncate w-full text-center [text-shadow:0_0_10px_rgba(var(--color-emerald-500),0.8)] relative z-10">
                    🏆 {winner?.username ?? "UNKNOWN"}
                  </div>
                </div>
              </div>
            </foreignObject>
          );
        })()}
      </svg>
    </div>
  );
}
