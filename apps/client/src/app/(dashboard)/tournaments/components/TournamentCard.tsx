import React, { useState } from "react";
import { useRouter } from "next/navigation";

export interface Participant {
  id: string;
  username: string;
}
export interface Creator {
  id: string;
  username: string;
}
export interface Tournament {
  id: string;
  name: string;
  status: string;
  creatorId: string;
  creator: Creator;
  participants: Participant[];
  winnerId: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  WAITING: {
    color: "var(--color-yellow-500)",
    bg: "rgba(var(--color-yellow-500),0.08)",
    border: "rgba(var(--color-yellow-500),0.35)",
    glow: "0 0 10px rgba(var(--color-yellow-500),0.25)",
  },
  IN_PROGRESS: {
    color: "var(--accent)",
    bg: "rgba(var(--accent-rgb),0.08)",
    border: "rgba(var(--accent-rgb),0.35)",
    glow: "0 0 10px rgba(var(--accent-rgb),0.25)",
  },
  COMPLETED: {
    color: "var(--color-emerald-500)",
    bg: "rgba(var(--color-emerald-500),0.08)",
    border: "rgba(var(--color-emerald-500),0.35)",
    glow: "0 0 10px rgba(var(--color-emerald-500),0.25)",
  },
};

interface Props {
  tournament: Tournament;
  index: number;
  userId: string | null;
  joining: string | null;
  onJoin: (id: string) => void;
  isMobile?: boolean;
  isGuest?: boolean;
}

export function TournamentCard({ tournament: t, index, userId, joining, onJoin, isMobile, isGuest }: Props) {
  const router = useRouter();
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const s = STATUS_STYLES[t.status] || STATUS_STYLES.WAITING;
  const isJoined = t.participants.some((p) => p.id === userId);
  const canJoin = t.status === "WAITING" && !isJoined && t.participants.length < 8;

  return (
    <div
      className={`relative bg-card/40 rounded-xl ${isMobile ? "p-5" : "p-6"} border border-accent/10 backdrop-blur-md flex flex-col gap-4 group transition-all duration-300 active:scale-[0.98] ${isMobile ? "shadow-[inset_3px_0_0_0_var(--accent)]" : "hover:-translate-y-[3px] hover:border-accent/40 hover:shadow-[0_8px_32px_rgba(var(--accent-rgb),0.12)]"}`}
      style={{ animation: `fadeIn 0.3s ease both`, animationDelay: `${index * 0.05}s` }}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className={`${isMobile ? "text-[13px]" : "text-[14px]"} font-black tracking-[0.15em] text-accent mb-1.5 transition-all group-hover:drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)] uppercase leading-tight`}>
            {t.name}
          </div>
          <div className="text-[8px] text-accent/25 tracking-[0.2em] font-bold uppercase">
            ID: {t.id.slice(0, 8)} // OP: {t.creator.username.toUpperCase()}
          </div>
        </div>
        {/* Status badge */}
        <span
          className={`${isMobile ? "px-2 py-0.5 text-[8px]" : "px-2.5 py-1 text-[9px]"} rounded font-black tracking-[0.2em] whitespace-nowrap border uppercase backdrop-blur-md transition-all duration-300`}
          style={{
            backgroundColor: s.bg,
            borderColor: s.border,
            color: s.color,
            boxShadow: isMobile ? "none" : s.glow,
          }}
        >
          {t.status === "IN_PROGRESS" ? "LIVE" : t.status === "WAITING" ? "QUEUE" : "DONE"}
        </span>
      </div>

      {/* Players bar */}
      <div className="bg-accent/5 p-3 rounded-lg border border-accent/5">
        <div className="flex justify-between mb-2">
          <span className="text-[8px] text-accent/30 tracking-[0.2em] font-bold uppercase">COMBATANTS_SYNC</span>
          <span className="text-[10px] text-accent/60 font-black tracking-widest">{t.participants.length}/8</span>
        </div>
        <div className={`h-[4px] rounded-full bg-accent/10 overflow-hidden relative`}>
            {/* Pulsing bar head */}
            <div 
                className="absolute h-full right-0 w-4 bg-white/20 blur-sm"
                style={{ left: `${(t.participants.length / 8) * 100}%`, transform: 'translateX(-100%)' }}
            />
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-[#06b6d4] shadow-[0_0_12px_rgba(var(--accent-rgb),0.5)] transition-all duration-500 ease-out"
            style={{ width: `${(t.participants.length / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* Participant avatars */}
      <div className="flex gap-1.5 flex-wrap">
        {t.participants.map((p) => (
          <span
            key={p.id}
            title={p.username}
            className="px-2 py-1 rounded-md bg-accent/5 border border-accent/10 text-[8px] text-accent/50 tracking-[0.1em] font-black uppercase hover:bg-accent/10 transition-colors"
          >
            {p.username}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className={`flex gap-2 mt-auto ${isMobile ? "pt-2" : "pt-3"} border-t border-accent/5`}>
        {canJoin && (
          <button
            onClick={() => onJoin(t.id)}
            disabled={joining === t.id}
            onMouseEnter={() => setHoveredBtn("join")}
            onMouseLeave={() => setHoveredBtn(null)}
            className={`flex-1 px-4 py-3 rounded-lg text-[10px] font-black tracking-[0.25em] font-mono transition-all duration-200 border relative overflow-hidden group active:scale-[0.95] cursor-pointer ${
              joining === t.id ? 'opacity-50 cursor-wait' : ''
              } ${isGuest
                ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-500/40"
                : hoveredBtn === "join"
                  ? "bg-yellow-500/15 border-yellow-500/60 text-yellow-500 shadow-[0_0_15px_rgba(var(--color-yellow-500),0.15)]"
                  : "bg-yellow-500/5 border-yellow-500/20 text-yellow-500/60"
              }`}
          >
            <span className="relative z-10">
              {isGuest ? "JOIN" : joining === t.id ? "SYNCING..." : "JOIN"}
            </span>
          </button>
        )}
        <button
          onClick={() => router.push(`/tournaments/${t.id}`)}
          onMouseEnter={() => setHoveredBtn("view")}
          onMouseLeave={() => setHoveredBtn(null)}
          className={`flex-1 px-4 py-3 rounded-lg text-[10px] font-black tracking-[0.25em] font-mono cursor-pointer transition-all duration-200 border relative overflow-hidden group active:scale-[0.95] ${hoveredBtn === "view"
            ? "bg-accent/15 border-accent/50 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]"
            : "bg-accent/5 border-accent/10 text-accent/50"
            }`}
        >
          <span className="relative z-10">VIEW TOURNAMENT</span>
        </button>
      </div>
    </div>
  );
}
