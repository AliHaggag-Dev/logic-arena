import React from "react";
import { Tournament } from "../../../types";
import { BracketDimensions } from "./bracket-utils";

interface Props {
  dimensions: BracketDimensions;
  tournament: Tournament;
}

export function ConnectorLines({ dimensions, tournament }: Props) {
  const { lines, matchPositions, m_W, m_H, r_G, champGap, totalRounds } = dimensions;

  return (
    <>
      {lines.map((l, i) => (
        <g key={`line-${i}`}>
          <path
            d={`M ${l.x1} ${l.y1} C ${l.x1 + r_G / 2} ${l.y1}, ${l.x2 - r_G / 2} ${l.y2}, ${l.x2} ${l.y2}`}
            fill="none"
            stroke="rgba(var(--accent-rgb),0.25)"
            strokeWidth="2"
          />
          <circle cx={l.x1} cy={l.y1} r="3" fill="rgba(var(--accent-rgb),0.5)" />
          <circle cx={l.x2} cy={l.y2} r="3" fill="rgba(var(--accent-rgb),0.5)" />
        </g>
      ))}

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
    </>
  );
}
