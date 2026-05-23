import React, { useState } from "react";
import { Tournament } from "../../types";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  tournament: Tournament;
  userId: string | null;
  onStart: () => void;
  isMobile?: boolean;
  isGuest?: boolean;
  onShowAuth: () => void;
  startError?: string | null;
}

export function TournamentHeader({ tournament, userId, onStart, isMobile, isGuest, onShowAuth, startError }: Props) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const router = useRouter();

  const isCreator = userId === tournament.creatorId;
  const statusColor =
    tournament.status === "WAITING"
      ? "var(--color-yellow-500)"
      : tournament.status === "IN_PROGRESS"
        ? "var(--accent)"
        : "var(--color-emerald-500)";

  return (
    <div className={`border-b border-accent/10 ${isMobile ? "pb-5 mb-6" : "pb-7 mb-8"} flex justify-between items-end flex-wrap gap-4`}>
      <div className={isMobile ? "w-full flex flex-col gap-3" : "flex flex-col gap-4"}>
        <button
          type="button"
          onClick={() => router.push('/tournaments')}
          className="w-max bg-transparent border border-accent/15 rounded px-2.5 py-1 md:px-3 hover:border-accent/40 hover:bg-accent/20 text-accent/70 cursor-pointer text-[9px] md:text-[10px] tracking-[0.25em] font-mono flex items-center gap-1.5 transition-all duration-200 uppercase"
        >
          ← <span className="md:hidden">TOURNAMENTS</span><span className="hidden md:inline">BACK TO TOURNAMENTS</span>
        </button>
        <div>
          <p className="text-[10px] tracking-[0.4em] text-accent/25 mb-2 uppercase font-bold">
            // TOURNAMENT_BRACKET_VIEW
          </p>
          <h1 className="m-0 text-[clamp(24px,4vw,40px)] font-black tracking-[0.18em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)] leading-tight uppercase">
            {tournament.name}
          </h1>
          <div className="flex gap-3 items-center mt-3">
          <span
            className="px-3 py-1 rounded text-[10px] font-black tracking-[0.2em] border backdrop-blur-sm uppercase"
            style={{
              backgroundColor: tournament.status === "WAITING" ? "rgba(var(--color-yellow-500),0.08)" : tournament.status === "IN_PROGRESS" ? "rgba(var(--accent-rgb),0.08)" : "rgba(var(--color-emerald-500),0.08)",
              borderColor: `${statusColor}44`,
              color: statusColor,
            }}
          >
            {tournament.status === "IN_PROGRESS" ? "LIVE" : tournament.status === "WAITING" ? "QUEUE" : "DONE"}
          </span>
          <span className="text-[10px] text-accent/30 tracking-[0.15em] font-bold">
            {tournament.participants.length}/8 COMBATANTS_DETECTED
          </span>
          </div>
        </div>
      </div>

      {isCreator && tournament.status === "WAITING" && (
        <div className={`flex flex-col items-end gap-2 ${isMobile ? "w-full mt-2" : ""}`}>
          <button
            onClick={isGuest ? onShowAuth : onStart}
            disabled={isGuest}
            onMouseEnter={() => !isGuest && setHoveredBtn("start")}
            onMouseLeave={() => setHoveredBtn(null)}
            className={`${isMobile ? "w-full py-4" : "px-8 py-3"} rounded-lg text-[11px] font-black tracking-[0.25em] font-mono transition-all duration-200 border relative overflow-hidden group ${isGuest 
                ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/20 cursor-not-allowed opacity-50"
                : hoveredBtn === "start"
                  ? "bg-emerald-500/20 border-emerald-500/70 text-emerald-500 drop-shadow-[0_0_12px_rgba(var(--color-emerald-500),0.5)] cursor-pointer"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500/70 cursor-pointer"
              }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isGuest ? (
                <>
                  <span className="flex items-center"><Lock size={12} /></span>
                  <span>LOGIN TO START</span>
                </>
              ) : (
                "▶ START_TOURNAMENT_SEQUENCE"
              )}
            </span>
          </button>
          {startError && (
            <div className={`text-[10px] text-red-500/80 font-mono tracking-widest uppercase font-bold animate-[fadeIn_0.2s_ease-out] ${isMobile ? 'text-center w-full mt-1' : 'mr-1'}`}>
              [ERR] {startError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
