import { FovConfig, Obstacle } from './types';

export const ARENA_WIDTH = 800;
export const ARENA_HEIGHT = 600;
export const ROBOT_RADIUS = 15;

/** Default FOV for every robot: 120° cone, 300px range. */
export const DEFAULT_FOV: FovConfig = { angle: 120, range: 300 };

/**
 * Default obstacle layout — The 3 Pillars:
 *  SOLID : Impassable walls (center cross formation)
 *  TRAP  : Slowdown zones — 60% velocity reduction while inside
 *  LAVA  : Damage zones — 5 HP/sec while inside
 */
export const DEFAULT_OBSTACLES: Obstacle[] = [
  // Center cross — SOLID walls
  { id: 'solid-1', type: 'SOLID', position: { x: 400, y: 200 }, width: 80, height: 25, rotation: 0 },
  { id: 'solid-2', type: 'SOLID', position: { x: 400, y: 400 }, width: 80, height: 25, rotation: 0 },
  { id: 'solid-3', type: 'SOLID', position: { x: 250, y: 300 }, width: 25, height: 80, rotation: 0 },
  { id: 'solid-4', type: 'SOLID', position: { x: 550, y: 300 }, width: 25, height: 80, rotation: 0 },
  // LAVA zones — continuous 5 HP/sec damage
  { id: 'lava-1', type: 'LAVA', position: { x: 200, y: 150 }, width: 60, height: 60, rotation: 0.3 },
  { id: 'lava-2', type: 'LAVA', position: { x: 600, y: 450 }, width: 60, height: 60, rotation: -0.3 },
  // TRAP zones — 60% velocity reduction while inside
  { id: 'trap-1', type: 'TRAP', position: { x: 150, y: 400 }, width: 60, height: 35, rotation: 0.15 },
  { id: 'trap-2', type: 'TRAP', position: { x: 650, y: 200 }, width: 60, height: 35, rotation: -0.15 },
];

export const RACING_OBSTACLES: Obstacle[] = [
  { id: 'race-wall-1', type: 'SOLID', position: { x: 400, y: 50 }, width: 700, height: 20, rotation: 0 },
  { id: 'race-wall-2', type: 'SOLID', position: { x: 400, y: 550 }, width: 700, height: 20, rotation: 0 },
  { id: 'race-wall-3', type: 'SOLID', position: { x: 50, y: 300 }, width: 20, height: 500, rotation: 0 },
  { id: 'race-wall-4', type: 'SOLID', position: { x: 750, y: 300 }, width: 20, height: 500, rotation: 0 },
  { id: 'race-inner-1', type: 'SOLID', position: { x: 400, y: 200 }, width: 400, height: 20, rotation: 0 },
  { id: 'race-inner-2', type: 'SOLID', position: { x: 400, y: 400 }, width: 400, height: 20, rotation: 0 },
  { id: 'race-inner-3', type: 'SOLID', position: { x: 200, y: 300 }, width: 20, height: 200, rotation: 0 },
  { id: 'race-inner-4', type: 'SOLID', position: { x: 600, y: 300 }, width: 20, height: 200, rotation: 0 },
];

export const LAVA_DPS = 5; // HP per second deducted while inside a LAVA zone
