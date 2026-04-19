import React, { useState } from "react";
import { Tournament, TMatch, Player } from "../types";

const ROUND_LABELS: Record<number, Record<number, string>> = {
  3: { 1: "QUARTER FINALS", 2: "SEMI FINALS", 3: "GRAND FINAL" },
  2: { 1: "SEMI FINALS", 2: "GRAND FINAL" },
};

interface Props {
  tournament: Tournament;
  userId: string | null;
  myMatch: TMatch | null;
  myOpponent: Player | null;
  simulating: string | null;
  onSimulateWin: (matchId: string) => void;
}

export function MatchSidebar({ tournament, userId, myMatch, myOpponent, simulating, onSimulateWin }: Props) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const totalRounds = tournament.participants.length === 8 || tournament.matches.some((m) => m.round === 3) ? 3 : 2;
  const roundLabels = ROUND_LABELS[totalRounds] || ROUND_LABELS[2];

  return (
    <div className="w-[280px] shrink-0">
      {myMatch && myOpponent && (
        <div className="mb-5 p-5 rounded-xl bg-yellow-500/5 border border-yellow-500/25 animate-[pulse-border_2s_infinite]">
          <div className="text-[9px] font-extrabold tracking-[0.3em] text-yellow-500/50 mb-3 uppercase">
            ⚡ YOUR MATCH
          </div>
          <div className="text-[12px] font-bold text-yellow-500/80 tracking-[0.1em] mb-1">
            VS {myOpponent.username.toUpperCase()}
          </div>
          <div className="text-[9px] text-yellow-500/30 tracking-[0.15em] mb-3.5">
            ROUND {roundLabels[myMatch.round] || `#${myMatch.round}`}
          </div>
          <button
            onClick={() => onSimulateWin(myMatch.id)}
            disabled={simulating === myMatch.id}
            onMouseEnter={() => setHoveredBtn("sim")}
            onMouseLeave={() => setHoveredBtn(null)}
            className={`w-full py-2.5 px-4 rounded-md text-[10px] font-black tracking-[0.2em] font-mono transition-all duration-200 ${simulating === myMatch.id ? 'cursor-wait' : 'cursor-pointer'
              } ${hoveredBtn === "sim"
                ? "bg-emerald-500/20 border-emerald-500/70 text-emerald-500"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500/70"
              }`}
            style={{ borderWidth: "1px" }}
          >
            {simulating === myMatch.id ? "SIMULATING..." : "▶ SIMULATE WIN"}
          </button>
        </div>
      )}

      {/* Participants list */}
      <div className="p-5 rounded-xl bg-card/60 border border-accent/10 backdrop-blur-sm">
        <div className="text-[9px] font-extrabold tracking-[0.3em] text-accent/30 mb-4 uppercase pb-2.5 border-b border-accent/5">
          COMBATANTS ({tournament.participants.length})
        </div>
        <div className="flex flex-col gap-1.5">
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
                className={`flex items-center gap-2 p-[8px_10px] rounded-md transition-all duration-200 ${isChampion ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-accent/5 border border-accent/5"
                  } ${isEliminated ? "opacity-40" : "opacity-100"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${isChampion ? "bg-emerald-500 shadow-[0_0_8px_rgba(var(--color-emerald-500),0.5)]" : isEliminated ? "bg-red-500/40" : "bg-accent/30"
                    }`}
                />
                <span
                  className={`text-[10px] font-bold tracking-[0.1em] flex-1 ${isChampion ? "text-emerald-500" : isEliminated ? "text-accent/30 line-through" : "text-accent/60"
                    }`}
                >
                  {p.username}
                </span>
                {isChampion && <span className="text-[12px]">🏆</span>}
                {isEliminated && !isChampion && (
                  <span className="text-[8px] text-red-500/40 tracking-[0.15em] font-bold">
                    OUT
                  </span>
                )}
                {p.id === userId && !isChampion && !isEliminated && (
                  <span className="text-[8px] text-yellow-500/50 tracking-[0.15em] font-bold">
                    YOU
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
