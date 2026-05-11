// ─────────────────────────────────────────────────────────────────────────────
// Arena Scenes — per-level scripted 2D battle definitions.
//
// Each scene defines the starting state (robot positions, obstacles) and
// optional per-tick decoration. Behavioral uniqueness comes from the
// AliScript evaluator running each level's enemyScript / userScript.
//
// Design goals:
//   • All positions are 0–1 normalised.
//   • Each of the 60 campaign levels has a unique scene.
//   • The canvas engine handles projectile physics, collision, death/respawn.
// ─────────────────────────────────────────────────────────────────────────────

import type { SceneScript } from './sceneScriptEngine';
import { SCRIPTS } from './sceneScripts';

export interface ArenaRobot {
  id: 'player' | 'enemy';
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  isAlive: boolean;
  respawnTimer: number;
  invulnerableTimer: number;
  color: string;
  trailColor: string;
  speed: number;
  size: number;
  /** Cooldown ticks between moves */
  moveCooldown: number;
  /** Current movement velocity (0–1 space / tick) */
  vx: number;
  vy: number;
}

export interface ArenaProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  ownerId: 'player' | 'enemy';
  life: number;
  damage: number;
}

export interface ArenaObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'SOLID' | 'TRAP' | 'LAVA';
}

export interface SceneLocal {
  scanning?: number;
  [key: string]: unknown;
}

export interface SceneState {
  tick: number;
  robots: ArenaRobot[];
  projectiles: ArenaProjectile[];
  obstacles: ArenaObstacle[];
  nextProjId: number;
  local?: SceneLocal;
}

