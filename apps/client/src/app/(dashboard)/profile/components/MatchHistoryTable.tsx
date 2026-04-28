import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MatchEntry } from "../types";
import { fmtDuration, fmtDate } from "../utils";

function SkeletonRow() {
  return (
    <tr>
      <td className="hidden lg:table-cell p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-3/4 bg-accent/5" /></td>
      <td className="p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-full max-w-[120px] bg-accent/5" /></td>
      <td className="hidden sm:table-cell p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-20 bg-accent/5" /></td>
      <td className="p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-12 bg-accent/5" /></td>
      <td className="hidden lg:table-cell p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-16 bg-accent/5" /></td>
      <td className="p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-16 ml-auto bg-accent/5" /></td>
    </tr>
  );
}

interface ReplayButtonProps {
  id: string;
  isGuest?: boolean;
}

function ReplayButton({ id, isGuest }: ReplayButtonProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => !isGuest && router.push(`/replay/${id}`)}
      disabled={isGuest}
      className={`inline-flex items-center gap-[5px] p-[4px_10px] rounded text-[9px] font-bold tracking-[0.14em] font-mono whitespace-nowrap transition-all duration-200 ${isGuest ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
      style={{
        border: `1px solid ${hovered && !isGuest ? "rgba(var(--accent-rgb),0.7)" : "rgba(var(--accent-rgb),0.3)"}`,
        background: hovered && !isGuest ? "rgba(var(--accent-rgb),0.16)" : "rgba(var(--accent-rgb),0.06)",
        color: "var(--accent)",
        boxShadow: hovered && !isGuest ? "0 0 8px rgba(var(--accent-rgb),0.25)" : "none",
      }}
      onMouseEnter={() => !isGuest && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isGuest ? "LOCKED" : "WATCH REPLAY"}
    </button>
  );
}

interface TableRowProps {
  m: MatchEntry;
  isLast: boolean;
  isGuest?: boolean;
}

function MatchRow({ m, isLast, isGuest }: TableRowProps) {
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
      <td className="hidden lg:table-cell px-4 py-3 sm:p-[12px_16px] text-accent/45">{fmtDate(m.date)}</td>
      <td className="px-3 sm:px-4 py-3 sm:p-[12px_16px] text-accent/90 font-bold">
        <div className="flex flex-col gap-1 sm:block">
          <span className="truncate max-w-[100px] sm:max-w-[200px] block sm:inline">{m.opponent}</span>
          <span className="text-[8px] text-accent/30 sm:hidden">{m.type}</span>
        </div>
      </td>
      <td className="hidden sm:table-cell px-4 py-3 sm:p-[12px_16px] text-accent/70">{m.type}</td>
      <td className="px-3 sm:px-4 py-3 sm:p-[12px_16px]">
        <span
          className="inline-block p-[3px_8px] sm:p-[3px_10px] rounded text-[9px] sm:text-[10px] font-bold tracking-[0.16em]"
          style={{
            backgroundColor: isWin ? "rgba(var(--color-emerald-500),0.12)" : "rgba(var(--color-red-500),0.12)",
            border: isWin ? "1px solid rgba(var(--color-emerald-500),0.35)" : "1px solid rgba(var(--color-red-500),0.35)",
            color: isWin ? "#4ade80" : "#f87171",
            textShadow: isWin ? "0 0 8px rgba(var(--color-emerald-500),0.4)" : "0 0 8px rgba(var(--color-red-500),0.4)",
          }}
        >
          {isWin ? "WIN" : "LOSS"}
        </span>
      </td>
      <td className="hidden lg:table-cell px-4 py-3 sm:p-[12px_16px] text-accent/45">{fmtDuration(m.duration)}</td>
      <td className="px-3 sm:px-4 py-3 sm:p-[12px_16px] text-right">
        <ReplayButton id={m.id} isGuest={isGuest} />
      </td>
    </tr>
  );
}

interface Props {
  loading: boolean;
  history: MatchEntry[];
  isMobile: boolean;
  isGuest?: boolean;
}

export function MatchHistoryTable({ loading, history, isMobile, isGuest }: Props) {

  const DesktopTable = (
    <div className="rounded-[10px] border border-accent/10 overflow-hidden bg-card/50 backdrop-blur-md">
      <table className="w-full border-collapse text-[10px] tracking-[0.1em]">
        <thead>
          <tr className="border-b border-accent/10 bg-accent/[0.04]">
            <th className="p-[12px_16px] text-left text-[9px] font-bold tracking-[0.22em] text-accent/35 uppercase">DATE</th>
            <th className="p-[12px_16px] text-left text-[9px] font-bold tracking-[0.22em] text-accent/35 uppercase">OPPONENT</th>
            <th className="p-[12px_16px] text-left text-[9px] font-bold tracking-[0.22em] text-accent/35 uppercase">TYPE</th>
            <th className="p-[12px_16px] text-left text-[9px] font-bold tracking-[0.22em] text-accent/35 uppercase">RESULT</th>
            <th className="p-[12px_16px] text-left text-[9px] font-bold tracking-[0.22em] text-accent/35 uppercase">DURATION</th>
            <th className="p-[12px_16px] text-right text-[9px] font-bold tracking-[0.22em] text-accent/35 uppercase z-10 w-24">REPLAY</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-3/4 bg-accent/5" /></td>
                <td className="p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-full max-w-[120px] bg-accent/5" /></td>
                <td className="p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-20 bg-accent/5" /></td>
                <td className="p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-12 bg-accent/5" /></td>
                <td className="p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-16 bg-accent/5" /></td>
                <td className="p-[12px_16px]"><div className="h-[12px] rounded animate-[shimmer_1.5s_infinite] w-16 ml-auto bg-accent/5" /></td>
              </tr>
            ))
          ) : history.length > 0 ? (
            history.map((m, idx) => {
              const isWin = m.result === "WIN";
              const isLast = idx === history.length - 1;
              return (
                <tr
                  key={m.id}
                  className="transition-colors duration-200 hover:bg-accent/[0.03]"
                  style={{ borderBottom: isLast ? "none" : "1px solid rgba(var(--accent-rgb),0.06)" }}
                >
                  <td className="p-[12px_16px] text-accent/45">{fmtDate(m.date)}</td>
                  <td className="p-[12px_16px] text-accent/90 font-bold truncate max-w-[200px]">{m.opponent}</td>
                  <td className="p-[12px_16px] text-accent/70">{m.type}</td>
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
                      {isWin ? "WIN" : "LOSS"}
                    </span>
                  </td>
                  <td className="p-[12px_16px] text-accent/45">{fmtDuration(m.duration)}</td>
                  <td className="p-[12px_16px] text-right">
                    <ReplayButton id={m.id} isGuest={isGuest} />
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={6} className="p-[48px_16px] text-center text-accent/20 text-[11px] tracking-[0.18em]">
                NO MATCHES HISTORY FOUND.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const router = useRouter();

  const MobileList = (
    <div className="flex flex-col gap-3">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[120px] rounded-xl border border-accent/10 bg-accent/5 animate-[shimmer_1.5s_infinite]" />
        ))
      ) : history.length > 0 ? (
        history.map((m) => {
          const isWin = m.result === "WIN";
          return (
            <div key={m.id} className="flex flex-col p-4 border border-accent/20 bg-card rounded-xl gap-3 shadow-md relative">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-base text-accent">{m.opponent}</span>
                  <span className="text-[10px] text-accent/70">{fmtDate(m.date)} • {m.type}</span>
                  <span className="text-[10px] text-accent/70">Duration: {fmtDuration(m.duration)}</span>
                </div>
                <span
                  className="inline-block p-[4px_10px] rounded text-[10px] font-bold tracking-[0.16em]"
                  style={{
                    backgroundColor: isWin ? "rgba(var(--color-emerald-500),0.12)" : "rgba(var(--color-red-500),0.12)",
                    border: isWin ? "1px solid rgba(var(--color-emerald-500),0.35)" : "1px solid rgba(var(--color-red-500),0.35)",
                    color: isWin ? "#4ade80" : "#f87171",
                    textShadow: isWin ? "0 0 8px rgba(var(--color-emerald-500),0.4)" : "0 0 8px rgba(var(--color-red-500),0.4)",
                  }}
                >
                  {isWin ? "WIN" : "LOSS"}
                </span>
              </div>
              <div className="w-full mt-2 border-t border-accent/10 pt-3">
                <button
                  type="button"
                  onClick={() => !isGuest && router.push(`/replay/${m.id}`)}
                  disabled={isGuest}
                  className={`w-full h-[44px] flex items-center justify-center border font-bold tracking-[0.2em] text-[10px] rounded-lg transition-transform active:scale-95 shadow-[0_0_8px_rgba(var(--accent-rgb),0.15)] uppercase ${isGuest ? 'bg-accent/5 border-accent/10 text-accent/20 cursor-not-allowed' : 'bg-accent/10 border-accent/40 text-accent'}`}
                >
                  {isGuest ? "REPLAY LOCKED" : "WATCH REPLAY"}
                </button>
              </div>
            </div>
          )
        })
      ) : (
        <div className="p-8 text-center border border-accent/10 rounded-xl bg-accent/5 text-[10px] text-accent/30 tracking-widest uppercase">
          No match history found.
        </div>
      )}
    </div>
  );

  return (
    <div className={isMobile ? "w-full" : ""}>
      {isMobile ? MobileList : DesktopTable}
    </div>
  );
}
