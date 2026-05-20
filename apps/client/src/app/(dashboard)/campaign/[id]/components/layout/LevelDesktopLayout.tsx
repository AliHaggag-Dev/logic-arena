import React, { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LevelDetail, ModalState } from "../../types";
import type { CampaignFrame, FightResult } from "../../../hooks/useCampaignFight";
import { DIFFICULTY_CONFIG } from "../../../constants/difficulty.constants";
import { CampaignScriptEditor } from "../editor/CampaignScriptEditor";
import { LevelArenaPreview } from "../arena/LevelArenaPreview";
import { EditorToolbar } from "../../../../../../components/editor/EditorToolbar";
import { HintPanel } from "../HintPanel";
import { apiClient } from "../../../../../../lib/api-client";
import { Loader2 } from "lucide-react";

interface RevealHintResponse {
  hint: string;
  pointsDeducted: number;
  remainingPoints: number;
}

interface LevelDesktopLayoutProps {
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

export function LevelDesktopLayout({ level, script, setScript, modal, handleFight, onBattleEnd, latestFrameRef, isReplaying, fightResult, waitingForReplay, router }: LevelDesktopLayoutProps) {
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
    <div className="max-w-[1100px] mx-auto px-6 pt-10 pb-[120px] relative z-10 animate-[fadeIn_0.35s_ease]">
      <div className="flex flex-row items-end justify-between gap-4 mb-10 pb-6 border-b border-accent/20">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => router.push("/campaign")}
            className="w-max text-[10px] tracking-[0.25em] text-accent/70 hover:text-accent border border-accent/15 hover:border-accent/40 rounded px-3 py-1 transition-all duration-200 cursor-pointer bg-transparent uppercase"
          >
            <span className="flex items-center gap-1.5 justify-center"><ArrowLeft className="w-3 h-3" /> BACK TO MAP</span>
          </button>
          <div>
            <span className="text-[10px] text-accent/70 tracking-[0.3em] font-bold block mb-1 uppercase">
              ORDER {String(level.order).padStart(2, "0")}
            </span>
            <h1 className="m-0 text-3xl font-black tracking-[0.2em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)] leading-none uppercase">
              {level.title}
            </h1>
          </div>
        </div>

        <div>
          <span
            className="inline-block text-[10px] font-black tracking-[0.3em] border rounded px-3 py-1.5 shadow-sm"
            style={{ color: dc.color, borderColor: `${dc.color}40`, backgroundColor: `${dc.color}10` }}
          >
            {dc.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr] gap-7 items-start">
        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col gap-5">
          {/* Live Arena Preview */}
          <div className="relative">
            <LevelArenaPreview
              levelId={level.id}
              mode={modal === "loading" || modal === "fighting" ? "loading" : "preview"}
              userScript={modal === "loading" || modal === "fighting" ? script : undefined}
              onBattleEnd={onBattleEnd}
              latestFrameRef={latestFrameRef}
              isReplaying={isReplaying}
              fightResult={fightResult}
              waitingForReplay={waitingForReplay}
              isMobile={false}
              maxTicks={level.maxTicks}
            />
            {modal === "loading" && (
              <div
                className="mt-2 w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-accent/20"
                style={{ background: 'rgba(var(--accent-rgb),0.04)' }}
              >
                <Loader2 className="w-3 h-3 text-accent animate-spin" />
                <span className="text-[9px] font-mono font-black tracking-[0.3em] text-accent/70 uppercase">
                  COMBAT IN PROGRESS
                </span>
              </div>
            )}
          </div>

          <div className="border border-accent/15 rounded-xl p-5 bg-accent/[0.02]">
            <p className="text-[9px] tracking-[0.3em] text-accent/30 mb-2.5 uppercase">
              {'// '}MISSION_BRIEF
            </p>
            <p className="text-[11px] text-accent/70 tracking-[0.08em] leading-relaxed">
              {level.description}
            </p>
          </div>

          <div className="border border-accent/15 rounded-xl p-5 bg-accent/[0.025]">
            <p className="text-[9px] tracking-[0.3em] text-accent/45 mb-3 uppercase">
              {'// '}ENEMY_INTEL
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-accent/70 tracking-[0.15em]">DESIGNATION</span>
                <span className="font-bold text-accent/70 tracking-[0.12em]">{level.title}</span>
              </div>
              <div className="h-[1px] bg-accent/10" />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-accent/70 tracking-[0.15em]">THREAT LEVEL</span>
                <span className="font-bold tracking-[0.12em]" style={{ color: dc.color }}>{level.difficulty}</span>
              </div>
              <div className="h-[1px] bg-accent/10" />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-accent/70 tracking-[0.15em]">REWARD</span>
                <span className="font-bold text-accent/70 tracking-[0.12em]">+{level.pointsReward} PTS</span>
              </div>
            </div>
          </div>

          <div className="border border-accent/15 rounded-xl p-5 bg-accent/[0.02]">
            <HintPanel
              hints={hints}
              revealedCount={revealedCount}
              conceptTaught={level.conceptTaught}
              onReveal={handleReveal}
              isMobile={false}
              isRevealing={isRevealing}
            />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-[9px] tracking-[0.3em] text-accent/35 uppercase m-0">
              {'// '}YOUR_ALISCRIPT
            </p>
            <span className="text-[9px] text-accent/20 tracking-[0.12em]">
              {script.split("\n").filter(Boolean).length} LINES
            </span>
          </div>

          <CampaignScriptEditor
            value={script}
            onChange={setScript}
            isMobile={false}
            onRun={handleFight}
            readOnly={modal === "loading"}
            placeholder={"// Write your AliScript here\n// Example:\nSET x = SCAN\nIF x > 0\n  FIRE\nELSE\n  MOVE RIGHT\nEND"}
            className="min-h-[380px]"
          />

          <EditorToolbar onRun={handleFight} disabled={fightDisabled} isMobile={false} />
        </div>
      </div>
    </div>
  );
}
