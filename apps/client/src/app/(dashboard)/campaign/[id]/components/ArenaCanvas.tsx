"use client";
import React, { useEffect, useRef, memo } from "react";
import type { SceneDef, SceneState, ArenaRobot, ArenaProjectile, ArenaObstacle } from "./arenaScenes";
import { createEvalState, tickEvaluator } from "./miniEvaluator";
import type { EvalState, EvalAction } from "./miniEvaluator";
import { getEnemyScript } from "./levelScripts";

interface CampaignFrameRobot {
  id: 'player' | 'enemy';
  position?: { x?: number; y?: number };
  rotation?: number;
  health?: number;
  energy?: number;
  isAlive?: boolean;
  scanActive?: boolean;
}

interface CampaignFrameProjectile {
  id: number;
  position?: { x?: number; y?: number };
  color?: string;
  ownerId?: 'player' | 'enemy';
}

interface CampaignFrame {
  robots?: CampaignFrameRobot[];
  projectiles?: CampaignFrameProjectile[];
}

type RuntimeArenaRobot = ArenaRobot & {
  _fireCooldown?: number;
};

interface ArenaCanvasProps {
  scene: SceneDef;
  levelId: string;
  userScript?: string;
  enemyScript?: string;
  onBattleEnd?: (winner: 'player' | 'enemy' | 'draw') => void;
  latestFrameRef?: React.MutableRefObject<CampaignFrame | null>;
  isReplaying?: boolean;
  fightResult?: { winner: string; completionToken: string | null } | null;
  aspectRatio?: number;
  className?: string;
  waitingForReplay?: boolean;
}

const FIRE_DAMAGE = 15;
const BURST_DAMAGE = 5;
const BURST_SPREAD = 0.12;
const PROJ_SPEED = 0.006;
const PROJ_LIFE = 70;
const ROBOT_SIZE = 0.035;
const RESPAWN_DELAY = 90;
const INVULN_TICKS = 30;
const ENERGY_REGEN = 0.5;
const FOV_HALF = 0.9;
const FOV_RANGE = 0.55;
const FLASH_DURATION = 24;
const PREVIEW_EVAL_INTERVAL = 6;
const BATTLE_EVAL_INTERVAL = 6;
const MAX_BATTLE_EVAL_TICKS = 180;
const BATTLE_END_DELAY_MS = 800;
const FOV_SWEEP_FRAMES = 90;

const ARENA_W = 800;
const ARENA_H = 600;

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number, rgb: string): void {
  ctx.save();
  ctx.strokeStyle = `rgba(${rgb},0.04)`;
  ctx.lineWidth = 0.5;
  const step = Math.min(W, H) / 10;
  for (let x = 0; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}

function drawScanLine(ctx: CanvasRenderingContext2D, W: number, H: number, tick: number, rgb: string): void {
  const y = (tick * 1.4) % H;
  ctx.save();
  const g = ctx.createLinearGradient(0, y - 4, 0, y + 4);
  g.addColorStop(0, 'transparent');
  g.addColorStop(0.5, `rgba(${rgb},0.03)`);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 4, W, 8);
  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: ArenaObstacle, W: number, H: number): void {
  const px = obs.x * W, py = obs.y * H, pw = obs.w * W, ph = obs.h * H;
  ctx.save();
  ctx.translate(px, py);
  const cm: Record<string, { fill: string; stroke: string }> = {
    SOLID: { fill: 'rgba(100,120,140,0.25)', stroke: 'rgba(100,140,180,0.4)' },
    TRAP: { fill: 'rgba(245,158,11,0.12)', stroke: 'rgba(245,158,11,0.35)' },
    LAVA: { fill: 'rgba(239,68,68,0.15)', stroke: 'rgba(239,68,68,0.45)' },
  };
  const c = cm[obs.type];
  ctx.fillStyle = c.fill;
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 1;
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
  ctx.restore();
}

