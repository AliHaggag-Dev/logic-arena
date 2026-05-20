import React, { useState, useCallback } from "react";
import { ArrowLeft } from 'lucide-react';
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LevelDetail, ModalState } from "../../types";
import type { CampaignFrame, FightResult } from "../../../hooks/useCampaignFight";
import { DIFFICULTY_CONFIG } from "../../../constants/difficulty.constants";
import { CampaignScriptEditor } from "../editor/CampaignScriptEditor";
import { LevelArenaPreview } from "../arena/LevelArenaPreview";
import { EditorToolbar } from "../../../../../../components/editor/EditorToolbar";
import { HintPanel } from "../HintPanel";
import { apiClient } from "../../../../../../lib/api-client";

interface RevealHintResponse {
  hint: string;
  pointsDeducted: number;
  remainingPoints: number;
}

interface LevelMobileLayoutProps {
  level: LevelDetail;
  script: string;
  setScript: (s: string) => void;
  modal: ModalState;
  handleFight: () => void;
  onBattleEnd: (winner: 'player' | 'enemy' | 'draw') => void;
  latestFrameRef?: React.MutableRefObject<CampaignFrame | null>;
  isReplaying?: boolean;
  fightResult?: FightResult | null;
  waitingForReplay?: boolean;
  router: AppRouterInstance;
}

export function LevelMobileLayout({ level, script, setScript, modal, handleFight, onBattleEnd, latestFrameRef, isReplaying, fightResult, waitingForReplay, router }: LevelMobileLayoutProps) {
  const dc = DIFFICULTY_CONFIG[level.difficulty];
  const fightDisabled = !script.trim() || modal === "loading";

  const [revealedCount, setRevealedCount] = useState(level.revealedHintCount ?? 0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hints, setHints] = useState<string[]>(level.hints ?? []);

  const handleReveal = useCallback(async (index: number) => {
    if (index !== 1 && index !== 2) return;
    setIsRevealing(true);
    try {
      const res = await apiClient.post<RevealHintResponse>(
        `/campaign/levels/${level.id}/hint`,
        { hintIndex: index },
      );
      const newHints = [...hints];
      newHints[index] = res.data.hint;
      setHints(newHints);
      setRevealedCount((c) => Math.max(c, index));
    } catch {
      // Errors (e.g. insufficient points) surface via UI — no re-throw needed
    } finally {
      setIsRevealing(false);
    }
  }, [level.id, hints]);

  return (
    <div className="w-full flex flex-col min-h-[calc(100vh-80px-env(safe-area-inset-bottom))] px-4 pt-4 pb-[env(safe-area-inset-bottom)] relative z-10 animate-[fadeIn_0.35s_ease]">
      {/* Top Header */}
      <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-accent/20 shrink-0">
        <button
          type="button"
          onClick={() => router.push("/campaign")}
          className="w-max text-[9px] tracking-[0.25em] text-accent/70 hover:text-accent border border-accent/15 rounded px-2.5 py-1 uppercase"
        >
          <span className="flex items-center gap-1.5 justify-center"><ArrowLeft className="w-3 h-3" /> BACK TO MAP</span>
        </button>
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col">
            <span className="text-[9px] text-accent/70 tracking-[0.3em] font-bold block mb-0.5 uppercase">
              ORDER {String(level.order).padStart(2, "0")}
            </span>
            <h1 className="m-0 text-xl font-black tracking-[0.2em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)] leading-[1.1] uppercase max-w-[200px]">
              {level.title}
            </h1>
          </div>
          <span
            className="inline-block text-[9px] font-black tracking-[0.3em] border rounded px-2 py-1 shadow-sm shrink-0"
            style={{ color: dc.color, borderColor: `${dc.color}40`, backgroundColor: `${dc.color}10` }}
          >
            {dc.label}
          </span>
        </div>
      </div>

      {/* Info Stack */}
      <div className="flex flex-col gap-4 shrink-0 mb-4">
        {/* Mission brief */}
        <div className="border border-accent/15 rounded-xl p-4 bg-accent/[0.02]">
          <p className="text-[9px] tracking-[0.3em] text-accent/30 mb-2 uppercase">{'// '}MISSION_BRIEF</p>
          <p className="text-[10px] text-accent/70 tracking-[0.08em] leading-relaxed">{level.description}</p>
        </div>

        {/* Enemy Intel */}
        <div className="border border-accent/15 rounded-xl p-4 bg-accent/[0.025]">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-accent/70 tracking-[0.15em]">INTEL</span>
              <span className="font-bold text-accent/70 tracking-[0.12em]">{level.title}</span>
            </div>
            <div className="h-[1px] bg-accent/10" />
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-accent/70 tracking-[0.15em]">REWARD</span>
              <span className="font-bold text-accent/70 tracking-[0.12em]">+{level.pointsReward} PTS</span>
            </div>
          </div>
        </div>

        {/* Hint Panel */}
        <div className="border border-accent/15 rounded-xl p-4 bg-accent/[0.02]">
          <HintPanel
            hints={hints}
            revealedCount={revealedCount}
            conceptTaught={level.conceptTaught}
            onReveal={handleReveal}
            isMobile
            isRevealing={isRevealing}
          />
        </div>
      </div>

      {/* Live Arena Preview — compact mobile version */}
      <div className="mb-4 shrink-0">
        <LevelArenaPreview
          levelId={level.id}
          mode={modal === "loading" || modal === "fighting" ? "loading" : "preview"}
          userScript={modal === "loading" || modal === "fighting" ? script : undefined}
          onBattleEnd={onBattleEnd}
          latestFrameRef={latestFrameRef}
          isReplaying={isReplaying}
          fightResult={fightResult}
          waitingForReplay={waitingForReplay}
          isMobile
          maxTicks={level.maxTicks}
          compact
        />
      </div>

      {/* Code Editor Full Width */}
      <div className="flex flex-col flex-1 gap-3 pb-8">
        <div className="flex justify-between items-center px-1">
          <p className="text-[9px] tracking-[0.3em] text-accent/35 uppercase m-0">{'// '}YOUR_ALISCRIPT</p>
          <span className="text-[9px] text-accent/20 tracking-[0.12em]">
            {script.split("\n").filter(Boolean).length} LINES
          </span>
        </div>
        <CampaignScriptEditor
          value={script}
          onChange={setScript}
          isMobile
          onRun={handleFight}
          readOnly={modal === "loading"}
          placeholder={"// Write your AliScript here\n// Example:\nSET x = SCAN\nIF x > 0\n  FIRE\nELSE\n  MOVE RIGHT\nEND"}
          className="min-h-[300px] flex-1"
        />
        <EditorToolbar onRun={handleFight} disabled={fightDisabled} isMobile />
      </div>
    </div>
  );
}
