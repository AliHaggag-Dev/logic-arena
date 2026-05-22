import { Socket } from 'socket.io';
import { GameState, Projectile, Robot, Vector2, ModeData } from '@logic-arena/engine';

export type AuthenticatedSocket = Socket & {
  userId?: string;
  matchId?: string;
  isGuest?: boolean;
  isSpectator?: boolean;
};

export const TRACKED_ROBOT_PROPS = [
  'position',
  'velocity',
  'health',
  'rotation',
  'isAlive',
  'color',
  'speedMultiplier',
  'energy',
  'maxEnergy',
  'inStasis',
  'fovDirection',
  'hitWallTimestamp',
] as const;

export type TrackedRobotProp = (typeof TRACKED_ROBOT_PROPS)[number];

export type SafeRobotSnapshot = Pick<Partial<Robot>, TrackedRobotProp> & {
  id: string;
  visibleRobotIds: string[];
};

export interface SafeProjectileSnapshot {
  id: string;
  position: Vector2;
  velocity: Vector2;
  color?: string;
  ownerId?: string;
}

export interface SafeGameSnapshot {
  robots: SafeRobotSnapshot[];
  projectiles: SafeProjectileSnapshot[];
  obstacles?: undefined;
  modeData?: ModeData;
}

export type RobotDelta = Partial<SafeRobotSnapshot> & { id: string };

export interface ProjectileDelta {
  upsert: SafeProjectileSnapshot[];
  remove: string[];
}

export type GameStateDelta =
  | { type: 'full'; state: GameState; modeData?: ModeData }
  | {
      type: 'delta';
      diff: { robots: RobotDelta[]; projectiles: ProjectileDelta };
      modeData?: ModeData;
    };
