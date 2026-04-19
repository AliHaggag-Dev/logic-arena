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
}

export function TournamentCard({ tournament: t, index, userId, joining, onJoin }: Props) {
  const router = useRouter();
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const s = STATUS_STYLES[t.status] || STATUS_STYLES.WAITING;
  const isJoined = t.participants.some((p) => p.id === userId);
  const canJoin = t.status === "WAITING" && !isJoined && t.participants.length < 8;

  return (
    <div
      className="bg-card/60 rounded-xl p-6 border border-accent/10 backdrop-blur-md flex flex-col gap-4 group transition-all duration-300 hover:-translate-y-[3px] hover:border-accent/40 animate-[fadeIn_0.3s_ease_both]"
      style={{ boxShadow: 'var(--card-shadow)', animationDelay: `${index * 0.05}s` }}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-[14px] font-black tracking-[0.12em] text-accent mb-1.5 transition-all group-hover:drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]">
            {t.name}
          </div>
          <div className="text-[9px] text-accent/25 tracking-[0.15em]">
            BY {t.creator.username.toUpperCase()}
          </div>
        </div>
        {/* Status badge */}
        <span
          className="px-2.5 py-1 rounded text-[9px] font-extrabold tracking-[0.18em] whitespace-nowrap"
          style={{
            backgroundColor: s.bg,
            border: `1px solid ${s.border}`,
            color: s.color,
            boxShadow: s.glow,
          }}
        >
          {t.status === "IN_PROGRESS" ? "ACTIVE" : t.status}
        </span>
      </div>

      {/* Players bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[9px] text-accent/30 tracking-[0.15em]">COMBATANTS</span>
          <span className="text-[10px] text-accent/50 font-bold">{t.participants.length}/8</span>
        </div>
        <div className="h-[3px] rounded bg-accent/5 overflow-hidden">
          <div
            className="h-full rounded bg-gradient-to-r from-accent to-[#06b6d4] shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)] transition-all duration-300"
            style={{ width: `${(t.participants.length / 8) * 100}%` }}
          />
        </div>
      </div>

      {/* Participant avatars */}
      <div className="flex gap-1 flex-wrap">
        {t.participants.map((p) => (
          <span
            key={p.id}
            title={p.username}
            className="px-2 py-[2px] rounded-sm bg-accent/5 border border-accent/15 text-[9px] text-accent/50 tracking-[0.1em] font-semibold"
          >
            {p.username}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-accent/10">
        {canJoin && (
          <button
            onClick={() => onJoin(t.id)}
            disabled={joining === t.id}
            onMouseEnter={() => setHoveredBtn("join")}
            onMouseLeave={() => setHoveredBtn(null)}
            className={`flex-1 px-3.5 py-2 rounded-md text-[10px] font-extrabold tracking-[0.18em] font-mono transition-all duration-200 ${joining === t.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'
              } ${hoveredBtn === "join"
                ? "bg-yellow-500/15 border-yellow-500/60 text-yellow-500"
                : "bg-yellow-500/5 border-yellow-500/25 text-yellow-500/60"
              }`}
            style={{ borderWidth: "1px" }}
          >
            {joining === t.id ? "JOINING..." : "⚡ JOIN"}
          </button>
        )}
        <button
          onClick={() => router.push(`/tournaments/${t.id}`)}
          onMouseEnter={() => setHoveredBtn("view")}
          onMouseLeave={() => setHoveredBtn(null)}
          className={`flex-1 px-3.5 py-2 rounded-md text-[10px] font-extrabold tracking-[0.18em] font-mono cursor-pointer transition-all duration-200 ${hoveredBtn === "view"
            ? "bg-accent/15 border-accent/60 text-accent"
            : "bg-accent/5 border-accent/20 text-accent/60"
            }`}
          style={{ borderWidth: "1px" }}
        >
          ◉ VIEW BRACKET
        </button>
      </div>
    </div>
  );
}
