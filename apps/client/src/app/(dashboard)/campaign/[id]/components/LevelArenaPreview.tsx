"use client";
// ─────────────────────────────────────────────────────────────────────────────
// LevelArenaPreview — resolves the correct arena scene for a given level ID
// and renders the ArenaCanvas with a polished iPhone-style chrome frame.
//
// Two display modes:
//   "preview" — looping demo animation shown in the brief / modal.
//   "loading" — same animation but with a "COMBAT IN PROGRESS" overlay.
//
// Accepts optional userScript to simulate the player's actual code in the
// mini arena, and optional enemyScript to override the built-in script.
// ─────────────────────────────────────────────────────────────────────────────
import React, { memo } from "react";
import { getSceneForLevel } from "./arenaScenes";
import { ArenaCanvas } from "./ArenaCanvas";
import { Loader2 } from "lucide-react";

interface LevelArenaPreviewProps {
  levelId: string;
  mode?: "preview" | "loading";
  compact?: boolean;
  userScript?: string;
  enemyScript?: string;
  onBattleEnd?: (winner: 'player' | 'enemy' | 'draw') => void;
  replayFrames?: any[];
  waitingForReplay?: boolean;
}

export const LevelArenaPreview = memo(function LevelArenaPreview({
  levelId,
  mode = "preview",
  compact = false,
  userScript,
  enemyScript,
  onBattleEnd,
  replayFrames,
  waitingForReplay,
}: LevelArenaPreviewProps) {
  const scene = getSceneForLevel(levelId);

  if (!scene) return null;

  const prefix = levelId.split('-')[0];
  const categoryName: Record<string, string> = {
    cond: 'CONDITIONALS',
    loop: 'LOOPS',
    arr: 'ARRAYS',
    ds: 'DATA STRUCTURES',
    rec: 'RECURSION',
    gfx: 'GRAPH THEORY',
  };
  const category = categoryName[prefix] ?? 'ARENA';

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-accent/20"
      style={{
        background: 'rgba(3,7,18,0.85)',
        boxShadow: '0 0 40px rgba(var(--accent-rgb),0.08), inset 0 0 30px rgba(var(--accent-rgb),0.02)',
      }}
    >
      {/* Top chrome bar — iPhone-style pill notch */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b border-accent/10"
        style={{ background: 'rgba(var(--accent-rgb),0.03)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500/50" />
          <span className="w-2 h-2 rounded-full bg-yellow-500/50" />
          <span className="w-2 h-2 rounded-full bg-green-500/50" />
        </div>
        <div
          className="text-[8px] font-mono font-bold tracking-[0.18em] text-accent/50 uppercase px-3 py-0.5 rounded-full border border-accent/10"
          style={{ background: 'rgba(var(--accent-rgb),0.04)' }}
        >
          {mode === "loading" ? "COMBAT IN PROGRESS" : "ARENA SIMULATION"}
        </div>
        <div className="hidden md:flex items-center gap-2 text-[8px] font-mono font-bold tracking-widest">
          <span className="text-[#22d3ee]/70">ALLY</span>
          <span className="text-accent/20">vs</span>
          <span className="text-red-500/70">ENEMY</span>
        </div>
      </div>

      {/* Arena Canvas */}
      <ArenaCanvas
        scene={scene}
        levelId={levelId}
        userScript={userScript}
        enemyScript={enemyScript}
        onBattleEnd={onBattleEnd}
        replayFrames={replayFrames}
        aspectRatio={compact ? 16 / 6 : 16 / 7}
        waitingForReplay={waitingForReplay}
      />


      {/* Bottom chrome */}
      <div
        className="flex items-center justify-between px-3 py-1 border-t border-accent/10"
        style={{ background: 'rgba(var(--accent-rgb),0.02)' }}
      >
        <span className="text-[7px] font-mono text-accent/30 tracking-[0.2em] uppercase">
          {category}
        </span>
        <span className="text-[7px] font-mono text-accent/30 tracking-[0.2em] uppercase">
          TACTICAL PREVIEW
        </span>
      </div>
    </div>
  );
});
