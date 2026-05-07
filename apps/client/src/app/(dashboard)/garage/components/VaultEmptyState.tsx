"use client";

import React from "react";

interface VaultEmptyStateProps {
  categoryLabel: string;
}

export function VaultEmptyState({ categoryLabel }: VaultEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-36 border border-dashed border-accent/20 rounded-2xl bg-[rgba(var(--accent-rgb),0.02)] mx-1">
      <p className="text-sm tracking-widest text-accent/40 font-mono font-bold">
        NO ITEMS UNLOCKED
      </p>
      <p className="text-[10px] tracking-wider text-accent/30 mt-2 font-mono">
        Visit the Black Market for {categoryLabel.toLowerCase()}
      </p>
    </div>
  );
}
