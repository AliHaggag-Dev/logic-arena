'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../../../lib/api-client';

export type FightStatus = 'idle' | 'connecting' | 'fighting' | 'streaming' | 'done' | 'error';

export type FightResult = {
  winner: 'player' | 'enemy' | 'draw';
  completionToken: string | null;
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
};

export function useCampaignFight() {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<FightStatus>('idle');
  const [result, setResult] = useState<FightResult | null>(null);
  const latestFrameRef = useRef<CampaignFrame | null>(null);

  const fight = useCallback((levelId: string, userScript: string, obstacles: unknown[], playerSpawn?: CampaignRobotSpawn, enemySpawn?: CampaignRobotSpawn) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    latestFrameRef.current = null;
    setStatus('connecting');
    setResult(null);

    const wsUrl = API_BASE_URL
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')
      .replace(/\/api$/, '');

    const socket = io(wsUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('fighting');
      socket.emit('campaignFight', { levelId, userScript, obstacles, playerSpawn, enemySpawn });
    });

    socket.on('campaignFrame', (frame: CampaignFrame) => {
      latestFrameRef.current = frame;
      setStatus('streaming');
    });

    socket.on('campaignFightResult', (data: FightResult) => {
      setResult(data);
      setStatus('done');
      socket.disconnect();
    });

    socket.on('campaignFightError', (data: { message: string }) => {
      console.error('[campaignFight] error:', data.message);
      setStatus('error');
      socket.disconnect();
    });

    socket.on('connect_error', () => {
      setStatus('error');
    });
  }, []);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return { fight, status, result, latestFrameRef };
}
