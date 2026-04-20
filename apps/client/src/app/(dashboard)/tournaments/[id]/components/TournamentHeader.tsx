import React, { useState } from "react";
import { Tournament } from "../types";

interface Props {
  tournament: Tournament;
  userId: string | null;
  onStart: () => void;
  isMobile?: boolean;
}

export function TournamentHeader({ tournament, userId, onStart, isMobile }: Props) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const isCreator = userId === tournament.creatorId;
  const statusColor =
    tournament.status === "WAITING"
      ? "var(--color-yellow-500)"
      : tournament.status === "IN_PROGRESS"
        ? "var(--accent)"
        : "var(--color-emerald-500)";

  return (
    <div className={`border-b border-accent/10 ${isMobile ? "pb-5 mb-6" : "pb-7 mb-8"} flex justify-between items-end flex-wrap gap-4`}>
      <div className={isMobile ? "w-full" : ""}>
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

      {isCreator && tournament.status === "WAITING" && (
        <button
          onClick={onStart}
          onMouseEnter={() => setHoveredBtn("start")}
          onMouseLeave={() => setHoveredBtn(null)}
          className={`${isMobile ? "w-full py-4" : "px-8 py-3"} rounded-lg text-[11px] font-black tracking-[0.25em] font-mono cursor-pointer transition-all duration-200 border relative overflow-hidden group ${hoveredBtn === "start"
              ? "bg-emerald-500/20 border-emerald-500/70 text-emerald-500 drop-shadow-[0_0_12px_rgba(var(--color-emerald-500),0.5)]"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500/70"
            }`}
        >
          <span className="relative z-10">▶ START_TOURNAMENT_SEQUENCE</span>
        </button>
      )}
    </div>
  );
}
