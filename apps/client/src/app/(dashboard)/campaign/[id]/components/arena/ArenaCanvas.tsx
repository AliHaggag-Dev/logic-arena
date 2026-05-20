"use client";
import React, { useEffect, useRef, memo } from "react";
import type { SceneDef, SceneState } from "./scenes";
import { createEvalState } from "./miniEvaluator";
import type { EvalState } from "./miniEvaluator";
import { getEnemyScript } from "../levelScripts";
import { ROBOT_SIZE, FOV_SWEEP_FRAMES, FLASH_DURATION } from "./constants";
import { drawGrid, drawScanLine, drawLabel, drawGraphNet } from "./rendering/drawBackground";
import { drawRobot } from "./rendering/drawRobot";
import { drawProjectile } from "./rendering/drawProjectile";
import { drawObstacle } from "./rendering/drawObstacle";
import { updateProjectiles } from "./physics/projectileSystem";
import type { RuntimeArenaRobot } from "./combat/applyAction";
import { tickFovTimers, ensureEnemyFov } from "./combat/fovSystem";
import { runEvalTick } from "./battle/battleOrchestrator";
import { syncReplayFrame, type CampaignFrame } from "./battle/replaySync";

interface ArenaCanvasProps {
  scene: SceneDef;
  levelId: string;
  userScript?: string;
  enemyScript?: string;
  onBattleEnd?: (winner: 'player' | 'enemy' | 'draw') => void;
  latestFrameRef?: React.MutableRefObject<CampaignFrame | null>;
  isReplaying?: boolean;
  fightResult?: { winner: string; completionToken: string | null; tick?: number; fightDurationTicks?: number } | null;
  aspectRatio?: number;
  className?: string;
  waitingForReplay?: boolean;
}

