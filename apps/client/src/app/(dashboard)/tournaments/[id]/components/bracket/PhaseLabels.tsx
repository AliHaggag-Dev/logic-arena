import React from "react";
import { TMatch } from "../../../types";
import { ROUND_LABELS } from "./bracket-utils";

interface Props {
  rounds: TMatch[][];
  totalRounds: number;
  r_G: number;
  m_W: number;
}

export function PhaseLabels({ rounds, totalRounds, r_G, m_W }: Props) {
  const labels = ROUND_LABELS[totalRounds] ?? ROUND_LABELS[2];
  return (
    <div className="flex mb-4 pl-[30px]" style={{ gap: `${r_G}px` }}>
      {rounds.map((_, ri) => (
        <div
          key={ri}
          style={{ width: `${m_W}px` }}
          className="text-center text-[9px] md:text-[10px] font-black tracking-[0.4em] text-accent/40 uppercase relative"
        >
          {labels[ri + 1] ?? `PHASE_${ri + 1}`}
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-8 h-[2px] bg-accent/20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
