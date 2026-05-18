import { SceneDef, makeRobot } from './types';

const sc_ds01: SceneDef = {
  label: 'STATE MACHINE — mode: PATROL / ENGAGE',
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

const sc_ds02: SceneDef = {
  label: 'CONFIG OBJECT — dict parameters',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.2, w: 0.4, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.8, w: 0.4, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.7, y: 0.6, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.4, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_ds03: SceneDef = {
  label: 'COUNTER MAP — sighting ratio',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.35, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.65, y: 0.65, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.04, h: 0.3, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_ds04: SceneDef = {
  label: 'PHASE SHIFTER — lock, travel, burst',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.5, w: 0.02, h: 0.3, type: 'LAVA' },
      { x: 0.65, y: 0.5, w: 0.02, h: 0.3, type: 'LAVA' },
      { x: 0.5, y: 0.15, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.85, w: 0.02, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.6, angle: 0.1, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_ds05: SceneDef = {
  label: 'NEMESIS PROTOCOL — velocity delta',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.3, y: 0.3, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.7, y: 0.7, w: 0.02, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.8, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_ds06: SceneDef = {
  label: 'DUAL REGISTER — atk + def dicts',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.3, y: 0.2, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.7, y: 0.8, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.6, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.4, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_ds07: SceneDef = {
  label: 'INVENTORY SYSTEM — ammo + heat',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.06, type: 'TRAP' },
      { x: 0.3, y: 0.5, w: 0.02, h: 0.3, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.72, y: 0.35, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.65, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_ds08: SceneDef = {
  label: 'NEURAL MAP — quadrant learning',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.25, y: 0.25, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.75, y: 0.25, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.25, y: 0.75, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.75, y: 0.75, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.03, h: 0.03, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.78, y: 0.5, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_ds09: SceneDef = {
  label: 'COMMAND STACK — task queue dict',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.35, y: 0.35, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.65, y: 0.65, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.5, y: 0.15, w: 0.3, h: 0.02, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.4, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.6, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_ds10: SceneDef = {
  label: 'OVERLORD SYSTEM — subsystems fail',
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

export const DATA_STRUCTURE_SCENES: Record<string, SceneDef> = {
  'ds-01': sc_ds01, 'ds-02': sc_ds02, 'ds-03': sc_ds03,
  'ds-04': sc_ds04, 'ds-05': sc_ds05, 'ds-06': sc_ds06,
  'ds-07': sc_ds07, 'ds-08': sc_ds08, 'ds-09': sc_ds09,
  'ds-10': sc_ds10,
};
