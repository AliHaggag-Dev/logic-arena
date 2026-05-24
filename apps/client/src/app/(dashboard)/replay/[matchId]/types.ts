export interface Vector2 {
  x: number;
  y: number;
}

export interface RobotSnapshot {
  id: string;
  position: Vector2;
  health: number;
  color?: string;
  rotation?: number;
  isAlive?: boolean;
}

export interface ProjectileSnapshot {
  id?: string;
  ownerId?: string;
  position: Vector2;
  velocity?: Vector2;
  color?: string;
}

export interface Snapshot {
  t: number;
  robots: RobotSnapshot[];
  projectiles: ProjectileSnapshot[];
}

export interface ReplayPayload {
  snapshots: Snapshot[];
  finalScripts?: Record<string, string>;
}

export interface ReplayData {
  id: string;
  replayData: Snapshot[] | ReplayPayload | null;
  winnerId: string | null;
  duration: number;
  createdAt: string;
}
