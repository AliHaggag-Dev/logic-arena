import * as THREE from "three";
import { ReactNode } from "react";

export type Vec2 = { x: number; y: number };

export interface RobotState {
  id: string;
  position: Vec2;
  color: string;
  health: number;
  rotation?: number;
  velocity?: Vec2;
  spotted?: boolean;
}

export interface ProjectileState {
  id: string;
  position: Vec2;
}

export type ObstacleType = "WALL" | "TRAP" | "SLOW" | "BOUNCER";

export interface ObstacleState {
  id: string;
  type: ObstacleType;
  position: Vec2;
  width: number;
  height: number;
  rotation?: number;
}

export interface RobotModelProps {
  position: [number, number, number];
  color: string;
  health: number;
  velocity: Vec2;
  rotation?: number;
  hitTimestamp?: number | null;
  spotted?: boolean;
}

export interface HitBurst {
  id: string;
  position: [number, number, number];
  color: string;
  createdAt: number;
}

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
}

export interface SpeechBubbleState {
  robotId: string;
  message: string;
}

import { MutableRefObject } from "react";
import { GameState } from "./game.types";

export interface Scene3DComponentProps {
  gameStateRef: MutableRefObject<GameState>;
  obstacles?: ObstacleState[];
  firedTracer?: FiredTracer | null;
  speechBubble?: SpeechBubbleState | null;
}

export interface HealthBarSpriteProps {
  health: number;
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
}

export interface SpeechBubbleProps {
  position: [number, number, number];
  message: string;
}