export interface SceneDef {
  label: string;
  init: () => SceneState;
  tick: (state: SceneState) => void;
  script?: SceneScript;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TAU = Math.PI * 2;

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function makeRobot(
  partial: Partial<ArenaRobot> & Pick<ArenaRobot, 'id' | 'x' | 'y' | 'color' | 'trailColor'>,
): ArenaRobot {
  return {
    angle: 0,
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    isAlive: true,
    respawnTimer: 0,
    invulnerableTimer: 0,
    speed: 0.002,
    size: 0.035,
    moveCooldown: 0,
    vx: 0,
    vy: 0,
    ...partial,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene: cond-01 — BINARY REFLEX
// ─────────────────────────────────────────────────────────────────────────────
const sc_cond01: SceneDef = {
  label: 'BINARY REFLEX — scan or advance',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.45, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.55, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: cond-02 — MIRROR PROTOCOL
// ─────────────────────────────────────────────────────────────────────────────
const sc_cond02: SceneDef = {
  label: 'MIRROR PROTOCOL — symmetry combat',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff8080' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: cond-03 — SENTINEL OVERRIDE
// ─────────────────────────────────────────────────────────────────────────────
const sc_cond03: SceneDef = {
  label: 'SENTINEL OVERRIDE — triple burst',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.35, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.82, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: cond-04 — FORKED JUDGMENT
// ─────────────────────────────────────────────────────────────────────────────
const sc_cond04: SceneDef = {
  label: 'FORKED JUDGMENT — three branches',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.25, w: 0.03, h: 0.03, type: 'LAVA' },
      { x: 0.65, y: 0.75, w: 0.03, h: 0.03, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.6, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.4, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: cond-05 — THRESHOLD GATE
// ─────────────────────────────────────────────────────────────────────────────
const sc_cond05: SceneDef = {
  label: 'THRESHOLD GATE — combined threat',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.18, w: 0.4, h: 0.03, type: 'SOLID' },
      { x: 0.5, y: 0.82, w: 0.4, h: 0.03, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: cond-06 — POLARITY SWITCH
// ─────────────────────────────────────────────────────────────────────────────
const sc_cond06: SceneDef = {
  label: 'POLARITY SWITCH — delayed echo fire',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.02, h: 0.5, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.3, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.7, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: cond-07 — CASCADE REACTOR
// ─────────────────────────────────────────────────────────────────────────────
const sc_cond07: SceneDef = {
  label: 'CASCADE REACTOR — nested conditionals',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.4, y: 0.5, w: 0.05, h: 0.05, type: 'SOLID' },
      { x: 0.6, y: 0.5, w: 0.05, h: 0.05, type: 'SOLID' },
      { x: 0.5, y: 0.35, w: 0.05, h: 0.05, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: cond-08 — DEAD RECKONING
// ─────────────────────────────────────────────────────────────────────────────
const sc_cond08: SceneDef = {
  label: 'DEAD RECKONING — direction variable',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.3, w: 0.3, h: 0.03, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.7, angle: Math.PI * 0.75, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.3, angle: 0.5, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: cond-09 — QUANTUM OBSERVER
// ─────────────────────────────────────────────────────────────────────────────
const sc_cond09: SceneDef = {
  label: 'QUANTUM OBSERVER — two measurements',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.08, h: 0.08, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.6, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: cond-10 — ARBITER PRIME
// ─────────────────────────────────────────────────────────────────────────────
const sc_cond10: SceneDef = {
  label: 'ARBITER PRIME — full decision tree',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.35, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.65, y: 0.65, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.5, y: 0.15, w: 0.04, h: 0.04, type: 'LAVA' },
      { x: 0.5, y: 0.85, w: 0.04, h: 0.04, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.85, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ── Loops ───────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Scene: loop-01 — PULSE DRUM
// ─────────────────────────────────────────────────────────────────────────────
const sc_loop01: SceneDef = {
  label: 'PULSE DRUM — five steady beats',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: loop-02 — PATROL CIRCUIT
// ─────────────────────────────────────────────────────────────────────────────
const sc_loop02: SceneDef = {
  label: 'PATROL CIRCUIT — marching loop',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.3, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.7, w: 0.5, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: loop-03 — ADAPTIVE VORTEX
// ─────────────────────────────────────────────────────────────────────────────
const sc_loop03: SceneDef = {
  label: 'ADAPTIVE VORTEX — scan cycles',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.05, h: 0.05, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.35, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.65, angle: 0.3, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: loop-04 — RAMP PROTOCOL
// ─────────────────────────────────────────────────────────────────────────────
const sc_loop04: SceneDef = {
  label: 'RAMP PROTOCOL — escalating fire',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.15, w: 0.5, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: loop-05 — SEEK AND DESTROY
// ─────────────────────────────────────────────────────────────────────────────
const sc_loop05: SceneDef = {
  label: 'SEEK AND DESTROY — hunt loop',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.06, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: loop-06 — ECHO CHAMBER
// ─────────────────────────────────────────────────────────────────────────────
const sc_loop06: SceneDef = {
  label: 'ECHO CHAMBER — nested loops',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.02, h: 0.5, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.6, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: loop-07 — DECIMATOR MK-IV
// ─────────────────────────────────────────────────────────────────────────────
const sc_loop07: SceneDef = {
  label: 'DECIMATOR MK-IV — early exit',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.35, w: 0.4, h: 0.02, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.65, angle: Math.PI * 0.8, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.35, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: loop-08 — SINE WAVE
// ─────────────────────────────────────────────────────────────────────────────
const sc_loop08: SceneDef = {
  label: 'SINE WAVE — oscillation',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.4, y: 0.2, w: 0.02, h: 0.2, type: 'SOLID' },
      { x: 0.6, y: 0.8, w: 0.02, h: 0.2, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: loop-09 — CONVERGENCE ENGINE
// ─────────────────────────────────────────────────────────────────────────────
const sc_loop09: SceneDef = {
  label: 'CONVERGENCE ENGINE — two counters',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.25, w: 0.03, h: 0.03, type: 'LAVA' },
      { x: 0.65, y: 0.75, w: 0.03, h: 0.03, type: 'LAVA' },
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.82, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: loop-10 — INFINITE NEMESIS
// ─────────────────────────────────────────────────────────────────────────────
const sc_loop10: SceneDef = {
  label: 'INFINITE NEMESIS — berserker mode',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.08, h: 0.08, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.85, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.6, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ── Arrays ──────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Scene: arr-01 — ECHO LATTICE
// ─────────────────────────────────────────────────────────────────────────────
const sc_arr01: SceneDef = {
  label: 'ECHO LATTICE — fixed sensor array',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.3, y: 0.2, w: 0.02, h: 0.06, type: 'SOLID' },
      { x: 0.4, y: 0.2, w: 0.02, h: 0.06, type: 'SOLID' },
      { x: 0.5, y: 0.2, w: 0.02, h: 0.06, type: 'SOLID' },
      { x: 0.6, y: 0.2, w: 0.02, h: 0.06, type: 'SOLID' },
      { x: 0.7, y: 0.2, w: 0.02, h: 0.06, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.6, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.4, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: arr-02 — SEQUENCE WALKER
// ─────────────────────────────────────────────────────────────────────────────
const sc_arr02: SceneDef = {
  label: 'SEQUENCE WALKER — command array',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: arr-03 — SWARM VECTOR
// ─────────────────────────────────────────────────────────────────────────────
const sc_arr03: SceneDef = {
  label: 'SWARM VECTOR — visible enemy list',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.3, y: 0.5, w: 0.02, h: 0.3, type: 'SOLID' },
      { x: 0.7, y: 0.5, w: 0.02, h: 0.3, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: arr-04 — BURST TABLE
// ─────────────────────────────────────────────────────────────────────────────
const sc_arr04: SceneDef = {
  label: 'BURST TABLE — fire count array',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.6, angle: 0.1, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: arr-05 — WAYPOINT RUNNER
// ─────────────────────────────────────────────────────────────────────────────
const sc_arr05: SceneDef = {
  label: 'WAYPOINT RUNNER — step waypoints',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.4, y: 0.3, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.55, y: 0.3, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.7, y: 0.3, w: 0.02, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.6, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.4, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: arr-06 — PRIORITY QUEUE
// ─────────────────────────────────────────────────────────────────────────────
const sc_arr06: SceneDef = {
  label: 'PRIORITY QUEUE — sorted threats',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.25, w: 0.3, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.75, w: 0.3, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: arr-07 — OVERDRIVE MATRIX
// ─────────────────────────────────────────────────────────────────────────────
const sc_arr07: SceneDef = {
  label: 'OVERDRIVE MATRIX — 9-cell grid',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.35, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.35, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.65, y: 0.35, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.35, y: 0.5, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.65, y: 0.5, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.35, y: 0.65, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.65, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.65, y: 0.65, w: 0.02, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: arr-08 — TWIN ARRAYS
// ─────────────────────────────────────────────────────────────────────────────
const sc_arr08: SceneDef = {
  label: 'TWIN ARRAYS — cross-reference',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.4, y: 0.5, w: 0.02, h: 0.35, type: 'SOLID' },
      { x: 0.6, y: 0.5, w: 0.02, h: 0.35, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: arr-09 — RING BUFFER
// ─────────────────────────────────────────────────────────────────────────────
const sc_arr09: SceneDef = {
  label: 'RING BUFFER — circular memory',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.06, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.3, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.7, angle: 0.3, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: arr-10 — ARRAY OVERLORD
// ─────────────────────────────────────────────────────────────────────────────
const sc_arr10: SceneDef = {
  label: 'ARRAY OVERLORD — dynamic fire plan',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.3, y: 0.5, w: 0.02, h: 0.4, type: 'LAVA' },
      { x: 0.7, y: 0.5, w: 0.02, h: 0.4, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.82, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ── Data Structures ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Scene: ds-01 — STATE MACHINE ALPHA
// ─────────────────────────────────────────────────────────────────────────────
const sc_ds01: SceneDef = {
  label: 'STATE MACHINE — mode: 0/1/2',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.3, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.7, angle: 0.3, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: ds-02 — CONFIG OBJECT
// ─────────────────────────────────────────────────────────────────────────────
const sc_ds02: SceneDef = {
  label: 'CONFIG OBJECT — dict parameters',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.2, w: 0.4, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.6, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.4, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: ds-03 — COUNTER MAP
// ─────────────────────────────────────────────────────────────────────────────
const sc_ds03: SceneDef = {
  label: 'COUNTER MAP — hits vs misses',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.3, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: ds-04 — PHASE SHIFTER
// ─────────────────────────────────────────────────────────────────────────────
const sc_ds04: SceneDef = {
  label: 'PHASE SHIFTER — 3-phase dict',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.5, w: 0.02, h: 0.3, type: 'LAVA' },
      { x: 0.65, y: 0.5, w: 0.02, h: 0.3, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.6, angle: 0.1, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: ds-05 — NEMESIS PROTOCOL
// ─────────────────────────────────────────────────────────────────────────────
const sc_ds05: SceneDef = {
  label: 'NEMESIS PROTOCOL — position history',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: ds-06 — DUAL REGISTER
// ─────────────────────────────────────────────────────────────────────────────
const sc_ds06: SceneDef = {
  label: 'DUAL REGISTER — offense + defense',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.3, y: 0.2, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.7, y: 0.8, w: 0.02, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.6, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.4, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: ds-07 — INVENTORY SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const sc_ds07: SceneDef = {
  label: 'INVENTORY SYSTEM — ammo tracking',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.06, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.35, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.65, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: ds-08 — NEURAL MAP
// ─────────────────────────────────────────────────────────────────────────────
const sc_ds08: SceneDef = {
  label: 'NEURAL MAP — weighted learning',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.35, w: 0.35, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.65, w: 0.35, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: ds-09 — COMMAND STACK
// ─────────────────────────────────────────────────────────────────────────────
const sc_ds09: SceneDef = {
  label: 'COMMAND STACK — LIFO execution',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.4, y: 0.4, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.6, y: 0.6, w: 0.02, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.6, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: ds-10 — OVERLORD SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const sc_ds10: SceneDef = {
  label: 'OVERLORD SYSTEM — full dict warfare',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.3, y: 0.3, w: 0.03, h: 0.03, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.03, h: 0.03, type: 'SOLID' },
      { x: 0.7, y: 0.7, w: 0.03, h: 0.03, type: 'SOLID' },
      { x: 0.5, y: 0.15, w: 0.03, h: 0.03, type: 'LAVA' },
      { x: 0.5, y: 0.85, w: 0.03, h: 0.03, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.85, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ── Recursion ───────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Scene: rec-01 — ECHO PULSE
// ─────────────────────────────────────────────────────────────────────────────
const sc_rec01: SceneDef = {
  label: 'ECHO PULSE — repeated scan-fire',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: rec-02 — DOUBLE ECHO
// ─────────────────────────────────────────────────────────────────────────────
const sc_rec02: SceneDef = {
  label: 'DOUBLE ECHO — two call frames',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.3, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.35, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.65, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: rec-03 — DEPTH CHARGE
// ─────────────────────────────────────────────────────────────────────────────
const sc_rec03: SceneDef = {
  label: 'DEPTH CHARGE — decaying bursts',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.2, w: 0.3, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.8, w: 0.3, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: rec-04 — MIRROR RECURSION
// ─────────────────────────────────────────────────────────────────────────────
const sc_rec04: SceneDef = {
  label: 'MIRROR RECURSION — symmetric expansion',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.03, h: 0.03, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: rec-05 — FIBONACCI STRIKER
// ─────────────────────────────────────────────────────────────────────────────
const sc_rec05: SceneDef = {
  label: 'FIBONACCI STRIKER — 1,1,2,3,5',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: rec-06 — TOWER OF POWER
// ─────────────────────────────────────────────────────────────────────────────
const sc_rec06: SceneDef = {
  label: 'TOWER OF POWER — 3 layers',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.4, y: 0.3, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.3, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.6, y: 0.3, w: 0.02, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.6, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.4, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: rec-07 — BINARY SPLITTER
// ─────────────────────────────────────────────────────────────────────────────
const sc_rec07: SceneDef = {
  label: 'BINARY SPLITTER — range halving',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.25, w: 0.4, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.75, w: 0.4, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: rec-08 — FRACTAL STORM
// ─────────────────────────────────────────────────────────────────────────────
const sc_rec08: SceneDef = {
  label: 'FRACTAL STORM — 3×2×2 nested',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.05, h: 0.05, type: 'SOLID' },
      { x: 0.35, y: 0.35, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.65, y: 0.65, w: 0.02, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: rec-09 — CALL STACK OVERLOAD
// ─────────────────────────────────────────────────────────────────────────────
const sc_rec09: SceneDef = {
  label: 'CALL STACK OVERLOAD — descent + unwind',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.15, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.85, w: 0.5, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: rec-10 — OMEGA UNWIND
// ─────────────────────────────────────────────────────────────────────────────
const sc_rec10: SceneDef = {
  label: 'OMEGA UNWIND — 5-history unwind',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.06, type: 'SOLID' },
      { x: 0.3, y: 0.3, w: 0.02, h: 0.02, type: 'TRAP' },
      { x: 0.7, y: 0.7, w: 0.02, h: 0.02, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ── Graph Theory ────────────────────────────────────────────────────────────

const NODES_6 = [
  { x: 0.5, y: 0.5 }, { x: 0.65, y: 0.3 }, { x: 0.8, y: 0.55 },
  { x: 0.7, y: 0.75 }, { x: 0.55, y: 0.8 }, { x: 0.75, y: 0.2 },
];

function gfxDecoration(tick: number) {
  return (state: SceneState): void => {
    // No-op: graphite decoration drawn by the canvas engine
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene: gfx-01 — NODE WALKER
// ─────────────────────────────────────────────────────────────────────────────
const sc_gfx01: SceneDef = {
  label: 'NODE WALKER — linear 3-node',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.65, y: 0.3, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: gfx-02 — EDGE CRAWLER
// ─────────────────────────────────────────────────────────────────────────────
const sc_gfx02: SceneDef = {
  label: 'EDGE CRAWLER — 4-edge traversal',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.3, w: 0.4, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.7, w: 0.4, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: gfx-03 — BREADTH SCANNER
// ─────────────────────────────────────────────────────────────────────────────
const sc_gfx03: SceneDef = {
  label: 'BREADTH SCANNER — BFS style',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: gfx-04 — DEPTH PROBE
// ─────────────────────────────────────────────────────────────────────────────
const sc_gfx04: SceneDef = {
  label: 'DEPTH PROBE — DFS descent',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.2, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.8, w: 0.5, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.65, y: 0.3, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: gfx-05 — CYCLE DETECTOR
// ─────────────────────────────────────────────────────────────────────────────
const sc_gfx05: SceneDef = {
  label: 'CYCLE DETECTOR — patrol loop',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.35, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.65, angle: 0.3, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: gfx-06 — SHORTEST PATH
// ─────────────────────────────────────────────────────────────────────────────
const sc_gfx06: SceneDef = {
  label: 'SHORTEST PATH — greedy approach',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: gfx-07 — SPANNING TREE
// ─────────────────────────────────────────────────────────────────────────────
const sc_gfx07: SceneDef = {
  label: 'SPANNING TREE — root + children',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.03, h: 0.5, type: 'SOLID' },
      { x: 0.3, y: 0.25, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.7, y: 0.75, w: 0.02, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.3, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.7, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: gfx-08 — TOPOLOGICAL STRIKE
// ─────────────────────────────────────────────────────────────────────────────
const sc_gfx08: SceneDef = {
  label: 'TOPOLOGICAL STRIKE — reverse deps',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.5, w: 0.02, h: 0.35, type: 'LAVA' },
      { x: 0.65, y: 0.5, w: 0.02, h: 0.35, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: gfx-09 — DIJKSTRA DAEMON
// ─────────────────────────────────────────────────────────────────────────────
const sc_gfx09: SceneDef = {
  label: 'DIJKSTRA DAEMON — weighted targeting',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.06, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.82, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene: gfx-10 — NETWORK ORACLE
// ─────────────────────────────────────────────────────────────────────────────
const sc_gfx10: SceneDef = {
  label: 'NETWORK ORACLE — full graph awareness',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.35, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.3, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.65, y: 0.35, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.35, y: 0.65, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.7, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.65, y: 0.65, w: 0.02, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.85, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene Registry — full mapping of all 60 levels
// ─────────────────────────────────────────────────────────────────────────────

const SCENE_REGISTRY: Record<string, SceneDef> = {
  'cond-01': sc_cond01, 'cond-02': sc_cond02, 'cond-03': sc_cond03,
  'cond-04': sc_cond04, 'cond-05': sc_cond05, 'cond-06': sc_cond06,
  'cond-07': sc_cond07, 'cond-08': sc_cond08, 'cond-09': sc_cond09,
  'cond-10': sc_cond10,

  'loop-01': sc_loop01, 'loop-02': sc_loop02, 'loop-03': sc_loop03,
  'loop-04': sc_loop04, 'loop-05': sc_loop05, 'loop-06': sc_loop06,
  'loop-07': sc_loop07, 'loop-08': sc_loop08, 'loop-09': sc_loop09,
  'loop-10': sc_loop10,

  'arr-01': sc_arr01, 'arr-02': sc_arr02, 'arr-03': sc_arr03,
  'arr-04': sc_arr04, 'arr-05': sc_arr05, 'arr-06': sc_arr06,
  'arr-07': sc_arr07, 'arr-08': sc_arr08, 'arr-09': sc_arr09,
  'arr-10': sc_arr10,

  'ds-01': sc_ds01, 'ds-02': sc_ds02, 'ds-03': sc_ds03,
  'ds-04': sc_ds04, 'ds-05': sc_ds05, 'ds-06': sc_ds06,
  'ds-07': sc_ds07, 'ds-08': sc_ds08, 'ds-09': sc_ds09,
  'ds-10': sc_ds10,

  'rec-01': sc_rec01, 'rec-02': sc_rec02, 'rec-03': sc_rec03,
  'rec-04': sc_rec04, 'rec-05': sc_rec05, 'rec-06': sc_rec06,
  'rec-07': sc_rec07, 'rec-08': sc_rec08, 'rec-09': sc_rec09,
  'rec-10': sc_rec10,

  'gfx-01': sc_gfx01, 'gfx-02': sc_gfx02, 'gfx-03': sc_gfx03,
  'gfx-04': sc_gfx04, 'gfx-05': sc_gfx05, 'gfx-06': sc_gfx06,
  'gfx-07': sc_gfx07, 'gfx-08': sc_gfx08, 'gfx-09': sc_gfx09,
  'gfx-10': sc_gfx10,
};

export function getSceneForLevel(levelId: string): SceneDef | null {
  let def = SCENE_REGISTRY[levelId];
  if (!def) {
    const prefix = levelId.split('-')[0];
    const fallback: Record<string, SceneDef> = {
      'cond': sc_cond01, 'loop': sc_loop01, 'arr': sc_arr01,
      'ds': sc_ds01, 'rec': sc_rec01, 'gfx': sc_gfx01,
    };
    def = fallback[prefix] ?? null;
  }
  if (def && SCRIPTS[levelId]) {
    return { ...def, script: SCRIPTS[levelId] };
  }
  return def;
}
