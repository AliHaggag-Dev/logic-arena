import { SceneDef, makeRobot } from './types';

const sc_rec01: SceneDef = {
  label: 'ECHO PULSE — depth 2 oscillate',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_rec02: SceneDef = {
  label: 'DOUBLE ECHO — depth 3 wind/unwind',
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

const sc_rec03: SceneDef = {
  label: 'DEPTH CHARGE — increasing max depth',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.2, w: 0.3, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.8, w: 0.3, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.03, h: 0.03, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_rec04: SceneDef = {
  label: 'MIRROR RECURSION — symmetric fire',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.3, w: 0.3, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.7, w: 0.3, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_rec05: SceneDef = {
  label: 'FIBONACCI STRIKER — 1,1,2,3,5 gaps',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_rec06: SceneDef = {
  label: 'TOWER OF POWER — push/pop stack frames',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.3, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.3, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.65, y: 0.3, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.7, w: 0.02, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.6, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.4, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_rec07: SceneDef = {
  label: 'BINARY SPLITTER — left/right branch',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.25, w: 0.4, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.75, w: 0.4, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.03, h: 0.03, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_rec08: SceneDef = {
  label: 'FRACTAL STORM — jagged orbit pattern',
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

const sc_rec09: SceneDef = {
  label: 'CALL STACK OVERLOAD — ghost trail replay',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.15, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.85, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.25, y: 0.5, w: 0.02, h: 0.5, type: 'TRAP' },
      { x: 0.75, y: 0.5, w: 0.02, h: 0.5, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_rec10: SceneDef = {
  label: 'OMEGA UNWIND — dual entangled vars',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.06, type: 'SOLID' },
      { x: 0.3, y: 0.3, w: 0.02, h: 0.02, type: 'TRAP' },
      { x: 0.7, y: 0.7, w: 0.02, h: 0.02, type: 'TRAP' },
      { x: 0.5, y: 0.15, w: 0.4, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

export const RECURSION_SCENES: Record<string, SceneDef> = {
  'rec-01': sc_rec01, 'rec-02': sc_rec02, 'rec-03': sc_rec03,
  'rec-04': sc_rec04, 'rec-05': sc_rec05, 'rec-06': sc_rec06,
  'rec-07': sc_rec07, 'rec-08': sc_rec08, 'rec-09': sc_rec09,
  'rec-10': sc_rec10,
};
