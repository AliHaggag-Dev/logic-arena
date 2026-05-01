import React from "react";
import { EFF_OPTIMAL_SCORE, EFF_MODERATE_SCORE } from "../../types";

export const EfficiencyBadge = ({ score }: { score: number }) => {
  const cssVar =
    score >= EFF_OPTIMAL_SCORE
      ? "var(--eff-optimal)"
      : score >= EFF_MODERATE_SCORE
      ? "var(--eff-moderate)"
      : "var(--eff-low)";

  const label =
    score >= EFF_OPTIMAL_SCORE
      ? "OPTIMAL"
      : score >= EFF_MODERATE_SCORE
      ? "MODERATE"
      : "LOW";

  return (
    <div className="flex items-center gap-2 justify-end">
      <span
        className="text-xs font-black tracking-wider"
        style={{ color: cssVar }}
      >
        {score.toFixed(1)}
      </span>
      <span
        className="text-[9px] font-bold tracking-[0.15em] px-1.5 py-0.5 border rounded-sm"
        style={{
          color: cssVar,
          borderColor: `color-mix(in srgb, ${cssVar} 40%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${cssVar} 8%, transparent)`,
        }}
      >
        {label}
      </span>
    </div>
  );
};
