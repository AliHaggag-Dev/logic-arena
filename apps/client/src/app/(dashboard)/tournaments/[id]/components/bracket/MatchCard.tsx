import React from "react";
import { Tournament } from "../../../types";
import { Trophy } from "lucide-react";
import { UserLink } from "../../../../../../components/ui/UserLink";
import { BracketDimensions } from "./bracket-utils";

interface Props {
  tournament: Tournament;
  userId: string | null;
  dimensions: BracketDimensions;
  hoveredMatch: string | null;
  onHoverMatch: (id: string | null) => void;
}

export function MatchCard({ tournament, userId, dimensions, hoveredMatch, onHoverMatch }: Props) {
  const { matchPositions, m_W, m_H } = dimensions;

  return (
    <>
      {tournament.matches.map((m) => {
        const pos = matchPositions.get(m.id);
        if (!pos) return null;

        const isComplete = m.status === "COMPLETED";
        const isMyMatch = userId && (m.player1Id === userId || m.player2Id === userId);
        const isHovered = hoveredMatch === m.id;

        return (
          <g
            key={m.id}
            onMouseEnter={() => onHoverMatch(m.id)}
            onMouseLeave={() => onHoverMatch(null)}
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
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

                  <div className="flex items-center justify-between z-10 relative">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.winnerId === m.player1Id ? 'bg-emerald-500 shadow-[0_0_8px_rgba(var(--color-emerald-500),0.8)]' : isComplete ? 'bg-accent/10' : 'bg-accent/40'}`} />
                      <UserLink
                        username={m.player1?.username ?? ""}
                        className={`text-[10px] md:text-[11px] font-black tracking-[0.1em] uppercase truncate ${m.winnerId === m.player1Id ? 'text-emerald-400 [text-shadow:0_0_8px_rgba(var(--color-emerald-500),0.5)]' : isComplete && m.winnerId !== m.player1Id ? 'text-accent/30 line-through' : 'text-accent/90'
                        }`}
                      >
                        {m.player1 ? m.player1.username : "TBD"}
                      </UserLink>
                    </div>
                    {m.winnerId === m.player1Id && <Trophy size={14} className="text-emerald-500 animate-pulse drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] shrink-0" />}
                    {m.player1Id === userId && m.winnerId !== m.player1Id && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-black tracking-widest shrink-0 border border-yellow-500/20">YOU</span>}
                  </div>

                  <div className="flex items-center gap-2 opacity-60 my-1.5 z-10 relative">
                    <div className={`h-[1px] flex-1 bg-gradient-to-r from-transparent ${isMyMatch && !isComplete ? 'via-yellow-500/50' : isComplete ? 'via-emerald-500/30' : 'via-accent/50'} to-transparent`} />
                    <span className={`text-[8px] font-black tracking-[0.2em] italic ${isMyMatch && !isComplete ? 'text-yellow-500 [text-shadow:0_0_5px_rgba(var(--color-yellow-500),0.5)]' : isComplete ? 'text-emerald-500/50' : 'text-accent'}`}>VS</span>
                    <div className={`h-[1px] flex-1 bg-gradient-to-r from-transparent ${isMyMatch && !isComplete ? 'via-yellow-500/50' : isComplete ? 'via-emerald-500/30' : 'via-accent/50'} to-transparent`} />
                  </div>

                  <div className="flex items-center justify-between z-10 relative">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.winnerId === m.player2Id ? 'bg-emerald-500 shadow-[0_0_8px_rgba(var(--color-emerald-500),0.8)]' : isComplete ? 'bg-accent/10' : 'bg-accent/40'}`} />
                      <UserLink
                        username={m.player2?.username ?? ""}
                        className={`text-[10px] md:text-[11px] font-black tracking-[0.1em] uppercase truncate ${m.winnerId === m.player2Id ? 'text-emerald-400 [text-shadow:0_0_8px_rgba(var(--color-emerald-500),0.5)]' : isComplete && m.winnerId !== m.player2Id ? 'text-accent/30 line-through' : 'text-accent/90'
                        }`}
                      >
                        {m.player2 ? m.player2.username : "TBD"}
                      </UserLink>
                    </div>
                    {m.winnerId === m.player2Id && <Trophy size={14} className="text-emerald-500 animate-pulse drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] shrink-0" />}
                    {m.player2Id === userId && m.winnerId !== m.player2Id && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-black tracking-widest shrink-0 border border-yellow-500/20">YOU</span>}
                  </div>
                </div>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </>
  );
}
