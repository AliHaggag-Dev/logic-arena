export interface Vector2 {
  x: number;
  y: number;
}

export interface Robot {
  id: string;
  team: 'A' | 'B';
  position: Vector2;
  rotation: number;
  velocity: Vector2;
  health: number;
  lastActionTime: number;
  isAlive: boolean;
  code: string;
  memory: Record<string, any>;
  trappedUntil?: number;    // timestamp in ms
  slowedUntil?: number;     // timestamp in ms
  speedMultiplier?: number; // default 1.0
  color?: string
}

export interface Projectile {
  id: string;
  ownerId: string;
  position: Vector2;
  velocity: Vector2;
  team: 'A' | 'B';
}

export type ObstacleType = 'WALL' | 'TRAP' | 'SLOW' | 'BOUNCER';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  position: Vector2;      // center position in arena units
  width: number;          // collision width
  height: number;         // collision height
  rotation: number;       // rotation in radians for visual variety
  health?: number;        // optional — destructible obstacles
}

export interface GameState {
  robots: Robot[];
  projectiles: Projectile[];
  obstacles: Obstacle[];
}