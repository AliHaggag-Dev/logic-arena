"use client";

import React, { useState } from "react";
import { Tournament } from "../../../types";
import { calcBracketDimensions } from "./bracket-utils";
import { PhaseLabels } from "./PhaseLabels";
import { ConnectorLines } from "./ConnectorLines";
import { MatchCard } from "./MatchCard";
import { ChampionCard } from "./ChampionCard";

interface Props {
  tournament: Tournament;
  userId: string | null;
  isMobile?: boolean;
}

export function BracketSVG({ tournament, userId, isMobile }: Props) {
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);
  const dims = calcBracketDimensions(tournament, !!isMobile);

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

      <PhaseLabels rounds={dims.rounds} totalRounds={dims.totalRounds} r_G={dims.r_G} m_W={dims.m_W} />

      <svg
        width={dims.svgW}
        height={dims.svgH}
        className="block mx-auto relative z-0"
        role="img"
        aria-label={`Tournament bracket for ${tournament.name}`}
      >
        <title>Tournament Bracket — {tournament.name}</title>

        <ConnectorLines dimensions={dims} tournament={tournament} />

        <MatchCard
          tournament={tournament}
          userId={userId}
          dimensions={dims}
          hoveredMatch={hoveredMatch}
          onHoverMatch={setHoveredMatch}
        />

        <ChampionCard tournament={tournament} dimensions={dims} />
      </svg>
    </div>
  );
}
