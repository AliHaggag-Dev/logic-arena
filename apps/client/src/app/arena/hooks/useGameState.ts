'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSearchParams } from 'next/navigation';
import {
  GameState, RobotState, ProjectileState, ObstacleState,
  FiredTracer, SpeechBubbleState,
} from '../types';

export const useGameState = (scriptId: string | null, mode: string | null) => {
  const searchParams    = useSearchParams();
  const matchIdFromUrl  = searchParams.get('matchId');

  const socket: Socket = useMemo(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return io('http://localhost:3001', { autoConnect: false, auth: { token } });
  }, []);

  // Core game state — ref for zero-re-render R3F reads, state for UI
  const gameStateRef = useRef<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const [uiState, setUiState]               = useState<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const [firedTracer, setFiredTracer]       = useState<FiredTracer | null>(null);
  const [speechBubble, setSpeechBubble]     = useState<SpeechBubbleState | null>(null);
  const [selectedRobotId, setSelectedRobotId] = useState<string>('');
  const [matchResult, setMatchResult]       = useState<{
    winner:           { id: string; color: string } | null;
    draw:             boolean;
    efficiencyScores: Record<string, number>;
  } | null>(null);
  const [serverConfirmedMode, setServerConfirmedMode] = useState<string>(mode || 'COMBAT');

  // FOG toggle (spectator/debug)
  const [fogEnabled, setFogEnabled] = useState<boolean>(true);

  const lastUiUpdateRef  = useRef(0);
  const tracerTimeoutRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    gameStateRef.current = { robots: [], projectiles: [], obstacles: [] };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUiState({ robots: [], projectiles: [], obstacles: [] });
    setMatchResult(null);

    // -----------------------------------------------------------------------
    // Socket event handlers
    // -----------------------------------------------------------------------

    const handleConnect = () => {
      console.log('[Socket] Connected');
      if (scriptId) {
        const matchId = matchIdFromUrl || 'default-match';
        socket.emit('joinMatch', { matchId, scriptId, mode: mode || 'COMBAT' });
      }
    };

    const handleMatchJoinedInfo = (data: { mode: string }) => {
      setServerConfirmedMode(data.mode);
    };

    const handleAuthenticated = (data: unknown) => {
      console.log('[Socket] Authenticated:', data);
    };

    const handleError = (error: unknown) => {
      console.error('[Socket] Error:', error);
    };

    const handleGameState = (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const payload = data as Record<string, unknown>;

      let parsed: GameState = { robots: [], projectiles: [], obstacles: [] };

      if (payload.type === 'delta') {
        const diff = payload.diff as Partial<GameState> & { robots?: Partial<RobotState>[] };
        parsed = { ...gameStateRef.current };

        if (diff.robots) {
          parsed.robots = parsed.robots.map(r => {
            const rd = diff.robots!.find((d) => d.id === r.id);
            if (!rd) return r;
            // Merge delta — preserve existing visibleRobotIds if not in diff
            return { ...r, ...rd };
          });
        }

        if (diff.projectiles) parsed.projectiles = diff.projectiles;
        if (diff.obstacles)   parsed.obstacles   = diff.obstacles;

      } else if (payload.type === 'full') {
        parsed = payload.state as GameState;

      } else {
        // Legacy fallback
        const robotsRaw = payload['robots'];
        const robotsArr = Array.isArray(robotsRaw) ? robotsRaw : [];
        parsed.robots = robotsArr.map(item => {
          const robot = item as RobotState;
          return {
            ...robot,
            rotation: typeof robot.rotation === 'number' ? robot.rotation : 0,
          };
        });
        const projRaw = payload['projectiles'];
        parsed.projectiles = Array.isArray(projRaw) ? (projRaw as ProjectileState[]) : [];
        const obsRaw  = payload['obstacles'];
        parsed.obstacles   = Array.isArray(obsRaw)  ? (obsRaw  as ObstacleState[])   : [];
      }

      gameStateRef.current = parsed;

      // Throttled UI state update — 10×/sec max
      const now = performance.now();
      if (now - lastUiUpdateRef.current > 100) {
        lastUiUpdateRef.current = now;
        setUiState(parsed);
        setSelectedRobotId(prev => {
          if (!prev && parsed.robots.length > 0) return parsed.robots[0].id;
          return prev;
        });
      }
    };

    const handleLogicExecuted = (data: { robotId: string; action: string; message?: string }) => {
      if (data.action === 'FIRE') {
        const currentState = gameStateRef.current;
        const targetRobot  = currentState.robots.find(r => r.id !== data.robotId);
        if (targetRobot) {
          setFiredTracer({ robotId: data.robotId, targetPosition: targetRobot.position });
          if (tracerTimeoutRef.current !== null) window.clearTimeout(tracerTimeoutRef.current);
          tracerTimeoutRef.current = window.setTimeout(() => setFiredTracer(null), 100);
        }
      }
      setSpeechBubble({ robotId: data.robotId, message: data.message ?? data.action });
      if (speechTimeoutRef.current !== null) window.clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = window.setTimeout(() => setSpeechBubble(null), 1000);
    };

    const handleMatchOver = (data: {
      winner:           { id: string; color: string } | null;
      draw:             boolean;
      efficiencyScores: Record<string, number>;
    }) => {
      setMatchResult({
        winner:           data.winner,
        draw:             data.draw,
        efficiencyScores: data.efficiencyScores ?? {},
      });
    };

    // Register listeners
    socket.on('connect',         handleConnect);
    socket.on('authenticated',   handleAuthenticated);
    socket.on('error',           handleError);
    socket.on('gameState',       handleGameState);
    socket.on('logicExecuted',   handleLogicExecuted);
    socket.on('matchOver',       handleMatchOver);
    socket.on('matchJoinedInfo', handleMatchJoinedInfo);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect',         handleConnect);
      socket.off('authenticated',   handleAuthenticated);
      socket.off('error',           handleError);
      socket.off('gameState',       handleGameState);
      socket.off('logicExecuted',   handleLogicExecuted);
      socket.off('matchOver',       handleMatchOver);
      socket.off('matchJoinedInfo', handleMatchJoinedInfo);
      socket.disconnect();
      if (tracerTimeoutRef.current !== null) window.clearTimeout(tracerTimeoutRef.current);
      if (speechTimeoutRef.current !== null) window.clearTimeout(speechTimeoutRef.current);
    };
  }, [socket, scriptId, matchIdFromUrl, mode]);

  const availableRobots = useMemo(() => uiState.robots.map(r => r.id), [uiState.robots]);

  return {
    gameStateRef,
    uiState,
    firedTracer,
    speechBubble,
    selectedRobotId,
    setSelectedRobotId,
    availableRobots,
    socket,
    matchResult,
    serverConfirmedMode,
    // FOG toggle
    fogEnabled,
    setFogEnabled,
  };
};
