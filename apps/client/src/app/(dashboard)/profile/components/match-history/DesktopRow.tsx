"use client";

import React from "react";
import { MatchEntry } from "../../types";
import { fmtDate, fmtDuration } from "../../utils";
import { ResultBadge } from "../ui/ResultBadge";
import { ReplayButton } from "./ReplayButton";

interface Props {
  m: MatchEntry;
  isLast: boolean;
  isGuest?: boolean;
}

export function DesktopRow({ m, isLast, isGuest }: Props) {
  const isWin = m.result === "WIN";
  return (
    <tr
      className="transition-colors duration-200 hover:bg-accent/[0.03]"
      style={{ borderBottom: isLast ? "none" : "1px solid rgba(var(--accent-rgb),0.06)" }}
    >
      <td className="hidden lg:table-cell p-[12px_16px] text-accent/45">{fmtDate(m.date)}</td>
      <td className="p-[12px_16px] text-accent/90 font-bold truncate max-w-[200px]">{m.opponent}</td>
      <td className="hidden sm:table-cell p-[12px_16px] text-accent/70">{m.type}</td>
      <td className="p-[12px_16px]"><ResultBadge isWin={isWin} /></td>
      <td className="hidden lg:table-cell p-[12px_16px] text-accent/45">{fmtDuration(m.duration)}</td>
      <td className="p-[12px_16px] text-right">
        <ReplayButton matchId={m.id} isGuest={isGuest} />
      </td>
    </tr>
  );
}
