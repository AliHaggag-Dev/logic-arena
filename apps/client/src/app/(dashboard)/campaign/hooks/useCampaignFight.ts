'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../../../lib/api-client';

export type FightStatus = 'idle' | 'connecting' | 'fighting' | 'streaming' | 'done' | 'error';

export type FightResult = {
  winner: 'player' | 'enemy' | 'draw';
  completionToken: string | null;
  tick?: number;
  fightDurationTicks?: number;
};

export type CampaignRobotSpawn = {
  x: number;
  y: number;
  /** Initial body/FOV angle in radians, copied from the 2D scene definition. */
  angle?: number;
};

export type CampaignFrameRobot = {
  id: 'player' | 'enemy';
  position?: { x?: number; y?: number };
  rotation?: number;
  health?: number;
  energy?: number;
  isAlive?: boolean;
  scanActive?: boolean;
};

export type CampaignFrameProjectile = {
  id: number;
  position?: { x?: number; y?: number };
  color?: string;
  ownerId?: 'player' | 'enemy';
};

export type CampaignFrame = {
  robots?: CampaignFrameRobot[];
  projectiles?: CampaignFrameProjectile[];
  tick?: number;
};

function buildWsUrl(): string {
  return API_BASE_URL
    .replace('https://', 'wss://')
    .replace('http://', 'ws://')
    .replace(/\/api$/, '');
}

export function useCampaignFight() {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<FightStatus>('idle');
  const [result, setResult] = useState<FightResult | null>(null);
  const latestFrameRef = useRef<CampaignFrame | null>(null);

  // ── Connect once on mount, reuse across fights ────────────────────────────
  useEffect(() => {
    const socket = io(buildWsUrl(), {
      withCredentials: true,
      transports: ['websocket'],  // skip polling probe round-trip
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('campaignFrame', (frame: CampaignFrame) => {
      latestFrameRef.current = frame;
      setStatus('streaming');
    });

    socket.on('campaignFightResult', (data: FightResult) => {
      setResult(data);
      setStatus('done');
    });

    socket.on('campaignFightError', (data: { message: string }) => {
      console.error('[campaignFight] error:', data.message);
      setStatus('error');
    });

    socket.on('connect_error', () => {
      setStatus('error');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ── Emit fight — reuses the existing socket, no reconnection ─────────────
  const fight = useCallback((
    levelId: string,
    userScript: string,
    obstacles: unknown[],
    playerSpawn?: CampaignRobotSpawn,
    enemySpawn?: CampaignRobotSpawn,
  ) => {
    const socket = socketRef.current;
    if (!socket) return;

    latestFrameRef.current = null;
    setResult(null);

    if (!socket.connected) {
      setStatus('connecting');
      socket.once('connect', () => {
        setStatus('fighting');
        socket.emit('campaignFight', { levelId, userScript, obstacles, playerSpawn, enemySpawn });
      });
      socket.connect();
    } else {
      setStatus('fighting');
      socket.emit('campaignFight', { levelId, userScript, obstacles, playerSpawn, enemySpawn });
    }
  }, []);

  return { fight, status, result, latestFrameRef };
}
