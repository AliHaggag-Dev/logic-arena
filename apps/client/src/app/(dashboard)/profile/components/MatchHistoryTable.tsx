import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MatchEntry } from "../types";
import { fmtDuration, fmtDate } from "../utils";

function SkeletonRow() {
  return (
    <tr>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="p-[12px_16px]">
          <div
            className="h-[12px] rounded animate-[shimmer_1.5s_infinite]"
            style={{
              width: i === 1 ? "60%" : "80%",
              background: "linear-gradient(90deg, rgba(var(--accent-rgb),0.04) 0%, rgba(var(--accent-rgb),0.12) 50%, rgba(var(--accent-rgb),0.04) 100%)",
              backgroundSize: "200% 100%",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

interface ReplayButtonProps {
  id: string;
}

function ReplayButton({ id }: ReplayButtonProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => router.push(`/replay/${id}`)}
      className="inline-flex items-center gap-[5px] p-[4px_10px] rounded text-[9px] font-bold tracking-[0.14em] cursor-pointer font-mono whitespace-nowrap transition-all duration-200"
      style={{
        border: `1px solid ${hovered ? "rgba(var(--accent-rgb),0.7)" : "rgba(var(--accent-rgb),0.3)"}`,
        background: hovered ? "rgba(var(--accent-rgb),0.16)" : "rgba(var(--accent-rgb),0.06)",
        color: "var(--accent)",
        boxShadow: hovered ? "0 0 8px rgba(var(--accent-rgb),0.25)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ▶ REPLAY
    </button>
  );
}

interface TableRowProps {
  m: MatchEntry;
  isLast: boolean;
}

function MatchRow({ m, isLast }: TableRowProps) {
  const [hovered, setHovered] = useState(false);
  const isWin = m.result === "WIN";

  return (
    <tr
      className="transition-colors duration-200"
      style={{
        borderBottom: isLast ? "none" : "1px solid rgba(var(--accent-rgb),0.06)",
        backgroundColor: hovered ? "rgba(var(--accent-rgb),0.03)" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td className="p-[12px_16px] text-accent/45">{fmtDate(m.date)}</td>
      <td className="p-[12px_16px] text-accent/90 font-bold">{m.opponent}</td>
      <td className="p-[12px_16px] text-accent/40">{m.type}</td>
      <td className="p-[12px_16px]">
        <span
          className="inline-block p-[3px_10px] rounded text-[10px] font-bold tracking-[0.16em]"
          style={{
            backgroundColor: isWin ? "rgba(var(--color-emerald-500),0.12)" : "rgba(var(--color-red-500),0.12)",
            border: isWin ? "1px solid rgba(var(--color-emerald-500),0.35)" : "1px solid rgba(var(--color-red-500),0.35)",
            color: isWin ? "#4ade80" : "#f87171",
            textShadow: isWin ? "0 0 8px rgba(var(--color-emerald-500),0.4)" : "0 0 8px rgba(var(--color-red-500),0.4)",
          }}
        >
          {m.result}
        </span>
      </td>
      <td className="p-[12px_16px] text-accent/45">{fmtDuration(m.duration)}</td>
      <td className="p-[12px_16px]">
        <ReplayButton id={m.id} />
      </td>
    </tr>
  );
}

interface Props {
  loading: boolean;
  history: MatchEntry[];
}

export function MatchHistoryTable({ loading, history }: Props) {
  return (
    <div className="rounded-[10px] border border-accent/10 overflow-hidden bg-card/50 backdrop-blur-md">
      <table className="w-full border-collapse text-[10px] tracking-[0.1em]">
        <thead>
          <tr className="border-b border-accent/10 bg-accent/[0.04]">
            {["Date", "Opponent", "Type", "Result", "Duration", "Replay"].map((h) => (
              <th
                key={h}
                className="p-[12px_16px] text-left text-[9px] font-bold tracking-[0.22em] text-accent/35 uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : history.length > 0 ? (
            history.map((m, idx) => (
              <MatchRow key={m.id} m={m} isLast={idx === history.length - 1} />
            ))
          ) : (
            <tr>
              <td
                colSpan={6}
                className="p-[48px_16px] text-center text-accent/20 text-[11px] tracking-[0.18em]"
              >
                NO MATCH RECORDS FOUND. DEPLOY TO BATTLE LOBBY TO BEGIN.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