export const ArenaCanvas = memo(function ArenaCanvas({
  scene,
  levelId,
  userScript,
  enemyScript: enemyScriptProp,
  onBattleEnd,
  latestFrameRef,
  isReplaying = false,
  fightResult,
  aspectRatio = 16 / 7,
  className = "",
  waitingForReplay = false,
}: ArenaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SceneState>(scene.init());
  const evalRef = useRef<Map<string, EvalState | null>>(new Map());
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(true);
  const nextIdRef = useRef({ current: 0 });
  const errRef = useRef<Set<string>>(new Set());

  const fovTimerRef = useRef<Map<string, number>>(new Map());
  const flashTimerRef = useRef(0);

  const battleEndedRef = useRef(false);
  const battleEvalTickRef = useRef(0);
  const onBattleEndRef = useRef(onBattleEnd);
  useEffect(() => { onBattleEndRef.current = onBattleEnd; }, [onBattleEnd]);

  const fightResultRef = useRef(fightResult);
  useEffect(() => { fightResultRef.current = fightResult; }, [fightResult]);

  const userScriptRef = useRef(userScript);
  useEffect(() => { userScriptRef.current = userScript; }, [userScript]);
  const enemyScriptPropRef = useRef(enemyScriptProp);
  useEffect(() => { enemyScriptPropRef.current = enemyScriptProp; }, [enemyScriptProp]);

  const previewMode = !userScript;
  const prevPreviewMode = useRef(previewMode);
  const previewModeRef = useRef(previewMode);
  useEffect(() => {
    previewModeRef.current = previewMode;
  }, [previewMode]);

  useEffect(() => {
    const modeChanged = previewMode !== prevPreviewMode.current;
    prevPreviewMode.current = previewMode;

    const s = scene.init();
    if (!s.local) s.local = {};
    stateRef.current = s;
    nextIdRef.current.current = 0;
    fovTimerRef.current = new Map();
    flashTimerRef.current = 0;
    battleEndedRef.current = false;
    battleEvalTickRef.current = 0;

    const enemyScr = enemyScriptPropRef.current || getEnemyScript(levelId) || '';

    const evals = new Map<string, EvalState | null>();
    const errors = new Set<string>();

    if (!previewMode) {
      const playerState = createEvalState(userScriptRef.current ?? '');
      if (!playerState) errors.add('player');
      evals.set('player', playerState);
    }
    if (enemyScr) {
      const enemyState = createEvalState(enemyScr);
      if (!enemyState) errors.add('enemy');
      evals.set('enemy', enemyState);
    }

    void modeChanged;
    evalRef.current = evals;
    errRef.current = errors;
  }, [scene, levelId, previewMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const io = new IntersectionObserver(
      ([e]) => { visibleRef.current = e.isIntersecting; },
      { threshold: 0.1 },
    );
    io.observe(canvas);

    let lastTime = 0;
    const FRAME_MS = 1000 / 60;
    let evalTick = 0;

    const render = (now: number) => {
      rafRef.current = requestAnimationFrame(render);
      if (!visibleRef.current) return;
      if (waitingForReplay) return;
      if (now - lastTime < FRAME_MS - 2) return;
      lastTime = now;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const state = stateRef.current;
      const evals = evalRef.current;
      const nextId = nextIdRef.current;
      const errors = errRef.current;
      const css = getComputedStyle(document.documentElement);
      const rgb = css.getPropertyValue('--accent-rgb').trim() || '34,211,238';

      const streamingFrame = isReplaying ? latestFrameRef?.current ?? null : null;
      const streamingMode = streamingFrame !== null;

      if (previewModeRef.current && !streamingMode) {
        scene.tick(state);
      }
      state.tick++;

      if (streamingMode) {
        syncReplayFrame(state, streamingFrame, battleEndedRef, fightResultRef.current ?? null, fovTimerRef.current, onBattleEndRef.current ?? null);
      }

      if (!streamingMode) {
        evalTick = runEvalTick(state, evals, errors, nextId, previewModeRef.current, battleEndedRef, battleEvalTickRef, fovTimerRef.current, onBattleEndRef.current ?? null, evalTick);
      }

      for (const robot of state.robots) {
        const runtimeRobot = robot as RuntimeArenaRobot;
        if ((runtimeRobot._fireCooldown ?? 0) > 0) {
          runtimeRobot._fireCooldown = (runtimeRobot._fireCooldown ?? 0) - 1;
        }
        if (robot.isAlive && runtimeRobot._lastMoveAngle !== undefined) {
          const PER_FRAME_SPD = runtimeRobot._lastMoveFast ? 0.004 : 0.002;
          const v = runtimeRobot._lastMoveValue ?? 0;
          if (v === -2) {
            robot.x -= Math.cos(robot.angle) * PER_FRAME_SPD;
            robot.y -= Math.sin(robot.angle) * PER_FRAME_SPD;
          } else {
            robot.x += Math.cos(robot.angle) * PER_FRAME_SPD;
            robot.y += Math.sin(robot.angle) * PER_FRAME_SPD;
          }
          robot.x = Math.max(ROBOT_SIZE, Math.min(1 - ROBOT_SIZE, robot.x));
          robot.y = Math.max(ROBOT_SIZE, Math.min(1 - ROBOT_SIZE, robot.y));
        }
      }

      tickFovTimers(fovTimerRef.current);
      ensureEnemyFov(fovTimerRef.current, state.robots);
      if (flashTimerRef.current > 0) flashTimerRef.current--;

      if (!streamingMode) {
        updateProjectiles(state.projectiles, state.robots, state.obstacles, previewModeRef.current, battleEndedRef, flashTimerRef, onBattleEndRef.current ?? null);
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(3,7,18,0.92)';
      ctx.fillRect(0, 0, W, H);
      drawGrid(ctx, W, H, rgb);
      drawScanLine(ctx, W, H, state.tick, rgb);

      if (/PATHFIND|gfx|GRAPH|NODE|EDGE|BREADTH|DEPTH|CYCLE|SPANNING|TOPOLOGICAL|DIJKSTRA|ORACLE/.test(scene.label)) {
        drawGraphNet(ctx, W, H, state.tick, rgb, levelId);
      }

      state.obstacles.forEach(obs => drawObstacle(ctx, obs, W, H));
      state.projectiles.forEach(p => drawProjectile(ctx, p, W, H));

      const enemy = state.robots.find(r => r.id === 'enemy');
      const player = state.robots.find(r => r.id === 'player');
      const enemyFov = (fovTimerRef.current.get('enemy') ?? 0) / FOV_SWEEP_FRAMES;
      const playerFov = (fovTimerRef.current.get('player') ?? 0) / FOV_SWEEP_FRAMES;

      if (enemy) drawRobot(ctx, enemy, W, H, state.tick, enemyFov);
      if (player) drawRobot(ctx, player, W, H, state.tick, playerFov);

      if (flashTimerRef.current > 0) {
        const fa = (flashTimerRef.current / FLASH_DURATION) * 0.35;
        ctx.save();
        ctx.globalAlpha = fa;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      if (errors.has('player') && !previewModeRef.current) {
        ctx.save(); ctx.fillStyle = '#f59e0b';
        ctx.font = `bold ${Math.max(10, W * 0.022)}px monospace`;
        ctx.textAlign = 'left'; ctx.globalAlpha = 0.5 + Math.sin(state.tick * 0.08) * 0.3;
        ctx.fillText('\u26a0 PLAYER SCRIPT ERROR', 8, H - 7); ctx.restore();
      }
      if (errors.has('enemy')) {
        ctx.save(); ctx.fillStyle = '#ef4444';
        ctx.font = `bold ${Math.max(10, W * 0.022)}px monospace`;
        ctx.textAlign = 'left'; ctx.globalAlpha = 0.5 + Math.sin(state.tick * 0.08) * 0.3;
        ctx.fillText('\u26a0 ENEMY SCRIPT ERROR', 8, 14); ctx.restore();
      }

      drawLabel(ctx, scene.label, W, H, rgb);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(rafRef.current); io.disconnect(); };
  }, [scene, levelId, isReplaying]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl ${className}`}
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      <canvas
        ref={canvasRef}
        width={640}
        height={280}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
        style={{ imageRendering: 'crisp-edges' }}
      />
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-accent/30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-accent/30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-accent/30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-accent/30 pointer-events-none" />
      <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
        <span
          className="w-1.5 h-1.5 rounded-full bg-accent"
          style={{ animation: 'pulse 1.5s ease-in-out infinite', boxShadow: '0 0 6px var(--accent)' }}
        />
        <span className="text-[10px] md:text-[8px] font-mono font-bold tracking-[0.2em] text-accent/60 uppercase">LIVE</span>
      </div>
    </div>
  );
});
