"use client";
import React, { memo } from "react";
import dynamic from "next/dynamic";
import { getSceneForLevel } from "./scenes";
import type { CampaignFrame, FightResult } from "../../../hooks/useCampaignFight";
import { BattleHUD } from "../layout/BattleHUD";

const HUD_UPDATE_INTERVAL_MS = 100;
const DEFAULT_STAT_VALUE = 100;
const DEFAULT_MAX_TICKS = 1500;

const ArenaCanvas = dynamic(
  () => import("./ArenaCanvas").then((module) => module.ArenaCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        className="relative w-full overflow-hidden rounded-xl border border-accent/15 bg-accent/[0.03]"
        style={{ aspectRatio: "16 / 7", contain: "layout paint" }}
      >
        <div className="absolute inset-0 animate-pulse bg-accent/[0.04]" />
      </div>
    ),
  },
);

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
  isBossLevel?: boolean;
  bossIntroActive?: boolean;
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
  isBossLevel = false,
  bossIntroActive = false,
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
      const nextSnapshot: BattleHUDSnapshot = {
        playerHealth: player?.health ?? DEFAULT_STAT_VALUE,
        enemyHealth: enemy?.health ?? DEFAULT_STAT_VALUE,
        playerEnergy: player?.energy ?? DEFAULT_STAT_VALUE,
        tick: frame?.tick ?? 0,
      };

      setHudSnapshot((currentSnapshot) => {
        if (
          currentSnapshot.playerHealth === nextSnapshot.playerHealth &&
          currentSnapshot.enemyHealth === nextSnapshot.enemyHealth &&
          currentSnapshot.playerEnergy === nextSnapshot.playerEnergy &&
          currentSnapshot.tick === nextSnapshot.tick
        ) {
          return currentSnapshot;
        }
        return nextSnapshot;
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
      className={`relative w-full rounded-xl overflow-hidden border ${isBossLevel ? "border-[var(--sem-danger)] shadow-[0_0_38px_rgba(var(--sem-danger-rgb),0.16)]" : "border-accent/20"} ${bossIntroActive ? "boss-arena-shake" : ""}`}
      style={{
        background: 'var(--bg-primary)',
        boxShadow: isBossLevel
          ? '0 0 46px rgba(var(--sem-danger-rgb),0.18), inset 0 0 34px rgba(var(--sem-danger-rgb),0.05)'
          : '0 0 40px rgba(var(--accent-rgb),0.08), inset 0 0 30px rgba(var(--accent-rgb),0.02)',
      }}
    >
      <style>{`
        @keyframes bossArenaShake {
          0%, 100% { transform: translate3d(0, 0, 0); }
          12% { transform: translate3d(-4px, 2px, 0); }
          24% { transform: translate3d(5px, -3px, 0); }
          36% { transform: translate3d(-6px, 1px, 0); }
          48% { transform: translate3d(4px, 3px, 0); }
          60% { transform: translate3d(-3px, -2px, 0); }
          72% { transform: translate3d(2px, 1px, 0); }
        }

        .boss-arena-shake {
          animation: bossArenaShake 520ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b border-accent/10"
        style={{ background: isBossLevel ? 'rgba(var(--sem-danger-rgb),0.06)' : 'rgba(var(--accent-rgb),0.03)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ff5f56" }} />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ffbd2e" }} />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#27c93f" }} />
        </div>
        <div
          className={`text-[8px] font-mono font-bold tracking-[0.18em] uppercase px-3 py-0.5 rounded-full border ${isBossLevel ? "border-[var(--sem-danger)] text-[var(--sem-danger)]" : "border-accent/10 text-accent/70"}`}
          style={{ background: isBossLevel ? 'rgba(var(--sem-danger-rgb),0.08)' : 'rgba(var(--accent-rgb),0.04)' }}
        >
          {isBossLevel ? "BOSS SIGNAL LOCKED" : mode === "loading" ? "COMBAT IN PROGRESS" : "ARENA SIMULATION"}
        </div>
        <div className="hidden md:flex items-center gap-2 text-[8px] font-mono font-bold tracking-widest">
          <span className="text-accent/70">ALLY</span>
          <span className="text-accent/70">vs</span>
          <span className="text-accent/70">ENEMY</span>
        </div>
      </div>

      {mode === "loading" && (
        <div className="border-b border-accent/10">
          <BattleHUD
            playerHealth={hudSnapshot.playerHealth}
            enemyHealth={hudSnapshot.enemyHealth}
            playerEnergy={hudSnapshot.playerEnergy}
            tick={hudSnapshot.tick}
            maxTicks={maxTicks}
            isMobile={true}
            isBossLevel={isBossLevel}
          />
        </div>
      )}

      <div className="relative min-h-[1px] flex-1">
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
          isBossLevel={isBossLevel}
        />
      </div>

      <div
        className="flex items-center justify-between px-3 py-1 border-t border-accent/10"
        style={{ background: 'rgba(var(--accent-rgb),0.02)' }}
      >
        <span className="text-[7px] font-mono text-accent/70 tracking-[0.2em] uppercase">
          {category}
        </span>
        <span className="text-[7px] font-mono text-accent/70 tracking-[0.2em] uppercase">
          TACTICAL PREVIEW
        </span>
      </div>
    </div>
  );
});
