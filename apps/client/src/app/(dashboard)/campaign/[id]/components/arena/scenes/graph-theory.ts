import { SceneDef, makeRobot } from './types';

const NODES_6 = [
  { x: 0.5, y: 0.5 }, { x: 0.65, y: 0.3 }, { x: 0.8, y: 0.55 },
  { x: 0.7, y: 0.75 }, { x: 0.55, y: 0.8 }, { x: 0.75, y: 0.2 },
];

const sc_gfx01: SceneDef = {
  label: 'NODE WALKER — linear DAG chain',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.5, y: 0.5, angle: 0, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_gfx02: SceneDef = {
  label: 'EDGE CRAWLER — Hamiltonian cycle',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.3, w: 0.4, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.7, w: 0.4, h: 0.02, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.5, y: 0.5, angle: 0, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_gfx03: SceneDef = {
  label: 'BREADTH SCANNER — star graph',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.3, y: 0.25, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.7, y: 0.25, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.3, y: 0.75, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.7, y: 0.75, w: 0.02, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.5, y: 0.5, angle: 0, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_gfx04: SceneDef = {
  label: 'DEPTH PROBE — DFS with RAYCAST',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.2, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.8, w: 0.5, h: 0.02, type: 'SOLID' },
      { x: 0.8, y: 0.5, w: 0.02, h: 0.4, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.5, y: 0.5, angle: 0, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_gfx05: SceneDef = {
  label: 'CYCLE DETECTOR — figure-8 graph',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'SOLID' },
      { x: 0.35, y: 0.25, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.65, y: 0.75, w: 0.02, h: 0.02, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.5, y: 0.5, angle: 0, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.65, angle: 0.3, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_gfx06: SceneDef = {
  label: 'SHORTEST PATH — greedy grid approach',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'TRAP' },
      { x: 0.3, y: 0.3, w: 0.03, h: 0.03, type: 'SOLID' },
      { x: 0.7, y: 0.7, w: 0.03, h: 0.03, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.5, y: 0.5, angle: 0, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_gfx07: SceneDef = {
  label: 'SPANNING TREE — perimeter collapse',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.03, h: 0.5, type: 'SOLID' },
      { x: 0.3, y: 0.25, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.7, y: 0.75, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.15, w: 0.04, h: 0.04, type: 'LAVA' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.5, y: 0.5, angle: 0, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.7, angle: 0.2, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_gfx08: SceneDef = {
  label: 'TOPOLOGICAL STRIKE — tiered unlocks',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.25, y: 0.5, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.5, y: 0.2, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.75, y: 0.5, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.5, y: 0.5, w: 0.03, h: 0.03, type: 'SOLID' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.2, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_gfx09: SceneDef = {
  label: 'DIJKSTRA DAEMON — weighted targeting',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.5, y: 0.5, w: 0.06, h: 0.06, type: 'SOLID' },
      { x: 0.3, y: 0.3, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.7, y: 0.7, w: 0.02, h: 0.02, type: 'LAVA' },
      { x: 0.5, y: 0.15, w: 0.3, h: 0.02, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.5, y: 0.5, angle: 0, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

const sc_gfx10: SceneDef = {
  label: 'NETWORK ORACLE — 3x3 grid prediction',
  init: () => ({
    tick: 0, nextProjId: 0, obstacles: [
      { x: 0.35, y: 0.35, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.3, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.65, y: 0.35, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.35, y: 0.65, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.7, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.65, y: 0.65, w: 0.02, h: 0.02, type: 'SOLID' },
      { x: 0.5, y: 0.5, w: 0.04, h: 0.04, type: 'TRAP' },
    ], projectiles: [],
    robots: [
      makeRobot({ id: 'enemy', x: 0.75, y: 0.2, angle: Math.PI, color: '#ef4444', trailColor: '#ff6060' }),
      makeRobot({ id: 'player', x: 0.38, y: 0.5, angle: 0, color: '#22d3ee', trailColor: '#22d3ee' }),
    ],
  }),
  tick: () => {},
};

export { NODES_6 };
export const GRAPH_THEORY_SCENES: Record<string, SceneDef> = {
  'gfx-01': sc_gfx01, 'gfx-02': sc_gfx02, 'gfx-03': sc_gfx03,
  'gfx-04': sc_gfx04, 'gfx-05': sc_gfx05, 'gfx-06': sc_gfx06,
  'gfx-07': sc_gfx07, 'gfx-08': sc_gfx08, 'gfx-09': sc_gfx09,
  'gfx-10': sc_gfx10,
};
