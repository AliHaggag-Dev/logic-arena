'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  GameState, RobotState, ProjectileState, ObstacleState,
  FiredTracer,
} from '../../types';
import { getAuthUserId } from '../../../../lib/client-security';
import { useSocket } from './useSocket';
import { useSpeechBubbles } from './useSpeechBubbles';

export interface MatchPhaseState {
  phase: 'WAITING' | 'ROUND_ACTIVE' | 'BREAK' | 'FINISHED';
  roundNumber: number;
  timeLeft: number;
  scripts: { userId: string; script: string }[];
  readyUserIds: string[];
}

export const useGameState = (
  scriptId: string | null,
  mode: string | null,
  isSpectator = false,
) => {
  const searchParams = useSearchParams();
  const matchIdFromUrl = searchParams.get('matchId');
  const themeFromUrl = searchParams.get('theme') || 'CYBER';

  const socket = useSocket();
  const { speechBubble, setRobotBubble, cleanupBubbles } = useSpeechBubbles();

  // Core game state — ref for zero-render R3F reads, state for UI
  const gameStateRef = useRef<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const obstaclesRef = useRef<ObstacleState[]>([]);
  const [uiState, setUiState] = useState<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const [firedTracer, setFiredTracer] = useState<FiredTracer | null>(null);
  const [selectedRobotId, setSelectedRobotId] = useState<string>('');
  const [socketUserId, setSocketUserId] = useState<string | null>(null);

  const [trainingStats, setTrainingStats] = useState({
    shotsFired: 0,
    startTime: Date.now(),
    dummiesDestroyed: 0,
  });
  const [matchResult, setMatchResult] = useState<{
    winner: { id: string; color: string } | null;
    draw: boolean;
    efficiencyScores: Record<string, number>;
    playerStats?: Record<string, { eloDelta: number; newStats: any; durationSecs: number; rank: number }>;
  } | null>(null);
  const [serverConfirmedMode, setServerConfirmedMode] = useState<string>(mode || 'COMBAT');
  const [matchPhase, setMatchPhase] = useState<MatchPhaseState>({
    phase: 'ROUND_ACTIVE',
    roundNumber: 1,
    timeLeft: 0,
    scripts: [],
    readyUserIds: [],
  });

  // Spectator viewer count — updated by server spectatorCount events
  const [spectatorCount, setSpectatorCount] = useState<number>(0);

  // FOG toggle (spectator/debug)
  const [fogEnabled, setFogEnabled] = useState<boolean>(true);

  const lastUiUpdateRef = useRef(0);
  const tracerTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    gameStateRef.current = { robots: [], projectiles: [], obstacles: [] };
    obstaclesRef.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUiState({ robots: [], projectiles: [], obstacles: [] });
    setMatchResult(null);

    // -----------------------------------------------------------------------
    // Socket event handlers
    // -----------------------------------------------------------------------

    const handleConnect = () => {
      console.log('[Socket] Connected');
      const matchId = matchIdFromUrl || crypto.randomUUID();
      if (isSpectator) {
        socket.emit('spectate', { matchId });
      } else if (scriptId) {
        socket.emit('joinMatch', { matchId, scriptId, mode: mode || 'COMBAT', mapTheme: themeFromUrl });
      }
    };

    const handleMatchJoinedInfo = (data: { mode: string; phase?: MatchPhaseState['phase']; roundNumber?: number }) => {
      setServerConfirmedMode(data.mode);
      if (data.phase) {
        setMatchPhase((prev) => ({
          ...prev,
          phase: data.phase ?? prev.phase,
          roundNumber: data.roundNumber ?? prev.roundNumber,
        }));
      }
    };

    const handleAuthenticated = (data: { userId?: string; isGuest?: boolean }) => {
      console.log('[Socket] Authenticated:', data);
      if (data.userId) {
        setSocketUserId(data.userId);
      }
    };

    const handleError = (error: unknown) => {
      console.error('[Socket] Error:', error);
    };

    const handleGameState = (data: unknown) => {
      if (!data || typeof data !== 'object') return;
      const payload = data as Record<string, unknown>;

      let parsed: GameState = { robots: [], projectiles: [], obstacles: [] };

      if (payload.type === 'delta') {
        const diff = payload.diff as {
          robots?: Partial<RobotState>[];
          projectiles?: ProjectileState[] | { upsert?: ProjectileState[]; remove?: string[] };
          obstacles?: ObstacleState[];
        };
        parsed = { ...gameStateRef.current };
        if (payload.modeData) {
          parsed.modeData = payload.modeData as any;
        } else {
          console.log('[DEBUG] payload.modeData is undefined!', payload);
        }

        if (diff.robots) {
          parsed.robots = parsed.robots.map(r => {
            const rd = diff.robots!.find((d) => d.id === r.id);
            if (!rd) return r;
            // Merge delta — preserve existing visibleRobotIds if not in diff
            return { ...r, ...rd };
          });
        }

        if (Array.isArray(diff.projectiles)) {
          parsed.projectiles = diff.projectiles;
        } else if (diff.projectiles) {
          const removeIds = new Set(diff.projectiles.remove ?? []);
          const upsertById = new Map((diff.projectiles.upsert ?? []).map((projectile) => [projectile.id, projectile]));
          const retained = parsed.projectiles
            .filter((projectile) => !removeIds.has(projectile.id))
            .map((projectile) => upsertById.get(projectile.id) ?? projectile);
          const existingIds = new Set(retained.map((projectile) => projectile.id));
          const created = (diff.projectiles.upsert ?? []).filter((projectile) => !existingIds.has(projectile.id));
          parsed.projectiles = [...retained, ...created];
        }
        if (diff.obstacles) parsed.obstacles = diff.obstacles;

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
        const obsRaw = payload['obstacles'];
        parsed.obstacles = Array.isArray(obsRaw) ? (obsRaw as ObstacleState[]) : [];
      }

      if (parsed.obstacles) {
        obstaclesRef.current = parsed.obstacles;
      }

      gameStateRef.current = parsed;

      // Throttled UI state update — 10×/sec max
      const now = performance.now();
      if (now - lastUiUpdateRef.current > 100) {
        lastUiUpdateRef.current = now;
        setUiState({ ...parsed, obstacles: [] });
        const activeUserId = getAuthUserId() || socketUserId;
        setSelectedRobotId(prev => {
          const hasUser = activeUserId && parsed.robots.some(r => r.id === activeUserId);
          const hasPrev = prev && parsed.robots.some(r => r.id === prev);

          if (!hasPrev && parsed.robots.length > 0) {
            return hasUser ? activeUserId : parsed.robots[0].id;
          }
          return prev;
        });
      }
    };

    const handleDummyKilled = (_data: { robotId: string }) => {
      setTrainingStats(prev => ({ ...prev, dummiesDestroyed: prev.dummiesDestroyed + 1 }));
    };

    const handleLogicExecuted = (data: { robotId: string; action: string; message?: string; isPredicted?: boolean; predictedPosition?: { x: number; y: number } }) => {
      const activeUserId = getAuthUserId() || socketUserId;

      if (data.action === 'FIRE' || data.action === 'LEAD_FIRE') {
        if (data.robotId === activeUserId) {
          setTrainingStats(prev => ({ ...prev, shotsFired: prev.shotsFired + 1 }));
        }

        const currentState = gameStateRef.current;
        const targetRobot = currentState.robots.find(r => r.id !== data.robotId);
        if (targetRobot) {
          setFiredTracer({
            robotId: data.robotId,
            targetPosition: targetRobot.position,
            isPredicted: data.isPredicted ?? false,
            predictedPosition: data.predictedPosition,
          });
          if (tracerTimeoutRef.current !== null) window.clearTimeout(tracerTimeoutRef.current);
          tracerTimeoutRef.current = window.setTimeout(() => setFiredTracer(null), 100);
        }
      }

      setRobotBubble(data.robotId, data.message ?? data.action, 3000);
    };

    const handleQueryResult = (data: { robotId: string; label: string; message: string }) => {
      setRobotBubble(data.robotId, data.label, 2000);
    };

    const handleMatchOver = (data: {
      winner: { id: string; color: string } | null;
      draw: boolean;
      efficiencyScores: Record<string, number>;
      playerStats?: Record<string, any>;
    }) => {
      setMatchResult({
        winner: data.winner,
        draw: data.draw,
        efficiencyScores: data.efficiencyScores ?? {},
        playerStats: data.playerStats,
      });
    };

    const handlePhaseChanged = (data: { phase: MatchPhaseState['phase']; roundNumber: number; timeLeft: number }) => {
      setMatchPhase((prev) => ({
        ...prev,
        phase: data.phase,
        roundNumber: data.roundNumber,
        timeLeft: data.timeLeft,
        readyUserIds: data.phase === 'BREAK' ? prev.readyUserIds : [],
      }));
    };

    const handleBreakStarted = (data: { scripts: MatchPhaseState['scripts']; timeLeft: number }) => {
      setMatchPhase((prev) => ({
        ...prev,
        phase: 'BREAK',
        timeLeft: data.timeLeft,
        scripts: data.scripts,
        readyUserIds: [],
      }));
    };

    const handlePlayerReady = (data: { userId: string }) => {
      setMatchPhase((prev) => ({
        ...prev,
        readyUserIds: prev.readyUserIds.includes(data.userId)
          ? prev.readyUserIds
          : [...prev.readyUserIds, data.userId],
      }));
    };

    // Register listeners
    socket.on('connect', handleConnect);
    socket.on('authenticated', handleAuthenticated);
    socket.on('error', handleError);
    socket.on('gameState', handleGameState);
    socket.on('logicExecuted', handleLogicExecuted);
    socket.on('matchOver', handleMatchOver);
    socket.on('matchJoinedInfo', handleMatchJoinedInfo);
    socket.on('queryResult', handleQueryResult);
    socket.on('dummyKilled', handleDummyKilled);
    socket.on('match:phase-changed', handlePhaseChanged);
    socket.on('match:break-started', handleBreakStarted);
    socket.on('match:player-ready', handlePlayerReady);
    socket.on('spectatorCount', (count: number) => setSpectatorCount(count));

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('authenticated', handleAuthenticated);
      socket.off('error', handleError);
      socket.off('gameState', handleGameState);
      socket.off('logicExecuted', handleLogicExecuted);
      socket.off('matchOver', handleMatchOver);
      socket.off('matchJoinedInfo', handleMatchJoinedInfo);
      socket.off('queryResult', handleQueryResult);
      socket.off('dummyKilled', handleDummyKilled);
      socket.off('match:phase-changed', handlePhaseChanged);
      socket.off('match:break-started', handleBreakStarted);
      socket.off('match:player-ready', handlePlayerReady);
      socket.off('spectatorCount');
      socket.disconnect();
      if (tracerTimeoutRef.current !== null) window.clearTimeout(tracerTimeoutRef.current);
      cleanupBubbles();
    };
  }, [socket, scriptId, matchIdFromUrl, mode, isSpectator, themeFromUrl, setRobotBubble, cleanupBubbles]);

  const availableRobots = useMemo(() => uiState.robots.map(r => r.id), [uiState.robots]);

  return {
    gameStateRef,
    obstaclesRef,
    uiState,
    firedTracer,
    speechBubble,
    selectedRobotId,
    setSelectedRobotId,
    availableRobots,
    socket,
    matchResult,
    serverConfirmedMode,
    matchPhase,
    trainingStats,
    // FOG toggle
    fogEnabled,
    setFogEnabled,
    socketUserId,
    spectatorCount,
    clearMatchResult: () => setMatchResult(null),
  };
};
