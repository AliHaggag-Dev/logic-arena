import React from "react";
import { Tournament } from "../../../types";
import { Trophy } from "lucide-react";
import { UserLink } from "../../../../../../components/ui/UserLink";
import { BracketDimensions } from "./bracket-utils";

interface Props {
  tournament: Tournament;
  dimensions: BracketDimensions;
}

export function ChampionCard({ tournament, dimensions }: Props) {
  if (tournament.status !== "COMPLETED" || !tournament.winnerId) return null;

  const { totalRounds, matchPositions, m_W, m_H, champGap, champW } = dimensions;
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
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="text-[8px] font-black tracking-[0.3em] text-emerald-500/60 uppercase mb-1.5 relative z-10">
            CHAMPION
          </div>
          <div className="text-[11px] md:text-[13px] font-black tracking-[0.15em] text-emerald-400 uppercase truncate w-full flex items-center justify-center gap-2 [text-shadow:0_0_10px_rgba(var(--color-emerald-500),0.8)] relative z-10">
            <Trophy size={16} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
            <UserLink
              username={winner?.username ?? ""}
              className="hover:opacity-80 transition-opacity"
            >
              {winner?.username ?? "UNKNOWN"}
            </UserLink>
          </div>
        </div>
      </div>
    </foreignObject>
  );
}
