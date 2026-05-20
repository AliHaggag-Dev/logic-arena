import { ARENA_W, ARENA_H, BATTLE_END_DELAY_MS } from '../constants';
import { startFovSweep } from '../combat/fovSystem';
import type { SceneState } from '../scenes';

export interface CampaignFrameRobot {
  id: 'player' | 'enemy';
  position?: { x?: number; y?: number };
  rotation?: number;
  health?: number;
  energy?: number;
  isAlive?: boolean;
  scanActive?: boolean;
}

export interface CampaignFrameProjectile {
  id: number;
  position?: { x?: number; y?: number };
  color?: string;
  ownerId?: 'player' | 'enemy';
}

export interface CampaignFrame {
  robots?: CampaignFrameRobot[];
  projectiles?: CampaignFrameProjectile[];
  tick?: number;
}

export function syncReplayFrame(
  state: SceneState,
  frame: CampaignFrame,
  battleEndedRef: { current: boolean },
  fightResult: { winner: string; completionToken: string | null; tick?: number; fightDurationTicks?: number } | null,
  fovTimerRef: Map<string, number>,
  onBattleEnd: ((winner: 'player' | 'enemy' | 'draw') => void) | null,
): void {
  for (const robot of state.robots) {
    const src = frame.robots?.find((r: CampaignFrameRobot) => r.id === robot.id);
    if (!src) continue;
    robot.x = (src.position?.x ?? 0) / ARENA_W;
    robot.y = (src.position?.y ?? 0) / ARENA_H;
    robot.angle = src.rotation ?? robot.angle;
    robot.health = src.health ?? robot.health;
    robot.energy = src.energy ?? robot.energy;
    robot.isAlive = src.health != null ? src.health > 0 : src.isAlive ?? robot.isAlive;
    const hasProjectile = (frame.projectiles ?? []).some(
      (p: CampaignFrameProjectile) => p.ownerId === robot.id,
    );
    if (src.scanActive || hasProjectile) {
      startFovSweep(fovTimerRef, robot.id);
    }
  }
  state.projectiles = (frame.projectiles ?? []).map((p: CampaignFrameProjectile) => ({
    id: p.id,
    x: (p.position?.x ?? 0) / ARENA_W,
    y: (p.position?.y ?? 0) / ARENA_H,
    vx: 0, vy: 0,
    color: p.color ?? '#ffffff',
    ownerId: p.ownerId ?? 'enemy',
    life: 99,
    damage: 0,
  }));

  if (!battleEndedRef.current && fightResult) {
    battleEndedRef.current = true;
    const winner = fightResult.winner as 'player' | 'enemy' | 'draw';
    setTimeout(() => onBattleEnd?.(winner), BATTLE_END_DELAY_MS);
  }
}
