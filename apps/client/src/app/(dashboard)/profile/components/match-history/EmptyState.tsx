"use client";

import React from "react";

interface Props {
  mobile?: boolean;
}

export function EmptyState({ mobile }: Props) {
  if (mobile) {
    return (
      <div className="flex items-center justify-center h-24 border border-dashed border-accent/20 rounded-xl bg-accent/[0.02]">
        <span className="text-accent/30 text-[10px] tracking-[0.2em] font-mono font-bold">
          NO MATCHES FOUND
        </span>
      </div>
    );
  }

  return (
    <tr>
      <td colSpan={6} className="p-8 text-center">
        <span className="text-[10px] text-accent/30 font-bold tracking-[0.3em]">
          NO MATCH DATA AVAILABLE
        </span>
      </td>
    </tr>
  );
}
