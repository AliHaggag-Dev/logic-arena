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
  isMobile?: boolean;
}

export function MatchSidebar({ tournament, userId, myMatch, myOpponent, simulating, onSimulateWin, isMobile }: Props) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const totalRounds = tournament.participants.length === 8 || tournament.matches.some((m) => m.round === 3) ? 3 : 2;
  const roundLabels = ROUND_LABELS[totalRounds] || ROUND_LABELS[2];

  return (
    <div className={`${isMobile ? "w-full" : "w-[300px]"} shrink-0 animate-[fadeIn_0.5s_ease]`}>
      {myMatch && myOpponent && (
        <div className="mb-6 p-5 rounded-2xl bg-yellow-500/[0.03] border border-yellow-500/20 backdrop-blur-md relative overflow-hidden group shadow-xl">
          {/* Animated pulse background */}
          <div className="absolute inset-0 bg-yellow-500/[0.02] animate-pulse pointer-events-none" />
          
          <div className="relative z-10">
            <div className="text-[9px] font-black tracking-[0.35em] text-yellow-500/40 mb-4 flex justify-between items-center uppercase">
              <span>⚡ ACTIVE_ENGAGEMENT</span>
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
            </div>
            
            <div className="flex justify-between items-end mb-5">
                <div>
                    <div className="text-[13px] font-black text-yellow-500 tracking-[0.1em] uppercase">
                        VS_{myOpponent.username.toUpperCase()}
                    </div>
                    <div className="text-[8px] text-yellow-500/30 tracking-[0.2em] mt-1 font-bold">
                        FREQ: {roundLabels[myMatch.round] || `PHASE_${myMatch.round}`}
                    </div>
                </div>
                <div className="text-[10px] text-yellow-500/20 font-black tracking-tighter italic">
                    //URGENT
                </div>
            </div>

            <button
                onClick={() => onSimulateWin(myMatch.id)}
                disabled={simulating === myMatch.id}
                onMouseEnter={() => setHoveredBtn("sim")}
                onMouseLeave={() => setHoveredBtn(null)}
                className={`w-full py-4 px-4 rounded-xl text-[10px] font-black tracking-[0.3em] font-mono transition-all duration-300 relative overflow-hidden group active:scale-[0.97] ${simulating === myMatch.id ? 'cursor-wait opacity-50' : 'cursor-pointer'
                } ${hoveredBtn === "sim"
                    ? "bg-emerald-500/20 border border-emerald-500/60 text-emerald-500 shadow-[0_0_20px_rgba(var(--color-emerald-500),0.15)]"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500/50"
                }`}
            >
                <span className="relative z-10">{simulating === myMatch.id ? "SIMULATING_NEURAL_VICTORY..." : "▶ OVERRIDE_VICTORY"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Participants list */}
      <div className={`p-5 rounded-2xl bg-card/10 border border-accent/10 backdrop-blur-xl relative overflow-hidden shadow-2xl`}>
        {/* Scanlines inner */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[repeating-linear-gradient(0deg,rgba(var(--accent-rgb),0.5)_0px,rgba(var(--accent-rgb),0.5)_1px,transparent_1px,transparent_4px)]" />

        <div className="relative z-10">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-accent/10">
                <div className="text-[9px] font-black tracking-[0.3em] text-accent/30 uppercase">
                    COMBATANTS_MANIFEST
                </div>
                <div className="text-[10px] text-accent/50 font-black">
                    [{tournament.participants.length}/8]
                </div>
            </div>

            <div className="flex flex-col gap-2">
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
                    className={`flex items-center gap-3 p-[10px_12px] rounded-lg border transition-all duration-300 ${isChampion ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(var(--color-emerald-500),0.1)]" : "bg-accent/[0.03] border-accent/5"
                    } ${isEliminated ? "opacity-30 grayscale saturate-0" : "opacity-100"}`}
                >
                    <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${isChampion ? "bg-emerald-500 shadow-[0_0_8px_rgba(var(--color-emerald-500),0.8)] animate-pulse" : isEliminated ? "bg-red-500/40" : "bg-accent/40"
                        }`}
                    />
                    <span
                    className={`text-[10px] font-black tracking-[0.15em] flex-1 uppercase ${isChampion ? "text-emerald-500" : isEliminated ? "text-accent/30 line-through" : "text-accent/70"
                        }`}
                    >
                    {p.username}
                    </span>
                    {isChampion && <span className="text-[14px] drop-shadow-[0_0_8px_rgba(var(--color-emerald-500),0.5)]">🏆</span>}
                    {isEliminated && !isChampion && (
                    <span className="text-[8px] text-red-500/30 tracking-[0.25em] font-black uppercase">
                        ELIMINATED
                    </span>
                    )}
                    {p.id === userId && !isChampion && !isEliminated && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <span className="text-[8px] text-yellow-500/60 tracking-[0.2em] font-black uppercase">YOU</span>
                    </div>
                    )}
                </div>
                );
            })}
            </div>
        </div>
      </div>
    </div>
  );
}
