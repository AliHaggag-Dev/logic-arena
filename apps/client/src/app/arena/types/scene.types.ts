import { ReactNode, MutableRefObject } from 'react';
import { GameState } from './game.types';

export type Vec2 = { x: number; y: number };

// ---------------------------------------------------------------------------
// Robot state received from server
// ---------------------------------------------------------------------------
export interface RobotState {
  id: string;
  position: Vec2;
  color: string;
  health: number;
  rotation?: number;
  velocity?: Vec2;
  model?: string;
  spotted?: boolean;
  // Energy (Feature 2)
  energy?: number;
  maxEnergy?: number;
  inStasis?: boolean;
  isShielded?: boolean;
  isCloaked?: boolean;
  shieldHitTimestamp?: number;
  // FOV (Feature 1)
  fov?: { angle: number; range: number };
  fovDirection?: number;
  /** IDs of robots visible to this robot — sent by server in delta-diff */
  visibleRobotIds?: string[];
  totalEnergyConsumed?: number;
  totalDamageDealt?: number;
}

// ---------------------------------------------------------------------------
// Projectile state
// ---------------------------------------------------------------------------
export interface ProjectileState {
  id: string;
  position: Vec2;
}

// ---------------------------------------------------------------------------
// Obstacle state
// ---------------------------------------------------------------------------
export type MapTheme = 'CYBER' | 'LAVA' | 'ICE';

export type ObstacleType =
  | 'SOLID'
  | 'TRAP'
  | 'LAVA'
  | 'FINISH_LINE'
  | 'MINE'
  | 'LAVA_POOL'
  | 'ICE_PATCH'
  | 'EMP_STRIKE';

export interface ObstacleState {
  id: string;
  type: ObstacleType;
  position: Vec2;
  width: number;
  height: number;
  rotation?: number;
  createdAt?: number;
}

// ---------------------------------------------------------------------------
// Robot 3D model props
// ---------------------------------------------------------------------------
export interface RobotModelProps {
  position: [number, number, number];
  color: string;
  health: number;
  velocity: Vec2;
  rotation?: number;
  hitTimestamp?: number | null;
  spotted?: boolean;
  // Energy additions
  energy?: number;
  maxEnergy?: number;
  inStasis?: boolean;
  isShielded?: boolean;
  isCloaked?: boolean;
  shieldHitTimestamp?: number;
  // FOV additions
  fov?: { angle: number; range: number };
  fovDirection?: number;
  modelFile?: string;
  hideHealthBar?: boolean;
  speechBubble?: string | null;
  /** When true the robot is hidden by fog of war — render at low opacity with blue-gray tint */
  inFog?: boolean;
  /** Robot ID — used to query the interpolation buffer for sub-frame smooth positioning */
  robotId?: string;
}

// ---------------------------------------------------------------------------
// Hit burst effect
// ---------------------------------------------------------------------------
export interface HitBurst {
  id: string;
  position: [number, number, number];
  color: string;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------
export interface RobotErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

export interface RobotErrorBoundaryState {
  hasError: boolean;
}

export interface FiredTracer {
  robotId: string;
  targetPosition: Vec2;
  isPredicted?: boolean;
  predictedPosition?: Vec2;
}

export interface SpeechBubbleState {
  robotId: string;
  message: string;
}

export interface Scene3DComponentProps {
  gameStateRef: MutableRefObject<GameState>;
  obstacles?: ObstacleState[];
  firedTracer?: FiredTracer | null;
  speechBubble?: SpeechBubbleState | null;
  fogEnabled?: boolean;
  soundFx?: boolean;
  graphicsQuality?: string;
  /** GLB file path for the local player's robot ("/robot.glb" | "/robot2.glb") */
  localRobotFile?: string;
  /** Hex color saved in the local player's loadout — used to identify their robot in the scene */
  localRobotColor?: string;
  displayMode?: string;
  mapTheme?: string;
}

export interface HealthBarSpriteProps {
  health: number;
  displayMode?: string;
}

export interface EnergyBarSpriteProps {
  energy: number;
  maxEnergy: number;
  inStasis: boolean;
}

export interface HitBurstEffectProps {
  burst: HitBurst;
}

export interface HitParticlesProps {
  bursts: HitBurst[];
  setBursts: React.Dispatch<React.SetStateAction<HitBurst[]>>;
}

export interface FallbackRobotProps {
  position: [number, number, number];
  color: string;
}

export interface LaserModelProps {
  position: [number, number, number];
  /** Projectile ID — used to query the interpolation buffer for sub-frame smooth positioning */
  projectileId?: string;
}

export interface ObstacleModelProps {
  obstacle: ObstacleState;
}

export interface BoundaryLineProps {
  points: Float32Array;
}

export interface LaserBeamProps {
  start: [number, number, number];
  end: [number, number, number];
  /** Optional override color (hex). Falls back to default cyan when omitted. */
  color?: string;
}

export interface SpeechBubbleProps {
  position: [number, number, number];
  message: string;
}

export interface FovConeProps {
  position: [number, number, number];
  color: string;
  fov: { angle: number; range: number };
  fovDirection: number;
}

export interface StasisEffectProps {
  position: [number, number, number];
}
