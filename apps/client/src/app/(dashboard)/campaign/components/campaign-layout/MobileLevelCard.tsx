import { memo, useCallback } from "react";
import { Check, Lock, Zap } from "lucide-react";

import { DIFFICULTY_CONFIG } from "../../constants/difficulty.constants";
import type { ApiLevelInfo } from "../../types/campaign.types";

export const MobileLevelCard = memo(function MobileLevelCard({
  level,
  onSelect,
}: {
  level: ApiLevelInfo;
  onSelect: (level: ApiLevelInfo) => void;
}) {
  const dc = DIFFICULTY_CONFIG[level.difficulty] ?? DIFFICULTY_CONFIG.EASY;
  const handleClick = useCallback(() => onSelect(level), [level, onSelect]);

  if (!level.unlocked) {
    return (
      <div className="relative flex items-stretch min-h-[100px] rounded-2xl border border-accent/10 overflow-hidden bg-bg-primary opacity-60">
        {/* Left bar — muted */}
        <div className="w-1 shrink-0 bg-accent/10" />
        <div className="flex-1 px-4 py-3 relative z-10">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <span className="text-[9px] tracking-[0.35em] text-accent/30 font-black uppercase block mb-1">
                ORDER {String(level.order).padStart(2, "0")}
              </span>
              <h3 className="text-[14px] font-black tracking-[0.12em] uppercase leading-tight text-accent/30">
                {level.title}
              </h3>
            </div>
            <Lock className="w-4 h-4 text-accent/25 shrink-0 mt-1" />
          </div>
          <p className="text-[10px] text-accent/20 tracking-[0.04em] leading-relaxed line-clamp-2 mb-3">
            {level.description}
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-[8px] font-black tracking-[0.25em] border rounded-full px-2.5 py-0.5 opacity-40 ${dc.text} ${dc.border} ${dc.bg}`}>
              {level.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-accent/20">
              <Zap className="w-3 h-3" /> +{level.pointsReward}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative flex items-stretch min-h-[100px] rounded-2xl border overflow-hidden cursor-pointer text-left w-full group transition-all duration-200 active:scale-[0.98]"
      style={{
        borderColor: level.completed ? "rgba(var(--accent-rgb),0.15)" : "rgba(var(--accent-rgb),0.25)",
        background: level.completed ? "rgba(var(--accent-rgb),0.02)" : "var(--bg-primary)",
      }}
    >
      {/* Difficulty accent left bar */}
      <div
        className="w-1 shrink-0 transition-all duration-300"
        style={{ background: dc.color, boxShadow: `0 0 8px ${dc.color}60` }}
      />

      <div className="flex-1 px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] tracking-[0.35em] text-accent/40 font-black uppercase block mb-1">
              ORDER {String(level.order).padStart(2, "0")}
            </span>
            <h3 className={`text-[14px] font-black tracking-[0.12em] uppercase leading-tight ${level.completed ? "text-accent/50" : "text-accent"}`}>
              {level.title}
            </h3>
          </div>
          {level.completed && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[8px] font-black tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
              <Check className="w-2.5 h-2.5" /> CLEAR
            </span>
          )}
        </div>

        <p className="text-[10px] text-accent/35 tracking-[0.04em] leading-relaxed line-clamp-2 mb-3">
          {level.description}
        </p>

        <div className="flex items-center justify-between">
          <span className={`text-[8px] font-black tracking-[0.25em] border rounded-full px-2.5 py-0.5 ${dc.text} ${dc.border} ${dc.bg}`}>
            {level.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-accent/50">
            <Zap className="w-3 h-3 text-yellow-400/80" />
            <span className="text-yellow-400/80">+{level.pointsReward}</span>
          </span>
        </div>
      </div>

      {/* Hover shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
});