function drawFovCone(
  ctx: CanvasRenderingContext2D,
  robot: ArenaRobot,
  W: number, H: number,
  alpha: number,
): void {
  if (!robot.isAlive || alpha <= 0) return;
  const px = robot.x * W, py = robot.y * H;
  const range = FOV_RANGE * Math.min(W, H);

  // As alpha goes from 1.0 down to 0, spin goes from 0 to 2PI (360 deg)
  const spinAngle = Math.PI * 2 * (1.0 - alpha);
  const currentAngle = robot.angle + spinAngle;

  ctx.save();
  ctx.globalAlpha = alpha * 0.18;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, range, currentAngle - FOV_HALF, currentAngle + FOV_HALF);
  ctx.closePath();
  ctx.fillStyle = robot.color;
  ctx.fill();
  ctx.globalAlpha = alpha * 0.45;
  ctx.strokeStyle = robot.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px, py, range, currentAngle - FOV_HALF, currentAngle + FOV_HALF);
  ctx.stroke();
  ctx.restore();
}

function drawRobot(
  ctx: CanvasRenderingContext2D,
  robot: ArenaRobot,
  W: number, H: number,
  tick: number,
  fovAlpha: number,
): void {
  if (!robot.isAlive) return;
  const px = robot.x * W, py = robot.y * H;
  const r = robot.size * Math.min(W, H);
  const invPulse = robot.invulnerableTimer > 0 ? 0.3 + Math.sin(tick * 0.3) * 0.3 : 0;
  const a = robot.invulnerableTimer > 0 ? 0.4 + invPulse : 1;

  drawFovCone(ctx, robot, W, H, fovAlpha);

  ctx.save();
  ctx.translate(px, py);
  ctx.globalAlpha = a;

  const glowR = r * (1.8 + Math.sin(tick * 0.05) * 0.15);
  const grd = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, glowR);
  grd.addColorStop(0, `${robot.color}30`);
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2); ctx.fill();

  ctx.rotate(robot.angle);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const rx = Math.cos(ang) * r, ry = Math.sin(ang) * r * 0.8;
    i === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.fillStyle = `${robot.color}22`;
  ctx.strokeStyle = robot.color;
  ctx.lineWidth = 1.5;
  ctx.fill(); ctx.stroke();

  ctx.strokeStyle = robot.color;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r * 0.2, 0); ctx.lineTo(r * 1.4, 0); ctx.stroke();

  ctx.fillStyle = robot.color;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  const bw = r * 3, bh = 3, bx = px - bw / 2, by = py - r * 2 - bh;
  const hp = robot.health / robot.maxHealth;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = hp > 0.5 ? '#22d3ee' : hp > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(bx, by, bw * hp, bh);
  const ep = robot.energy / robot.maxEnergy;
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(bx, by - 5, bw, 2);
  ctx.fillStyle = ep > 0.5 ? '#a78bfa' : ep > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(bx, by - 5, bw * ep, 2);
  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: ArenaProjectile, W: number, H: number): void {
  const px = p.x * W, py = p.y * H;
  ctx.save();
  const g = ctx.createRadialGradient(px, py, 0, px, py, 6);
  g.addColorStop(0, p.color);
  g.addColorStop(0.5, `${p.color}80`);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawGraphNet(ctx: CanvasRenderingContext2D, W: number, H: number, tick: number, rgb: string, levelId: string): void {
  const allNodes = [{ x: 0.5, y: 0.5 }, { x: 0.65, y: 0.3 }, { x: 0.8, y: 0.55 }, { x: 0.7, y: 0.75 }, { x: 0.55, y: 0.8 }, { x: 0.75, y: 0.2 }];
  let activeNodes = [0, 1, 2, 3, 4, 5];
  let activeEdges = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 4], [0, 3], [1, 5], [5, 2]];

  switch (levelId) {
    case 'gfx-01': activeNodes = [0, 1, 2]; activeEdges = [[0, 1], [1, 2]]; break;
    case 'gfx-02': activeNodes = [0, 1, 2, 3]; activeEdges = [[0, 1], [1, 2], [2, 3]]; break;
    case 'gfx-03': activeNodes = [0, 1, 2, 3, 4, 5]; activeEdges = [[0, 1], [1, 5], [5, 2], [2, 3], [3, 4], [4, 0]]; break;
    case 'gfx-04': activeNodes = [0, 1, 2, 5]; activeEdges = [[0, 1], [1, 2], [2, 5]]; break;
    case 'gfx-05': activeNodes = [0, 1, 2, 3, 4]; activeEdges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]; break;
    case 'gfx-06':
    case 'gfx-07':
    case 'gfx-08':
    case 'gfx-09':
    case 'gfx-10':
      activeNodes = [0, 1, 2, 3, 4, 5]; activeEdges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 3], [1, 5], [5, 2]]; break;
  }

  ctx.save();
  ctx.strokeStyle = `rgba(${rgb},0.15)`; ctx.lineWidth = 1.2;
  activeEdges.forEach(([u, v]) => {
    ctx.beginPath(); ctx.moveTo(allNodes[u].x * W, allNodes[u].y * H); ctx.lineTo(allNodes[v].x * W, allNodes[v].y * H); ctx.stroke();
  });
  activeNodes.forEach((idx, i) => {
    const n = allNodes[idx];
    const p = 0.5 + Math.sin(tick * 0.04 + i * 1.2) * 0.3;
    ctx.strokeStyle = `rgba(${rgb},${p * 0.6})`; ctx.beginPath(); ctx.arc(n.x * W, n.y * H, 4.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = `rgba(${rgb},${0.6 + Math.sin(tick * 0.04) * 0.4})`; ctx.fill();
  });
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, label: string, W: number, H: number, rgb: string): void {
  ctx.save();
  ctx.font = `500 ${Math.max(9, W * 0.018)}px monospace`;
  ctx.fillStyle = `rgba(${rgb},0.35)`;
  ctx.textAlign = 'right';
  ctx.fillText(label.toUpperCase(), W - 8, H - 7);
  ctx.restore();
}

