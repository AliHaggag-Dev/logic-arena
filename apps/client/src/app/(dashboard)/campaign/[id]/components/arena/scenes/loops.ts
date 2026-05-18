import { SceneDef, makeRobot } from './types';

const sc_loop01: SceneDef = {
  label: 'PULSE DRUM — 5 shots then move',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_loop02: SceneDef = {
  label: 'PATROL CIRCUIT — waypoint shuttling',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.25, y: 0.5, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.75, y: 0.5, w: 0.02, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_loop03: SceneDef = {
  label: 'ADAPTIVE VORTEX — orbit direction flip',
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

const sc_loop04: SceneDef = {
  label: 'RAMP PROTOCOL — escalating shot count',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.15, w: 0.5, h: 0.02, type: 'LAVA' },
      { x: 0.5, y: 0.85, w: 0.5, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_loop05: SceneDef = {
  label: 'SEEK AND DESTROY — 4-waypoint scan',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.06, type: 'SOLID' },
      { x: 0.25, y: 0.2, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.75, y: 0.8, w: 0.02, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_loop06: SceneDef = {
  label: 'ECHO CHAMBER — nested loops',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.25, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.75, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.02, h: 0.5, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.6, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_loop07: SceneDef = {
  label: 'DECIMATOR MK-IV — sight counter overdrive',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.25, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.65, y: 0.75, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.02, h: 0.4, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.65, angle: Math.PI * 0.8, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.35, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_loop08: SceneDef = {
  label: 'SINE WAVE — phase oscillation',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.2, w: 0.02, h: 0.2, type: 'SOLID' },
      { x: 0.65, y: 0.8, w: 0.02, h: 0.2, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.03, h: 0.03, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_loop09: SceneDef = {
  label: 'CONVERGENCE ENGINE — counters meet',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.3, y: 0.3, w: 0.03, h: 0.03, type: 'LAVA' },
      { x: 0.7, y: 0.7, w: 0.03, h: 0.03, type: 'LAVA' },
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.5, y: 0.15, w: 0.3, h: 0.02, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.82, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_loop10: SceneDef = {
  label: 'INFINITE NEMESIS — evolution per 3 hits',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.08, h: 0.08, type: 'SOLID' },
      { x: 0.3, y: 0.2, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.7, y: 0.8, w: 0.02, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.85, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.6, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

export const LOOP_SCENES: Record<string, SceneDef> = {
  'loop-01': sc_loop01, 'loop-02': sc_loop02, 'loop-03': sc_loop03,
  'loop-04': sc_loop04, 'loop-05': sc_loop05, 'loop-06': sc_loop06,
  'loop-07': sc_loop07, 'loop-08': sc_loop08, 'loop-09': sc_loop09,
  'loop-10': sc_loop10,
};
