import { SceneDef, makeRobot } from './types';

const sc_cond01: SceneDef = {
  label: 'BINARY REFLEX — patrol stops and fires',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.45, angle: 0, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.55, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

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

const sc_cond03: SceneDef = {
  label: 'SENTINEL OVERRIDE — nested distance gate',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.38, w: 0.06, h: 0.24, type: 'SOLID' },
      { x: 0.5, y: 0.78, w: 0.06, h: 0.06, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.82, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_cond04: SceneDef = {
  label: 'FORKED JUDGMENT — three thresholds',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.32, y: 0.3, w: 0.03, h: 0.03, type: 'LAVA' },
      { x: 0.68, y: 0.7, w: 0.03, h: 0.03, type: 'LAVA' },
      { x: 0.5, y: 0.1, w: 0.4, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.6, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.4, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_cond05: SceneDef = {
  label: 'THRESHOLD GATE — health-gated behavior',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.18, w: 0.4, h: 0.03, type: 'SOLID' },
      { x: 0.5, y: 0.82, w: 0.4, h: 0.03, type: 'SOLID' },
      { x: 0.3, y: 0.5, w: 0.02, h: 0.3, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_cond06: SceneDef = {
  label: 'POLARITY SWITCH — damage flips state',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.25, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.75, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.4, y: 0.5, w: 0.02, h: 0.4, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.3, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.7, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_cond07: SceneDef = {
  label: 'CASCADE REACTOR — 3-deep decision tree',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.38, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.62, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.5, y: 0.35, w: 0.04, h: 0.04, type: 'LAVA' },
      { x: 0.5, y: 0.65, w: 0.04, h: 0.04, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.25, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_cond08: SceneDef = {
  label: 'DEAD RECKONING — threat level counter',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.4, y: 0.3, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.6, y: 0.7, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.5, y: 0.12, w: 0.3, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.7, angle: Math.PI * 0.75, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.3, angle: 0.5, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_cond09: SceneDef = {
  label: 'QUANTUM OBSERVER — 4-deep condition tree',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.35, w: 0.06, h: 0.06, type: 'SOLID' },
      { x: 0.65, y: 0.65, w: 0.06, h: 0.06, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.25, y: 0.6, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_cond10: SceneDef = {
  label: 'ARBITER PRIME — priority encoder',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.28, y: 0.28, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.72, y: 0.72, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.5, y: 0.15, w: 0.04, h: 0.04, type: 'LAVA' },
      { x: 0.5, y: 0.85, w: 0.04, h: 0.04, type: 'LAVA' },
      { x: 0.5, y: 0.5, w: 0.03, h: 0.03, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.85, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.25, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

export const CONDITIONAL_SCENES: Record<string, SceneDef> = {
  'cond-01': sc_cond01, 'cond-02': sc_cond02, 'cond-03': sc_cond03,
  'cond-04': sc_cond04, 'cond-05': sc_cond05, 'cond-06': sc_cond06,
  'cond-07': sc_cond07, 'cond-08': sc_cond08, 'cond-09': sc_cond09,
  'cond-10': sc_cond10,
};