function hitCheck(p: ArenaProjectile, robot: ArenaRobot): boolean {
  if (!robot.isAlive) return false;
  const dx = p.x - robot.x, dy = p.y - robot.y;
  return Math.sqrt(dx * dx + dy * dy) < ROBOT_SIZE * 2;
}

function startFovSweep(timers: Map<string, number>, robotId: string): void {
  if ((timers.get(robotId) ?? 0) <= 0) {
    timers.set(robotId, FOV_SWEEP_FRAMES);
  }
}

function applyAction(
  action: EvalAction,
  robot: ArenaRobot,
  projs: ArenaProjectile[],
  nextId: { current: number },
): void {
  const runtimeRobot = robot as RuntimeArenaRobot;
  switch (action.type) {
    case 'fire': {
      if ((runtimeRobot._fireCooldown ?? 0) > 0) break;
      runtimeRobot._fireCooldown = 30;
      const a = action.value, d = robot.size * 2;
      projs.push({
        id: nextId.current++,
        x: robot.x + Math.cos(a) * d,
        y: robot.y + Math.sin(a) * d,
        vx: Math.cos(a) * PROJ_SPEED,
        vy: Math.sin(a) * PROJ_SPEED,
        color: robot.trailColor,
        ownerId: robot.id,
        life: PROJ_LIFE,
        damage: FIRE_DAMAGE,
      });
      break;
    }
    case 'burst': {
      if ((runtimeRobot._fireCooldown ?? 0) > 0) break;
      runtimeRobot._fireCooldown = 50;
      const d = robot.size * 2;
      for (let i = -1; i <= 1; i++) {
        const a = action.value + BURST_SPREAD * i;
        projs.push({
          id: nextId.current++,
          x: robot.x + Math.cos(a) * d,
          y: robot.y + Math.sin(a) * d,
          vx: Math.cos(a) * PROJ_SPEED,
          vy: Math.sin(a) * PROJ_SPEED,
          color: robot.trailColor,
          ownerId: robot.id,
          life: PROJ_LIFE,
          damage: BURST_DAMAGE,
        });
      }
      break;
    }
    case 'move': {
      const spd = action.fast ? 0.025 : 0.012;
      switch (action.value) {
        case -2:
          robot.x -= Math.cos(robot.angle) * spd;
          robot.y -= Math.sin(robot.angle) * spd;
          break;
        case -1:
          robot.x -= Math.cos(robot.angle + Math.PI / 2) * spd;
          robot.y -= Math.sin(robot.angle + Math.PI / 2) * spd;
          break;
        case 1:
          robot.x += Math.cos(robot.angle + Math.PI / 2) * spd;
          robot.y += Math.sin(robot.angle + Math.PI / 2) * spd;
          break;
        default:
          robot.x += Math.cos(robot.angle) * spd;
          robot.y += Math.sin(robot.angle) * spd;
      }
      robot.x = Math.max(ROBOT_SIZE, Math.min(1 - ROBOT_SIZE, robot.x));
      robot.y = Math.max(ROBOT_SIZE, Math.min(1 - ROBOT_SIZE, robot.y));
      break;
    }
  }
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

  // Keep latest scripts in refs so they can be read without triggering re-init
  const userScriptRef = useRef(userScript);
  useEffect(() => { userScriptRef.current = userScript; }, [userScript]);
  const enemyScriptPropRef = useRef(enemyScriptProp);
  useEffect(() => { enemyScriptPropRef.current = enemyScriptProp; }, [enemyScriptProp]);

  // Keep previewMode in a ref so the render loop can read it without being in deps
  const previewMode = !userScript;
  const prevPreviewMode = useRef(previewMode);
  const previewModeRef = useRef(previewMode);
  useEffect(() => {
    previewModeRef.current = previewMode;
  }, [previewMode]);

  useEffect(() => {
    // Only re-init when scene/level changes, or battle mode flips (preview <-> fight)
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

    void modeChanged; // used for clarity — mode flip is implicit from previewMode dep
    evalRef.current = evals;
    errRef.current = errors;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Scene tick — only in preview mode without streaming
      if (previewModeRef.current && !streamingMode) {
        scene.tick(state);
      }
      state.tick++;

      // Streaming mode — apply latest server frame
      if (streamingMode) {
        const frame = streamingFrame;
        for (const robot of state.robots) {
          const src = frame.robots?.find((r: CampaignFrameRobot) => r.id === robot.id);
          if (!src) continue;
          robot.x = (src.position?.x ?? 0) / ARENA_W;
          robot.y = (src.position?.y ?? 0) / ARENA_H;
          robot.angle = src.rotation ?? robot.angle;
          robot.health = src.health ?? robot.health;
          robot.energy = src.energy ?? robot.energy;
          robot.isAlive = src.health != null ? src.health > 0 : src.isAlive ?? robot.isAlive;
          if (src.scanActive) {
            startFovSweep(fovTimerRef.current, robot.id);
          }
        }
        state.projectiles = (frame.projectiles ?? []).map((p: CampaignFrameProjectile) => ({
          id: p.id,
          x: (p.position?.x ?? 0) / ARENA_W,
          y: (p.position?.y ?? 0) / ARENA_H,
          vx: 0, vy: 0,
          color: p.color ?? '#ffffff',
          ownerId: p.ownerId ?? 'enemy',
          life: 99,
          damage: 0,
        }));

        if (!battleEndedRef.current && fightResultRef.current) {
          battleEndedRef.current = true;
          const winner = fightResultRef.current.winner as 'player' | 'enemy' | 'draw';
          setTimeout(() => onBattleEndRef.current?.(winner), BATTLE_END_DELAY_MS);
        }
      }

      // Evaluator tick — skipped in streaming mode
      if (!streamingMode) {
        const evalInterval = previewModeRef.current ? PREVIEW_EVAL_INTERVAL : BATTLE_EVAL_INTERVAL;
        evalTick++;
        if (evalTick >= evalInterval) {
          evalTick = 0;
          const isPreview = previewModeRef.current;
          if (!isPreview && !battleEndedRef.current) {
            battleEvalTickRef.current++;
            if (battleEvalTickRef.current >= MAX_BATTLE_EVAL_TICKS) {
              battleEndedRef.current = true;
              onBattleEndRef.current?.('draw');
            }
          }

          for (const robot of state.robots) {
            if (isPreview && robot.id === 'player') continue;
            if (!robot.isAlive) {
              if (robot.respawnTimer > 0) robot.respawnTimer--;
              continue;
            }
            if (!isPreview && battleEndedRef.current) continue;

            if (robot.invulnerableTimer > 0) robot.invulnerableTimer--;
            if (robot.energy < robot.maxEnergy) robot.energy = Math.min(robot.maxEnergy, robot.energy + ENERGY_REGEN);

            const es = evals.get(robot.id);
            const hasErr = errors.has(robot.id);
            if (es && !hasErr) {
              const foe = state.robots.find(r => r.id !== robot.id);
              if (foe) {
                const action = tickEvaluator(es, robot, foe, state.projectiles, nextId);
                if (action) {
                  if (action.type === 'scan') {
                    startFovSweep(fovTimerRef.current, robot.id);
                  }
                  applyAction(action, robot, state.projectiles, nextId);
                }
              }
            }
          }
        }
      }

      for (const robot of state.robots) {
        const runtimeRobot = robot as RuntimeArenaRobot;
        if ((runtimeRobot._fireCooldown ?? 0) > 0) {
          runtimeRobot._fireCooldown = (runtimeRobot._fireCooldown ?? 0) - 1;
        }
      }

      for (const [id, t] of fovTimerRef.current) {
        if (t > 0) fovTimerRef.current.set(id, t - 1);
      }
      if (flashTimerRef.current > 0) flashTimerRef.current--;

      // Projectile physics — skipped in streaming mode
      if (!streamingMode) {
        for (let i = state.projectiles.length - 1; i >= 0; i--) {
          const p = state.projectiles[i];
          p.x += p.vx; p.y += p.vy; p.life--;
          let hit = false;
          for (const robot of state.robots) {
            if (robot.id === p.ownerId || !robot.isAlive || robot.invulnerableTimer > 0) continue;
            if (hitCheck(p, robot)) {
              if (previewModeRef.current && robot.id === 'player') {
                state.projectiles.splice(i, 1);
                hit = true;
                break;
              }
              robot.health = Math.max(0, robot.health - (p.damage ?? FIRE_DAMAGE));
              state.projectiles.splice(i, 1);
              hit = true;
              if (robot.health <= 0) {
                robot.isAlive = false;
                flashTimerRef.current = FLASH_DURATION;
                robot.respawnTimer = RESPAWN_DELAY;
                robot.energy = 0;

                if (!previewModeRef.current && !battleEndedRef.current) {
                  battleEndedRef.current = true;
                  const otherRobot = state.robots.find(r => r.id !== robot.id);
                  const winner: 'player' | 'enemy' | 'draw' =
                    (otherRobot && !otherRobot.isAlive) ? 'draw'
                      : robot.id === 'player' ? 'enemy'
                        : 'player';
                  setTimeout(() => onBattleEndRef.current?.(winner), BATTLE_END_DELAY_MS);
                }
              }
              break;
            }
          }
          if (!hit) {
            for (const obs of state.obstacles) {
              if (obs.type !== 'SOLID') continue;
              const left = obs.x - obs.w / 2;
              const right = obs.x + obs.w / 2;
              const top = obs.y - obs.h / 2;
              const bottom = obs.y + obs.h / 2;
              if (p.x >= left && p.x <= right && p.y >= top && p.y <= bottom) {
                state.projectiles.splice(i, 1);
                hit = true;
                break;
              }
            }
          }

          if (!hit && (p.life <= 0 || p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05)) {
            state.projectiles.splice(i, 1);
          }
        }
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
        ctx.fillText('⚠ PLAYER SCRIPT ERROR', 8, H - 7); ctx.restore();
      }
      if (errors.has('enemy')) {
        ctx.save(); ctx.fillStyle = '#ef4444';
        ctx.font = `bold ${Math.max(10, W * 0.022)}px monospace`;
        ctx.textAlign = 'left'; ctx.globalAlpha = 0.5 + Math.sin(state.tick * 0.08) * 0.3;
        ctx.fillText('⚠ ENEMY SCRIPT ERROR', 8, 14); ctx.restore();
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
