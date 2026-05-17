import React from "react";
import { ArrowLeft, ArrowRight, Swords, Loader2 } from 'lucide-react';
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LevelDetail, ModalState } from "../../types";
import { DIFFICULTY_CONFIG } from "../../../constants/difficulty.constants";
import { CampaignScriptEditor } from "../editor/CampaignScriptEditor";
import { LevelArenaPreview } from "../arena/LevelArenaPreview";

interface LevelDesktopLayoutProps {
  level: LevelDetail;
  script: string;
  setScript: (s: string) => void;
  modal: ModalState;
  handleFight: () => void;
  onBattleEnd: (winner: 'player' | 'enemy' | 'draw') => void;
  latestFrameRef?: React.MutableRefObject<any>;
  isReplaying?: boolean;
  fightResult?: { winner: string; completionToken: string | null } | null;
  waitingForReplay?: boolean;
  router: AppRouterInstance;
}

export function LevelDesktopLayout({ level, script, setScript, modal, handleFight, onBattleEnd, latestFrameRef, isReplaying, fightResult, waitingForReplay, router }: LevelDesktopLayoutProps) {
  const dc = DIFFICULTY_CONFIG[level.difficulty];

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
            </h1>p;]|
            +
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

          <div className="border border-red-500/20 rounded-xl p-5 bg-red-500/[0.03]">
            <p className="text-[9px] tracking-[0.3em] text-red-500/50 mb-3 uppercase">
              {'// '}ENEMY_INTEL
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-accent/70 tracking-[0.15em]">DESIGNATION</span>
                <span className="font-bold text-red-500/80 tracking-[0.12em]">{level.title}</span>
              </div>
              <div className="h-[1px] bg-red-500/10" />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-accent/70 tracking-[0.15em]">THREAT LEVEL</span>
                <span className="font-bold tracking-[0.12em]" style={{ color: dc.color }}>{level.difficulty}</span>
              </div>
              <div className="h-[1px] bg-red-500/10" />
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-accent/70 tracking-[0.15em]">REWARD</span>
                <span className="font-bold text-accent/70 tracking-[0.12em]">+{level.pointsReward} PTS</span>
              </div>
            </div>
          </div>

          <div className="border border-accent/10 rounded-xl p-4 bg-transparent">
            <p className="text-[9px] tracking-[0.3em] text-accent/25 mb-2.5 uppercase">{'// '}TACTICS</p>
            <ul className="text-[10px] text-accent/35 tracking-[0.06em] leading-relaxed space-y-1.5 list-none p-0 m-0">
              <li className="flex items-center gap-2"><ArrowRight className="w-2.5 h-2.5 text-accent/20 shrink-0" /> Use SCAN to detect proximity</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-2.5 h-2.5 text-accent/20 shrink-0" /> TIME your FIRE commands carefully</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-2.5 h-2.5 text-accent/20 shrink-0" /> WHILE loops amplify your firepower</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-2.5 h-2.5 text-accent/20 shrink-0" /> Reposition with MOVE to dodge fire</li>
            </ul>
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
            placeholder={"// Write your AliScript here\n// Example:\nSET x = SCAN\nIF x > 0\n  FIRE\nELSE\n  MOVE RIGHT\nEND"}
            className="min-h-[380px]"
          />

          <button
            type="button"
            onClick={handleFight}
            disabled={!script.trim() || modal === "loading"}
            className={`w-full py-4 rounded-xl text-[11px] font-black tracking-[0.3em] font-mono flex items-center justify-center gap-2 transition-all duration-200 border ${modal === "loading"
              ? "bg-accent/5 border-accent/20 text-accent/70 cursor-not-allowed"
              : !script.trim()
                ? "bg-accent/5 border-accent/15 text-accent/25 cursor-default"
                : "bg-accent/10 border-accent/40 text-accent cursor-pointer hover:bg-accent/20 hover:border-accent/70 hover:drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.5)]"
              }`}
          >
            {modal === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> INITIALIZING COMBAT...
              </>
            ) : (
              <>
                <Swords className="w-4 h-4" /> DEPLOY & FIGHT
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
