"use client";
// ─────────────────────────────────────────────────────────────────────────────
// ArenaCanvas — 2D canvas mini-arena renderer.
//
// Preview mode (no userScript):
//   • Blue robot is a static dummy — it never moves or fires.
//   • Red enemy runs its scene tick() function which directly encodes the
//     problem's described behaviour (phase-state machine per level).
//   • When blue's health reaches 0 → death flash → scene resets → loops.
//
// Battle mode (userScript provided):
//   • Both robots run their evaluators normally.
//   • Standard respawn logic applies.
//
// Visual extras:
//   • FOV cone drawn during scan actions (from scene tick signal).
//   • Smooth 60fps, IntersectionObserver pause when off-screen.
//   • Zero React re-renders during animation.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, memo } from "react";
import type { SceneDef, SceneState, ArenaRobot, ArenaProjectile, ArenaObstacle } from "./arenaScenes";
import { createEvalState, tickEvaluator } from "./miniEvaluator";
import type { EvalState, EvalAction } from "./miniEvaluator";
import { getEnemyScript } from "./levelScripts";
import type { ScriptState } from "./sceneScriptEngine";
import { tickScript } from "./sceneScriptEngine";

interface ArenaCanvasProps {
  scene: SceneDef;
  levelId: string;
  userScript?: string;
  enemyScript?: string;
  aspectRatio?: number;
  className?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const FIRE_DAMAGE    = 25;
const BURST_DAMAGE   = 8;
const BURST_SPREAD   = 0.12;
const PROJ_SPEED     = 0.014;
const PROJ_LIFE      = 70;
const ROBOT_SIZE     = 0.035;
const RESPAWN_DELAY  = 90;
const INVULN_TICKS   = 30;
const ENERGY_REGEN   = 0.5;
const FOV_HALF       = 0.9;   // radians — half-angle of FOV cone
const FOV_RANGE      = 0.55;  // normalised
const FLASH_DURATION = 24;    // frames of white kill-flash

// ── Drawing helpers ──────────────────────────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number, rgb: string): void {
  ctx.save();
  ctx.strokeStyle = `rgba(${rgb},0.04)`;
  ctx.lineWidth = 0.5;
  const step = Math.min(W, H) / 10;
  for (let x = 0; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y <= H; y += step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();
}

function drawScanLine(ctx: CanvasRenderingContext2D, W: number, H: number, tick: number, rgb: string): void {
  const y = (tick * 1.4) % H;
  ctx.save();
  const g = ctx.createLinearGradient(0, y-4, 0, y+4);
  g.addColorStop(0, 'transparent');
  g.addColorStop(0.5, `rgba(${rgb},0.03)`);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, y-4, W, 8);
  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: ArenaObstacle, W: number, H: number): void {
  const px = obs.x*W, py = obs.y*H, pw = obs.w*W, ph = obs.h*H;
  ctx.save();
  ctx.translate(px, py);
  const cm: Record<string,{fill:string;stroke:string}> = {
    SOLID: { fill:'rgba(100,120,140,0.25)', stroke:'rgba(100,140,180,0.4)' },
    TRAP:  { fill:'rgba(245,158,11,0.12)',  stroke:'rgba(245,158,11,0.35)' },
    LAVA:  { fill:'rgba(239,68,68,0.15)',   stroke:'rgba(239,68,68,0.45)' },
  };
  const c = cm[obs.type];
  ctx.fillStyle = c.fill;
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 1;
  ctx.fillRect(-pw/2, -ph/2, pw, ph);
  ctx.strokeRect(-pw/2, -ph/2, pw, ph);
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
  ctx.save();
  ctx.globalAlpha = alpha * 0.18;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, range, robot.angle - FOV_HALF, robot.angle + FOV_HALF);
  ctx.closePath();
  ctx.fillStyle = robot.color;
  ctx.fill();
  // Outline arc
  ctx.globalAlpha = alpha * 0.45;
  ctx.strokeStyle = robot.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px, py, range, robot.angle - FOV_HALF, robot.angle + FOV_HALF);
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
  const px = robot.x*W, py = robot.y*H;
  const r = robot.size * Math.min(W,H);
  const invPulse = robot.invulnerableTimer > 0 ? 0.3 + Math.sin(tick*0.3)*0.3 : 0;
  const a = robot.invulnerableTimer > 0 ? 0.4 + invPulse : 1;

  // FOV cone first (behind robot)
  drawFovCone(ctx, robot, W, H, fovAlpha);

  ctx.save();
  ctx.translate(px, py);
  ctx.globalAlpha = a;

  // Glow
  const glowR = r*(1.8 + Math.sin(tick*0.05)*0.15);
  const grd = ctx.createRadialGradient(0,0,r*0.3,0,0,glowR);
  grd.addColorStop(0, `${robot.color}30`);
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0,0,glowR,0,Math.PI*2); ctx.fill();

  // Hull
  ctx.rotate(robot.angle);
  ctx.beginPath();
  for (let i=0; i<6; i++) {
    const ang = (i/6)*Math.PI*2 - Math.PI/6;
    const rx=Math.cos(ang)*r, ry=Math.sin(ang)*r*0.8;
    i===0 ? ctx.moveTo(rx,ry) : ctx.lineTo(rx,ry);
  }
  ctx.closePath();
  ctx.fillStyle = `${robot.color}22`;
  ctx.strokeStyle = robot.color;
  ctx.lineWidth = 1.5;
  ctx.fill(); ctx.stroke();

  // Barrel
  ctx.strokeStyle = robot.color;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r*0.2,0); ctx.lineTo(r*1.4,0); ctx.stroke();

  // Core
  ctx.fillStyle = robot.color;
  ctx.beginPath(); ctx.arc(0,0,r*0.28,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // Health bar
  const bw=r*3, bh=3, bx=px-bw/2, by=py-r*2-bh;
  const hp = robot.health/robot.maxHealth;
  ctx.save(); ctx.globalAlpha=a;
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,by,bw,bh);
  ctx.fillStyle = hp>0.5 ? '#22d3ee' : hp>0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(bx,by,bw*hp,bh);
  // Energy bar
  const ep = robot.energy/robot.maxEnergy;
  ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(bx,by-5,bw,2);
  ctx.fillStyle = ep>0.5?'#a78bfa':ep>0.25?'#f59e0b':'#ef4444';
  ctx.fillRect(bx,by-5,bw*ep,2);
  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: ArenaProjectile, W: number, H: number): void {
  const px=p.x*W, py=p.y*H;
  ctx.save();
  const g = ctx.createRadialGradient(px,py,0,px,py,6);
  g.addColorStop(0, p.color);
  g.addColorStop(0.5, `${p.color}80`);
  g.addColorStop(1,'transparent');
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.arc(px,py,6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ffffff';
  ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawGraphNet(ctx: CanvasRenderingContext2D, W: number, H: number, tick: number, rgb: string): void {
  const nodes=[{x:0.5,y:0.5},{x:0.65,y:0.3},{x:0.8,y:0.55},{x:0.7,y:0.75},{x:0.55,y:0.8},{x:0.75,y:0.2}];
  ctx.save();
  ctx.strokeStyle=`rgba(${rgb},0.08)`; ctx.lineWidth=0.8;
  for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){
    ctx.beginPath(); ctx.moveTo(nodes[i].x*W,nodes[i].y*H); ctx.lineTo(nodes[j].x*W,nodes[j].y*H); ctx.stroke();
  }
  nodes.forEach((n,i)=>{
    const p=0.5+Math.sin(tick*0.04+i*1.2)*0.3;
    ctx.strokeStyle=`rgba(${rgb},${p*0.4})`; ctx.beginPath(); ctx.arc(n.x*W,n.y*H,4,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle=`rgba(${rgb},${0.5+Math.sin(tick*0.04)*0.3})`; ctx.fill();
  });
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, label: string, W: number, H: number, rgb: string): void {
  ctx.save();
  ctx.font=`500 ${Math.max(9,W*0.018)}px monospace`;
  ctx.fillStyle=`rgba(${rgb},0.35)`;
  ctx.textAlign='right';
  ctx.fillText(label.toUpperCase(), W-8, H-7);
  ctx.restore();
}

// ── Physics helpers ──────────────────────────────────────────────────────────

function hitCheck(p: ArenaProjectile, robot: ArenaRobot): boolean {
  if (!robot.isAlive) return false;
  const dx=p.x-robot.x, dy=p.y-robot.y;
  return Math.sqrt(dx*dx+dy*dy) < ROBOT_SIZE*2;
}

function applyAction(
  action: EvalAction,
  robot: ArenaRobot,
  projs: ArenaProjectile[],
  nextId: { current: number },
): void {
  switch (action.type) {
    case 'fire': {
      const a=action.value, d=robot.size*2;
      projs.push({ id:nextId.current++, x:robot.x+Math.cos(a)*d, y:robot.y+Math.sin(a)*d,
        vx:Math.cos(a)*PROJ_SPEED, vy:Math.sin(a)*PROJ_SPEED,
        color:robot.trailColor, ownerId:robot.id, life:PROJ_LIFE, damage:FIRE_DAMAGE });
      break;
    }
    case 'burst': {
      const d=robot.size*2;
      for(let i=-1;i<=1;i++){
        const a=action.value+BURST_SPREAD*i;
        projs.push({ id:nextId.current++, x:robot.x+Math.cos(a)*d, y:robot.y+Math.sin(a)*d,
          vx:Math.cos(a)*PROJ_SPEED, vy:Math.sin(a)*PROJ_SPEED,
          color:robot.trailColor, ownerId:robot.id, life:PROJ_LIFE, damage:BURST_DAMAGE });
      }
      break;
    }
    case 'move': {
      const spd = action.fast ? 0.025 : 0.012;
      if (action.value===-1) { robot.x-=Math.cos(robot.angle)*spd; robot.y-=Math.sin(robot.angle)*spd; }
      else { robot.x+=Math.cos(robot.angle)*spd; robot.y+=Math.sin(robot.angle)*spd; }
      robot.x=Math.max(ROBOT_SIZE,Math.min(1-ROBOT_SIZE,robot.x));
      robot.y=Math.max(ROBOT_SIZE,Math.min(1-ROBOT_SIZE,robot.y));
      break;
    }
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export const ArenaCanvas = memo(function ArenaCanvas({
  scene,
  levelId,
  userScript,
  enemyScript: enemyScriptProp,
  aspectRatio = 16/7,
  className = "",
}: ArenaCanvasProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const stateRef    = useRef<SceneState>(scene.init());
  const evalRef     = useRef<Map<string, EvalState|null>>(new Map());
  const rafRef      = useRef<number>(0);
  const visibleRef  = useRef(true);
  const nextIdRef   = useRef({ current: 0 });
  const errRef         = useRef<Set<string>>(new Set());
  const scriptStateRef = useRef<ScriptState | null>(null);

  // Preview-mode state (enemy FOV + blue-death reset loop)
  const fovTimerRef    = useRef(0);   // frames remaining to show FOV cone
  const flashTimerRef  = useRef(0);   // kill-flash frames remaining
  const fovScanTimerRef = useRef(0);  // frames since scan started (counts up)
  const fovFadeRef      = useRef(0);  // frames into scan fade-out

  const previewMode = !userScript;

  useEffect(() => {
    const s = scene.init();
    if (!s.local) s.local = {};
    stateRef.current = s;
    nextIdRef.current.current = 0;
    fovTimerRef.current = 0;
    flashTimerRef.current = 0;

    if (scene.script) {
      scriptStateRef.current = { phaseIdx: 0, phaseTick: 0, script: scene.script };
    } else {
      scriptStateRef.current = null;
    }

    const evals = new Map<string, EvalState|null>();
    const errors = new Set<string>();

    if (!previewMode) {
      const playerState = createEvalState(userScript ?? '');
      if (!playerState) errors.add('player');
      evals.set('player', playerState);
    }
    if (!previewMode || !scene.script) {
      const enemyScr = enemyScriptProp || getEnemyScript(levelId) || '';
      const enemyState = createEvalState(enemyScr);
      if (!enemyState) errors.add('enemy');
      evals.set('enemy', enemyState);
    }

    evalRef.current = evals;
    errRef.current = errors;
  }, [scene, levelId, userScript, enemyScriptProp, previewMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const io = new IntersectionObserver(
      ([e]) => { visibleRef.current = e.isIntersecting; },
      { threshold: 0.1 },
    );
    io.observe(canvas);

    let lastTime = 0;
    const FRAME_MS = 1000/60;
    let evalTick = 0;

    const render = (now: number) => {
      rafRef.current = requestAnimationFrame(render);
      if (!visibleRef.current) return;
      if (now - lastTime < FRAME_MS - 2) return;
      lastTime = now;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W=canvas.width, H=canvas.height;
      const state=stateRef.current;
      const evals=evalRef.current;
      const nextId=nextIdRef.current;
      const errors=errRef.current;
      const css=getComputedStyle(document.documentElement);
      const rgb=css.getPropertyValue('--accent-rgb').trim()||'34,211,238';

      let scanAlpha = 0;

      // ── Scene tick ──────────────────────────────────────────────────────────
      scene.tick(state);
      state.tick++;

      // ── Script tick (every frame, preview mode) ────────────────────────────
      if (previewMode && scriptStateRef.current) {
        const enemy = state.robots.find(r => r.id === 'enemy');
        const player = state.robots.find(r => r.id === 'player');
        if (enemy && player && enemy.isAlive) {
          tickScript(scriptStateRef.current, enemy, player, state.projectiles, nextId, state.local ?? {});
          scanAlpha = state.local?.scanning ?? 0;
          if (state.local) state.local.scanning = 0;
        }
      }

      // ── FOV cone animation (fade in 10f, hold, fade out 15f) ──────────────
      if (scanAlpha === 1) {
        if (fovFadeRef.current > 0) {
          fovFadeRef.current = 0;
          fovScanTimerRef.current = 0;
        } else if (fovScanTimerRef.current === 0) {
          fovScanTimerRef.current = 1;
        } else {
          fovScanTimerRef.current++;
        }
      } else if (fovScanTimerRef.current > 0) {
        fovFadeRef.current++;
      }

      if (fovFadeRef.current > 0) {
        const t = fovFadeRef.current / 15;
        if (t >= 1) {
          fovFadeRef.current = 0;
          fovScanTimerRef.current = 0;
          scanAlpha = 0;
        } else {
          scanAlpha = 0.3 * (1 - t);
        }
      } else if (fovScanTimerRef.current > 0) {
        if (fovScanTimerRef.current <= 10) {
          scanAlpha = (fovScanTimerRef.current / 10) * 0.3;
        } else {
          scanAlpha = 0.3 + Math.sin(state.tick * 0.12) * 0.03;
        }
      }

      // ── Evaluator tick (every 6 frames ≈10Hz, fallback when no script) ────
      evalTick++;
      if (evalTick >= 6) {
        evalTick = 0;
        const useEval = !previewMode || !scene.script;
        for (const robot of state.robots) {
          if (previewMode && robot.id === 'player') continue;
          if (!robot.isAlive) {
            if (robot.respawnTimer > 0) {
              robot.respawnTimer--;
              if (robot.respawnTimer === 0) {
                robot.health = robot.maxHealth;
                robot.energy = robot.maxEnergy;
                robot.isAlive = true;
                robot.invulnerableTimer = INVULN_TICKS;
                robot.x = robot.id==='player' ? 0.2 : 0.75;
                robot.y = 0.5;
                const scr = robot.id==='player' ? (userScript??'') : (enemyScriptProp||getEnemyScript(levelId)||'');
                evals.set(robot.id, createEvalState(scr));
              }
            }
            continue;
          }
          if (robot.invulnerableTimer > 0) robot.invulnerableTimer--;
          if (robot.energy < robot.maxEnergy) robot.energy = Math.min(robot.maxEnergy, robot.energy+ENERGY_REGEN);

          if (useEval) {
            const es = evals.get(robot.id);
            const hasErr = errors.has(robot.id);
            if (es && !hasErr) {
              const foe = state.robots.find(r=>r.id!==robot.id)!;
              const action = tickEvaluator(es, robot, foe, state.projectiles, nextId);
              if (action) {
                if (action.type==='scan' && robot.id==='enemy') {
                  fovTimerRef.current = 30;
                }
                applyAction(action, robot, state.projectiles, nextId);
              }
            }
          }
        }
      }

      // ── FOV timer decay ─────────────────────────────────────────────────────
      if (fovTimerRef.current > 0) fovTimerRef.current--;
      if (flashTimerRef.current > 0) flashTimerRef.current--;

      // ── Projectile physics ────────────────────────────────────────────────
      for (let i=state.projectiles.length-1;i>=0;i--) {
        const p=state.projectiles[i];
        p.x+=p.vx; p.y+=p.vy; p.life--;
        let hit=false;
        for (const robot of state.robots) {
          if (robot.id===p.ownerId || !robot.isAlive || robot.invulnerableTimer>0) continue;
          if (hitCheck(p,robot)) {
            if (previewMode && robot.id==='player') {
              state.projectiles.splice(i,1);
              hit=true;
              break;
            }
            robot.health=Math.max(0,robot.health-(p.damage??FIRE_DAMAGE));
            state.projectiles.splice(i,1);
            hit=true;
            if (robot.health<=0) {
              robot.isAlive=false;
              flashTimerRef.current=FLASH_DURATION;
              robot.respawnTimer=RESPAWN_DELAY;
              robot.energy=0;
            }
            break;
          }
        }
        if (!hit && (p.life<=0||p.x<-0.05||p.x>1.05||p.y<-0.05||p.y>1.05)) {
          state.projectiles.splice(i,1);
        }
      }

      // ── Render ────────────────────────────────────────────────────────────
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='rgba(3,7,18,0.92)';
      ctx.fillRect(0,0,W,H);
      drawGrid(ctx,W,H,rgb);
      drawScanLine(ctx,W,H,state.tick,rgb);

      if (/PATHFIND|gfx|GRAPH|NODE|EDGE|BREADTH|DEPTH|CYCLE|SPANNING|TOPOLOGICAL|DIJKSTRA|ORACLE/.test(scene.label)) {
        drawGraphNet(ctx,W,H,state.tick,rgb);
      }

      state.obstacles.forEach(obs=>drawObstacle(ctx,obs,W,H));

      // Preview FOV cone (red, 60°, drawn before robots)
      if (previewMode) {
        const enemy = state.robots.find(r=>r.id==='enemy');
        if (enemy && enemy.isAlive && scanAlpha > 0) {
          const px = enemy.x*W, py = enemy.y*H;
          const range = 0.45 * Math.min(W, H);
          const halfAngle = Math.PI / 6;
          ctx.save();
          ctx.globalAlpha = Math.min(1, scanAlpha) * 0.2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.arc(px, py, range, enemy.angle - halfAngle, enemy.angle + halfAngle);
          ctx.closePath();
          ctx.fillStyle = 'rgba(239, 68, 68, 1)';
          ctx.fill();
          ctx.restore();
        }
      }

      state.projectiles.forEach(p=>drawProjectile(ctx,p,W,H));

      const enemy = state.robots.find(r=>r.id==='enemy');
      const player = state.robots.find(r=>r.id==='player');
      const fovA = fovTimerRef.current/30;

      if (enemy) drawRobot(ctx,enemy,W,H,state.tick, fovA);
      if (player) drawRobot(ctx,player,W,H,state.tick, 0);

      // Kill flash
      if (flashTimerRef.current > 0) {
        const fa = (flashTimerRef.current/FLASH_DURATION)*0.35;
        ctx.save();
        ctx.globalAlpha=fa;
        ctx.fillStyle='#ffffff';
        ctx.fillRect(0,0,W,H);
        ctx.restore();
      }

      // Error indicators
      if (errors.has('player') && !previewMode) {
        ctx.save(); ctx.fillStyle='#f59e0b';
        ctx.font=`bold ${Math.max(10,W*0.022)}px monospace`;
        ctx.textAlign='left'; ctx.globalAlpha=0.5+Math.sin(state.tick*0.08)*0.3;
        ctx.fillText('⚠ PLAYER SCRIPT ERROR',8,H-7); ctx.restore();
      }
      if (errors.has('enemy')) {
        ctx.save(); ctx.fillStyle='#ef4444';
        ctx.font=`bold ${Math.max(10,W*0.022)}px monospace`;
        ctx.textAlign='left'; ctx.globalAlpha=0.5+Math.sin(state.tick*0.08)*0.3;
        ctx.fillText('⚠ ENEMY SCRIPT ERROR',8,14); ctx.restore();
      }

      drawLabel(ctx,scene.label,W,H,rgb);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(rafRef.current); io.disconnect(); };
  }, [scene, levelId, userScript, enemyScriptProp, previewMode]);

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
        style={{ imageRendering:'crisp-edges' }}
      />
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-accent/30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-accent/30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-accent/30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-accent/30 pointer-events-none" />
      {/* Live badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
        <span
          className="w-1.5 h-1.5 rounded-full bg-accent"
          style={{ animation:'pulse 1.5s ease-in-out infinite', boxShadow:'0 0 6px var(--accent)' }}
        />
        <span className="text-[10px] md:text-[8px] font-mono font-bold tracking-[0.2em] text-accent/60 uppercase">LIVE</span>
      </div>
    </div>
  );
});
