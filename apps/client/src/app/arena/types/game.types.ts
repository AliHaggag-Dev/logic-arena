import { RobotState, ProjectileState, ObstacleState, Vec2, MapTheme } from "./scene.types";

// ---------------------------------------------------------------------------
// Mode Data — Client-side mirrors of engine types
// ---------------------------------------------------------------------------

export interface KothZone {
  x: number;
  y: number;
  radius: number;
}

export interface KothModeData {
  type: 'KOTH';
  zone: KothZone;
  zoneScores: Record<string, number>;
  scoreTarget: number;
}

export interface CtfFlag {
  team: 'A' | 'B';
  position: Vec2;
  carrierId?: string;
  atBase: boolean;
}

export interface CtfModeData {
  type: 'CTF';
  flags: CtfFlag[];
  teamScores: Record<string, number>;
  scoreTarget: number;
  bases: Record<string, Vec2>;
}

export interface SurvivalModeData {
  type: 'SURVIVAL';
  wave: number;
  enemiesRemaining: number;
  totalKills: number;
  spawned: number;
}

export interface RacingModeData {
  type: 'RACING';
  laps: number;
  finishLine: Vec2;
  winnerId?: string;
}

export type ModeData = KothModeData | CtfModeData | SurvivalModeData | RacingModeData;

export interface GameState {
  robots: RobotState[];
  projectiles: ProjectileState[];
  obstacles: ObstacleState[];
  mapTheme?: MapTheme;
  modeData?: ModeData;
}
