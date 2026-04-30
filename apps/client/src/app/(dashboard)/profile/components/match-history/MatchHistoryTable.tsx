"use client";

import React from "react";
import { MatchEntry } from "../../types";
import { DesktopRow } from "./DesktopRow";
import { MobileCard } from "./MobileCard";
import { SkeletonRow } from "./SkeletonRow";
import { EmptyState } from "./EmptyState";

interface Props {
  loading:  boolean;
  history:  MatchEntry[];
  isMobile: boolean;
  isGuest?: boolean;
}

export function MatchHistoryTable({ loading, history, isMobile, isGuest }: Props) {
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[120px] rounded-xl border border-accent/10 bg-accent/5 animate-[shimmer_1.5s_infinite]"
              />
            ))
          : history.length > 0
            ? history.map((m) => <MobileCard key={m.id} m={m} isGuest={isGuest} />)
            : <EmptyState mobile />
        }
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-accent/10 overflow-hidden bg-card/50 backdrop-blur-md">
      <table className="w-full border-collapse text-[10px] tracking-[0.1em]">
        <thead>
          <tr className="border-b border-accent/10 bg-accent/[0.04]">
            {["DATE", "OPPONENT", "TYPE", "RESULT", "DURATION", "REPLAY"].map((h, i) => (
              <th
                key={h}
                className={`p-[12px_16px] text-left text-[9px] font-bold tracking-[0.22em] text-accent/35 uppercase
                  ${i === 0 || i === 4 ? "hidden lg:table-cell" : ""}
                  ${i === 2           ? "hidden sm:table-cell" : ""}
                  ${i === 5           ? "text-right"           : ""}
                `}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : history.length > 0
              ? history.map((m, idx) => (
                  <DesktopRow
                    key={m.id}
                    m={m}
                    isLast={idx === history.length - 1}
                    isGuest={isGuest}
                  />
                ))
              : <EmptyState mobile={false} />
          }
        </tbody>
      </table>
    </div>
  );
}
