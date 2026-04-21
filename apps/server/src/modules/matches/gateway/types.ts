import { Socket } from 'socket.io';

export type AuthenticatedSocket = Socket & {
  userId?: string;
  matchId?: string;
};

export const TRACKED_ROBOT_PROPS = [
  'position', 'velocity', 'health', 'rotation', 'isAlive', 'color',
  'maxHealth', 'slowedUntil', 'speedMultiplier', 'trappedUntil', 'shields',
  'energy', 'maxEnergy', 'inStasis', 'fovDirection', 'hitWallTimestamp',
] as const;
