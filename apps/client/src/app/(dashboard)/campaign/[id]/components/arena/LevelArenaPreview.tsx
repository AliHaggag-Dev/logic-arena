"use client";
import React, { memo } from "react";
import { getSceneForLevel } from "./scenes";
import { ArenaCanvas } from "./ArenaCanvas";
import type { CampaignFrame, FightResult } from "../../../hooks/useCampaignFight";
import { BattleHUD } from "../layout/BattleHUD";

const HUD_UPDATE_INTERVAL_MS = 100;
const DEFAULT_STAT_VALUE = 100;
const DEFAULT_MAX_TICKS = 1500;

interface BattleHUDSnapshot {
  playerHealth: number;
  enemyHealth: number;
  playerEnergy: number;
  tick: number;
}

interface LevelArenaPreviewProps {
  levelId: string;
  mode?: "preview" | "loading";
  compact?: boolean;
  userScript?: string;
  enemyScript?: string;
  onBattleEnd?: (winner: 'player' | 'enemy' | 'draw') => void;
  latestFrameRef?: React.MutableRefObject<CampaignFrame | null>;
  isReplaying?: boolean;
  fightResult?: FightResult | null;
  waitingForReplay?: boolean;
  isMobile?: boolean;
  maxTicks?: number;
}

export const LevelArenaPreview = memo(function LevelArenaPreview({
  levelId,
  mode = "preview",
  compact = false,
  userScript,
  enemyScript,
  onBattleEnd,
  latestFrameRef,
  isReplaying,
  fightResult,
  waitingForReplay,
  isMobile = false,
  maxTicks = DEFAULT_MAX_TICKS,
}: LevelArenaPreviewProps) {
  const scene = getSceneForLevel(levelId);
  const [hudSnapshot, setHudSnapshot] = React.useState<BattleHUDSnapshot>({
    playerHealth: DEFAULT_STAT_VALUE,
    enemyHealth: DEFAULT_STAT_VALUE,
    playerEnergy: DEFAULT_STAT_VALUE,
    tick: 0,
  });

  React.useEffect(() => {
    if (mode !== "loading") {
      setHudSnapshot({
        playerHealth: DEFAULT_STAT_VALUE,
        enemyHealth: DEFAULT_STAT_VALUE,
        playerEnergy: DEFAULT_STAT_VALUE,
        tick: 0,
      });
      return;
    }

    const updateHud = (): void => {
      const frame = latestFrameRef?.current;
      const player = frame?.robots?.find((robot) => robot.id === "player");
      const enemy = frame?.robots?.find((robot) => robot.id === "enemy");
      setHudSnapshot({
        playerHealth: player?.health ?? DEFAULT_STAT_VALUE,
        enemyHealth: enemy?.health ?? DEFAULT_STAT_VALUE,
        playerEnergy: player?.energy ?? DEFAULT_STAT_VALUE,
        tick: frame?.tick ?? 0,
      });
    };

    updateHud();
    const interval = window.setInterval(updateHud, HUD_UPDATE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [latestFrameRef, mode]);

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
        background: 'var(--bg-primary)',
        boxShadow: '0 0 40px rgba(var(--accent-rgb),0.08), inset 0 0 30px rgba(var(--accent-rgb),0.02)',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b border-accent/10"
        style={{ background: 'rgba(var(--accent-rgb),0.03)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent/55" />
          <span className="w-2 h-2 rounded-full bg-accent/35" />
          <span className="w-2 h-2 rounded-full bg-accent/20" />
        </div>
        <div
          className="text-[8px] font-mono font-bold tracking-[0.18em] text-accent/50 uppercase px-3 py-0.5 rounded-full border border-accent/10"
          style={{ background: 'rgba(var(--accent-rgb),0.04)' }}
        >
          {mode === "loading" ? "COMBAT IN PROGRESS" : "ARENA SIMULATION"}
        </div>
        <div className="hidden md:flex items-center gap-2 text-[8px] font-mono font-bold tracking-widest">
          <span className="text-accent/70">ALLY</span>
          <span className="text-accent/20">vs</span>
          <span className="text-accent/45">ENEMY</span>
        </div>
      </div>

      {mode === "loading" && isMobile && (
        <div className="px-2 pt-2">
          <BattleHUD
            playerHealth={hudSnapshot.playerHealth}
            enemyHealth={hudSnapshot.enemyHealth}
            playerEnergy={hudSnapshot.playerEnergy}
            tick={hudSnapshot.tick}
            maxTicks={maxTicks}
            isMobile
          />
        </div>
      )}

      <div className="relative">
        <ArenaCanvas
          scene={scene}
          levelId={levelId}
          userScript={userScript}
          enemyScript={enemyScript}
          onBattleEnd={onBattleEnd}
          latestFrameRef={latestFrameRef}
          isReplaying={isReplaying}
          fightResult={fightResult}
          aspectRatio={compact ? 16 / 6 : 16 / 7}
          waitingForReplay={waitingForReplay}
        />

        {mode === "loading" && !isMobile && (
          <BattleHUD
            playerHealth={hudSnapshot.playerHealth}
            enemyHealth={hudSnapshot.enemyHealth}
            playerEnergy={hudSnapshot.playerEnergy}
            tick={hudSnapshot.tick}
            maxTicks={maxTicks}
            isMobile={false}
          />
        )}
      </div>

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
