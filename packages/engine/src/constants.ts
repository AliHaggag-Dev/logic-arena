import { FovConfig, Obstacle } from './types';

export const ARENA_WIDTH = 800;
export const ARENA_HEIGHT = 600;
export const ROBOT_RADIUS = 15;

/** Default FOV for every robot: 120° cone, 300px range. */
export const DEFAULT_FOV: FovConfig = { angle: 120, range: 300 };

/**
 * Default obstacle layout (CYBER theme) — The 3 Pillars:
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

/**
 * LAVA (MAGMA CORE) theme obstacle layout.
 * Rocky volcanic terrain: large diagonal rock formations forcing risky paths.
 * No TRAP/LAVA static zones — replaced by dynamic LAVA_POOL hazards.
 */
export const LAVA_OBSTACLES: Obstacle[] = [
  // Top-left volcanic rock cluster
  { id: 'lava-solid-1', type: 'SOLID', position: { x: 180, y: 160 }, width: 100, height: 30, rotation: 0.5 },
  { id: 'lava-solid-2', type: 'SOLID', position: { x: 230, y: 210 }, width: 30, height: 90, rotation: 0.3 },
  // Top-right rock wall
  { id: 'lava-solid-3', type: 'SOLID', position: { x: 600, y: 140 }, width: 110, height: 28, rotation: -0.4 },
  // Center diagonal chokepoint
  { id: 'lava-solid-4', type: 'SOLID', position: { x: 350, y: 280 }, width: 120, height: 28, rotation: 0.6 },
  { id: 'lava-solid-5', type: 'SOLID', position: { x: 460, y: 330 }, width: 120, height: 28, rotation: 0.6 },
  // Bottom-left rock
  { id: 'lava-solid-6', type: 'SOLID', position: { x: 170, y: 450 }, width: 28, height: 100, rotation: -0.3 },
  // Bottom-right volcanic rock cluster
  { id: 'lava-solid-7', type: 'SOLID', position: { x: 610, y: 430 }, width: 105, height: 28, rotation: 0.4 },
  { id: 'lava-solid-8', type: 'SOLID', position: { x: 570, y: 470 }, width: 28, height: 80, rotation: -0.2 },
];

/**
 * ICE (GLACIAL TUNDRA) theme obstacle layout.
 * Symmetric frozen crystal formations: mirrored layout for competitive fairness.
 * No TRAP/LAVA static zones — replaced by dynamic ICE_PATCH hazards.
 */
export const ICE_OBSTACLES: Obstacle[] = [
  // Center ice wall (horizontal)
  { id: 'ice-solid-1', type: 'SOLID', position: { x: 400, y: 300 }, width: 90, height: 22, rotation: 0 },
  // Left wing — mirrored pair
  { id: 'ice-solid-2', type: 'SOLID', position: { x: 220, y: 200 }, width: 22, height: 90, rotation: 0 },
  { id: 'ice-solid-3', type: 'SOLID', position: { x: 220, y: 400 }, width: 22, height: 90, rotation: 0 },
  // Right wing — mirrored pair
  { id: 'ice-solid-4', type: 'SOLID', position: { x: 580, y: 200 }, width: 22, height: 90, rotation: 0 },
  { id: 'ice-solid-5', type: 'SOLID', position: { x: 580, y: 400 }, width: 22, height: 90, rotation: 0 },
  // Top-center diagonal shards
  { id: 'ice-solid-6', type: 'SOLID', position: { x: 340, y: 130 }, width: 80, height: 20, rotation: 0.35 },
  { id: 'ice-solid-7', type: 'SOLID', position: { x: 460, y: 130 }, width: 80, height: 20, rotation: -0.35 },
  // Bottom-center diagonal shards
  { id: 'ice-solid-8', type: 'SOLID', position: { x: 340, y: 470 }, width: 80, height: 20, rotation: -0.35 },
  { id: 'ice-solid-9', type: 'SOLID', position: { x: 460, y: 470 }, width: 80, height: 20, rotation: 0.35 },
];

export const RACING_OBSTACLES: Obstacle[] = [
  // Outer bounds
  { id: 'race-wall-1', type: 'SOLID', position: { x: 400, y: 50 }, width: 700, height: 20, rotation: 0 },
  { id: 'race-wall-2', type: 'SOLID', position: { x: 400, y: 550 }, width: 700, height: 20, rotation: 0 },
  { id: 'race-wall-3', type: 'SOLID', position: { x: 50, y: 300 }, width: 20, height: 500, rotation: 0 },
  { id: 'race-wall-4', type: 'SOLID', position: { x: 750, y: 300 }, width: 20, height: 500, rotation: 0 },
  
  // Inner bounds
  { id: 'race-inner-1', type: 'SOLID', position: { x: 400, y: 200 }, width: 400, height: 20, rotation: 0 },
  { id: 'race-inner-2', type: 'SOLID', position: { x: 400, y: 400 }, width: 400, height: 20, rotation: 0 },
  { id: 'race-inner-3', type: 'SOLID', position: { x: 200, y: 300 }, width: 20, height: 200, rotation: 0 },
  { id: 'race-inner-4', type: 'SOLID', position: { x: 600, y: 300 }, width: 20, height: 200, rotation: 0 },

  // --- Legendary Obstacles ---
  // Block going backwards: Force clockwise movement
  { id: 'race-block-back', type: 'SOLID', position: { x: 125, y: 190 }, width: 150, height: 20, rotation: 0 },

  // Top straight: Weave around pillars and avoid the mud
  { id: 'race-pillar-1', type: 'SOLID', position: { x: 300, y: 150 }, width: 20, height: 80, rotation: 0 },
  { id: 'race-pillar-2', type: 'SOLID', position: { x: 450, y: 100 }, width: 20, height: 80, rotation: 0 },
  { id: 'race-mud-1', type: 'TRAP', position: { x: 375, y: 125 }, width: 100, height: 100, rotation: 0 },

  // Right turn: Lava corner (take the inner line or get burned)
  { id: 'race-lava-1', type: 'LAVA', position: { x: 675, y: 125 }, width: 100, height: 100, rotation: 0.785 }, 

  // Bottom straight: A huge slowing trap with a safe narrow path
  { id: 'race-mud-2', type: 'TRAP', position: { x: 400, y: 475 }, width: 200, height: 130, rotation: 0 },
  { id: 'race-pillar-3', type: 'SOLID', position: { x: 400, y: 475 }, width: 20, height: 50, rotation: 0.5 },

  // Left turn: Moving towards finish line, tight lava blocks
  { id: 'race-lava-2', type: 'LAVA', position: { x: 125, y: 475 }, width: 60, height: 60, rotation: 0.3 },

  // The Finish Line! Placed on the left straight
  { id: 'race-finish', type: 'FINISH_LINE', position: { x: 125, y: 300 }, width: 150, height: 40, rotation: 0 },
];

export const LAVA_DPS = 5; // HP per second deducted while inside a LAVA zone
