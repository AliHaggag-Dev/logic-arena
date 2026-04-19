import React, { useState } from "react";
import { Tournament } from "../types";

interface Props {
  tournament: Tournament;
  userId: string | null;
  onStart: () => void;
}

export function TournamentHeader({ tournament, userId, onStart }: Props) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const isCreator = userId === tournament.creatorId;
  const statusColor =
    tournament.status === "WAITING"
      ? "var(--color-yellow-500)"
      : tournament.status === "IN_PROGRESS"
        ? "var(--accent)"
        : "var(--color-emerald-500)";

  return (
    <div className="border-b border-accent/10 pb-7 mb-8 flex justify-between items-end flex-wrap gap-4">
      <div>
        <p className="text-[10px] tracking-[0.4em] text-accent/25 mb-2 uppercase">
          // TOURNAMENT_BRACKET
        </p>
        <h1 className="m-0 text-[clamp(24px,4vw,40px)] font-black tracking-[0.2em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)] shadow-accent/40 leading-tight">
          {tournament.name}
        </h1>
        <div className="flex gap-3 items-center mt-2.5">
          <span
            className="px-3 py-1 rounded text-[10px] font-extrabold tracking-[0.2em]"
            style={{
              backgroundColor: tournament.status === "WAITING" ? "rgba(var(--color-yellow-500),0.08)" : tournament.status === "IN_PROGRESS" ? "rgba(var(--accent-rgb),0.08)" : "rgba(var(--color-emerald-500),0.08)",
              border: `1px solid ${statusColor}55`,
              color: statusColor,
            }}
          >
            {tournament.status === "IN_PROGRESS" ? "ACTIVE" : tournament.status}
          </span>
          <span className="text-[10px] text-accent/30 tracking-[0.12em]">
            {tournament.participants.length} COMBATANTS
          </span>
        </div>
      </div>

      {isCreator && tournament.status === "WAITING" && (
        <button
          onClick={onStart}
          onMouseEnter={() => setHoveredBtn("start")}
          onMouseLeave={() => setHoveredBtn(null)}
          className={`px-8 py-3 rounded-lg text-[11px] font-black tracking-[0.25em] font-mono cursor-pointer transition-all duration-200 ${hoveredBtn === "start"
              ? "bg-emerald-500/20 border border-emerald-500/70 text-emerald-500 drop-shadow-[0_0_12px_rgba(var(--color-emerald-500),0.5)] shadow-[0_0_24px_rgba(var(--color-emerald-500),0.15)]"
              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500/70"
            }`}
        >
          ▶ START TOURNAMENT
        </button>
      )}
    </div>
  );
}
