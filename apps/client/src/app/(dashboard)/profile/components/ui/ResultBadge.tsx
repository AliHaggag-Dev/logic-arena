"use client";

import React from "react";

interface Props {
  isWin: boolean;
}

export function ResultBadge({ isWin }: Props) {
  return (
    <span
      className={`px-2 py-1 rounded-[4px] text-[8px] font-bold tracking-[0.2em] font-mono border ${
        isWin
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      }`}
    >
      {isWin ? "WIN" : "LOSS"}
    </span>
  );
}
