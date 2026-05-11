// ─────────────────────────────────────────────────────────────────────────────
// SceneScript Engine — generic phase-based enemy behaviour driver.
//
// Used in preview mode to animate the red robot through a sequence of phases
// that mirror each level's problem description.  Replaces the AliScript
// evaluator with a declarative, per-level choreography.
// ─────────────────────────────────────────────────────────────────────────────
import type { ArenaRobot, ArenaProjectile } from './arenaScenes';

// ── Types ────────────────────────────────────────────────────────────────────

export type PhaseAction =
  | { type: 'moveTo'; x: number; y?: number }
  | { type: 'moveDir'; dir: 'left' | 'right' }
  | { type: 'fire' }
  | { type: 'burst' }
  | { type: 'scan' }
  | { type: 'rotate'; angle: number }
  | { type: 'idle' };

export interface ScriptPhase {
  action: PhaseAction;
  /** Duration in frames (at 60 fps) */
  ticks: number;
}

export interface SceneScript {
  phases: ScriptPhase[];
  /** Restart from phase 0 when all phases are exhausted */
  loop: boolean;
}

export interface ScriptState {
  phaseIdx: number;
  phaseTick: number;
  script: SceneScript;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MOVE_SPEED = 0.004;
const PROJ_SPEED = 0.014;
const PROJ_LIFE = 70;
const FIRE_DAMAGE = 25;
const BURST_DAMAGE = 8;
const BURST_SPREAD = 0.15;
const CLAMP_MARGIN = 0.035;
const ENERGY_COST: Record<string, number> = {
  fire: 8,
  burst: 18,
  movePerFrame: 0.35,
  scan: 3,
  rotate: 5,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function angleTo(a: number, b: number, ax: number, ay: number): number {
  return Math.atan2(b - ay, a - ax);
}

// ── Tick ─────────────────────────────────────────────────────────────────────

export function tickScript(
  st: ScriptState,
  robot: ArenaRobot,
  enemy: ArenaRobot,
  projectiles: ArenaProjectile[],
  nextProjId: { current: number },
  sceneLocal: Record<string, unknown>,
): void {
  const phase = st.script.phases[st.phaseIdx];
  if (!phase) return;

  st.phaseTick++;

  const { action } = phase;

  switch (action.type) {
    case 'moveTo': {
      robot.energy = Math.max(0, robot.energy - ENERGY_COST.movePerFrame);
      const tx = action.x;
      const ty = action.y ?? enemy.y;
      const dx = tx - robot.x;
      const dy = ty - robot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > MOVE_SPEED) {
        robot.angle = Math.atan2(dy, dx);
        robot.x += (dx / dist) * MOVE_SPEED;
        robot.y += (dy / dist) * MOVE_SPEED;
      } else {
        robot.x = tx;
        robot.y = ty;
      }
      robot.x = clamp(robot.x, CLAMP_MARGIN, 1 - CLAMP_MARGIN);
      robot.y = clamp(robot.y, CLAMP_MARGIN, 1 - CLAMP_MARGIN);
      break;
    }

    case 'moveDir': {
      robot.energy = Math.max(0, robot.energy - ENERGY_COST.movePerFrame);
      robot.angle = action.dir === 'right' ? 0 : Math.PI;
      robot.x += action.dir === 'right' ? MOVE_SPEED : -MOVE_SPEED;
      robot.x = clamp(robot.x, CLAMP_MARGIN, 1 - CLAMP_MARGIN);
      break;
    }

    case 'fire': {
      if (st.phaseTick !== 1) break;
      if (!enemy.isAlive) break;
      robot.energy = Math.max(0, robot.energy - ENERGY_COST.fire);
      const a = angleTo(enemy.x, enemy.y, robot.x, robot.y);
      robot.angle = a;
      const d = robot.size * 2;
      projectiles.push({
        id: nextProjId.current++,
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
      if (st.phaseTick !== 1) break;
      if (!enemy.isAlive) break;
      robot.energy = Math.max(0, robot.energy - ENERGY_COST.burst);
      const a = angleTo(enemy.x, enemy.y, robot.x, robot.y);
      robot.angle = a;
      const d = robot.size * 2;
      for (let i = -1; i <= 1; i++) {
        const ba = a + BURST_SPREAD * i;
        projectiles.push({
          id: nextProjId.current++,
          x: robot.x + Math.cos(ba) * d,
          y: robot.y + Math.sin(ba) * d,
          vx: Math.cos(ba) * PROJ_SPEED,
          vy: Math.sin(ba) * PROJ_SPEED,
          color: robot.trailColor,
          ownerId: robot.id,
          life: PROJ_LIFE,
          damage: BURST_DAMAGE,
        });
      }
      break;
    }

    case 'scan':
      if (st.phaseTick === 1) robot.energy = Math.max(0, robot.energy - ENERGY_COST.scan);
      robot.angle = angleTo(enemy.x, enemy.y, robot.x, robot.y);
      sceneLocal.scanning = 1;
      break;

    case 'rotate':
      if (st.phaseTick === 1) robot.energy = Math.max(0, robot.energy - ENERGY_COST.rotate);
      robot.angle = action.angle;
      break;

    case 'idle':
      break;
  }

  // Advance to next phase when duration is exhausted
  if (st.phaseTick >= phase.ticks) {
    st.phaseIdx++;
    st.phaseTick = 0;

    if (st.phaseIdx >= st.script.phases.length) {
      if (st.script.loop) {
        st.phaseIdx = 0;
      }
    }
  }
}
