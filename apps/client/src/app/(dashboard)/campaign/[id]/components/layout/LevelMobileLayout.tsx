import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
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
import { cacheCampaignLevel } from "../../../hooks/useCampaignPrefetch";
import { Sparkles } from "lucide-react";

const AiGeneratePanel = dynamic(
  () => import("../../../../../../app/arena/components/CommandConsole/AiGeneratePanel").then((module) => module.AiGeneratePanel),
  { ssr: false },
);

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
  isBossLevel?: boolean;
  bossIntroActive?: boolean;
  router: AppRouterInstance;
}

export function LevelMobileLayout({ level, script, setScript, modal, handleFight, onBattleEnd, latestFrameRef, isReplaying, fightResult, waitingForReplay, isBossLevel = false, bossIntroActive = false, router }: LevelMobileLayoutProps) {
  const dc = DIFFICULTY_CONFIG[level.difficulty];
  const fightDisabled = !script.trim() || modal === "loading";

  const [revealedCount, setRevealedCount] = useState(level.revealedHintCount ?? 0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hints, setHints] = useState<string[]>(level.hints ?? []);
  const [showAi, setShowAi] = useState(false);

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

      const newRevealedCount = Math.max(revealedCount, index);
      setRevealedCount(newRevealedCount);

      cacheCampaignLevel({
        ...level,
        hints: newHints,
        revealedHintCount: newRevealedCount,
      });
    } catch (error) {
      throw error;
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
          className="w-max flex items-center gap-1.5 text-[11px] font-black tracking-[0.2em] text-accent/80 hover:text-accent transition-colors py-2 -ml-1 uppercase"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> BACK TO MAP
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
          <p className="text-[9px] tracking-[0.3em] text-accent/70 mb-2 uppercase">{'// '}MISSION_BRIEF</p>
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
          isBossLevel={isBossLevel}
          bossIntroActive={bossIntroActive}
          compact
        />
      </div>

      {/* Code Editor Full Width */}
      <div className="flex flex-col flex-1 gap-3 pb-8 mt-2">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-3">
            <p className="text-[9px] tracking-[0.3em] text-accent/70 uppercase m-0">{'// '}YOUR_ALISCRIPT</p>
            <button
              type="button"
              onClick={() => setShowAi(!showAi)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-bold tracking-[0.15em] transition-all cursor-pointer ${
                showAi
                  ? "border-accent/40 bg-accent/20 text-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]"
                  : "border-accent/20 bg-accent/5 text-accent/70 hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
              }`}
              title="Toggle AI Generator"
            >
              <Sparkles className="w-3 h-3" />
              AI GENERATOR
            </button>
          </div>
          <span className="text-[9px] text-accent/70 tracking-[0.12em]">
            {script.split("\n").filter(Boolean).length} LINES
          </span>
        </div>

        {showAi ? (
          <div className="flex-1 flex flex-col min-h-[300px] bg-bg-primary rounded-xl overflow-hidden border border-accent/20 p-3">
            <AiGeneratePanel 
              onInsert={(code) => {
                setScript(code);
                setShowAi(false);
              }}
              isMobile={true}
            />
          </div>
        ) : (
          <CampaignScriptEditor
            value={script}
            onChange={setScript}
            isMobile
            onRun={handleFight}
            readOnly={modal === "loading"}
            placeholder={"// Write your AliScript here\n// Example:\nSET x = SCAN\nIF x > 0\n  FIRE\nELSE\n  MOVE RIGHT\nEND"}
            className="min-h-[300px] flex-1"
          />
        )}
        <EditorToolbar onRun={handleFight} disabled={fightDisabled} isMobile />
      </div>
    </div>
  );
}
