export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  position: Vector2;
  velocity: Vector2;
  color: string;
}

export interface Robot extends Entity {
  health: number; // Added to track damage in the arena
}

export interface Projectile extends Entity {
  ownerId: string; // The ID of the robot that fired this shot
}