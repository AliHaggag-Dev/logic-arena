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
import { interpolationBuffer } from '../../core/interpolation-buffer';

export interface MatchPhaseState {
  phase: 'WAITING' | 'ROUND_ACTIVE' | 'BREAK' | 'FINISHED';
  roundNumber: number;
  timeLeft: number;
  phaseEndsAt: number;
  scripts: { userId: string; script: string }[];
  readyUserIds: string[];
}

export const useGameState = (
  scriptId: string | null,
  mode?: string,
  matchMode?: string,
  isSpectator = false,
) => {
  // aiDifficulty is read from URL search params directly since it's a user choice,
  // not part of the core game state flow
  const searchParams = useSearchParams();
  const matchIdFromUrl = searchParams.get('matchId');
  const themeFromUrl = searchParams.get('theme') || 'CYBER';
  const aiDifficultyFromUrl = searchParams.get('aiDifficulty') || null;

  // Capture parameters in refs on mount to prevent socket reconnection cascades
  const themeFromUrlRef = useRef(themeFromUrl);
  const modeRef = useRef(mode);
  const aiDifficultyRef = useRef(aiDifficultyFromUrl);
  const scriptIdRef = useRef(scriptId);
  const isSpectatorRef = useRef(isSpectator);

  // Generate matchId once per component lifecycle to survive socket reconnects
  const sessionMatchId = useMemo(() => matchIdFromUrl || crypto.randomUUID(), [matchIdFromUrl]);

  const socket = useSocket();
  const { speechBubble, setRobotBubble, cleanupBubbles } = useSpeechBubbles();

  // Core game state — ref for zero-render R3F reads, state for UI
  const gameStateRef = useRef<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const obstaclesRef = useRef<ObstacleState[]>([]);
  const [uiState, setUiState] = useState<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const firedTracerRef = useRef<FiredTracer | null>(null);
  const [selectedRobotId, setSelectedRobotId] = useState<string>(getAuthUserId() || '');
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
    playerStats?: Record<string, {
      eloDelta: number;
      newStats: {
        precision: number;
        defense: number;
        aggression: number;
        speed?: number;
      };
      durationSecs: number;
      rank: string | number;
    }>;
    aiPoints?: { pointsAwarded: number; breakdown: { base: number; difficultyMultiplier: number; performance: number; performanceLabel: string } };
  } | null>(null);
  const [serverConfirmedMode, setServerConfirmedMode] = useState<string>(mode || 'COMBAT');
  const [matchPhase, setMatchPhase] = useState<MatchPhaseState>({
    phase: 'ROUND_ACTIVE',
    roundNumber: 1,
    timeLeft: 0,
    phaseEndsAt: 0,
    scripts: [],
    readyUserIds: [],
  });

  // Spectator viewer count — updated by server spectatorCount events
  const [spectatorCount, setSpectatorCount] = useState<number>(0);

  // FOG toggle (spectator/debug)
  const [fogEnabled, setFogEnabled] = useState<boolean>(true);

  const lastUiUpdateRef = useRef(0);
  const tracerTimeoutRef = useRef<number | null>(null);
  // Tracks whether joinMatch was already emitted for the current connection
  // to avoid double-joining when both handleConnect and handleAuthenticated
  // attempt to send it in rapid succession.
  const joinMatchSentRef = useRef(false);

  // Keep scriptIdRef in sync with the resolved scriptId prop.
  // For guests the resolution is async: scriptId starts as null and changes to
  // 'guest-script' after useScriptResolver finishes. When that happens and the
  // socket is already connected and authenticated but joinMatch was not yet sent,
  // we need to send joinMatch ourselves.
  useEffect(() => {
    const wasNull = scriptIdRef.current === null;
    scriptIdRef.current = scriptId;

    if (!isSpectator && scriptId && wasNull && socket.connected && !joinMatchSentRef.current) {
      joinMatchSentRef.current = true;
      socket.emit('joinMatch', {
        matchId: sessionMatchId,
        scriptId,
        mode: modeRef.current || 'COMBAT',
        matchMode: matchMode || 'HYBRID',
        mapTheme: themeFromUrlRef.current,
        aiDifficulty: aiDifficultyRef.current,
      });
    }
  }, [scriptId, isSpectator, socket, sessionMatchId, matchMode]);

  useEffect(() => {
    // ── Full state reset between arena mounts ──────────────────────────
    // Without this, stale IDs from the previous match leak into the new
    // one, causing updateLogic to send the wrong robotId and the server
    // to silently reject it.
    gameStateRef.current = { robots: [], projectiles: [], obstacles: [], mapTheme: undefined };
    obstaclesRef.current = [];
    interpolationBuffer.clear();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUiState({ robots: [], projectiles: [], obstacles: [], mapTheme: undefined });
    setMatchResult(null);
    setSelectedRobotId('');
    setSocketUserId(null);
    setTrainingStats({ shotsFired: 0, startTime: Date.now(), dummiesDestroyed: 0 });

    // -----------------------------------------------------------------------
    // Socket event handlers
    // -----------------------------------------------------------------------

    // Reset join-guard on every new socket effect run (new connection)
    joinMatchSentRef.current = false;

    const emitJoinMatch = () => {
      if (joinMatchSentRef.current) return;
      joinMatchSentRef.current = true;
      socket.emit('joinMatch', {
        matchId: sessionMatchId,
        scriptId: scriptIdRef.current,
        mode: modeRef.current || 'COMBAT',
        matchMode: matchMode || 'HYBRID',
        mapTheme: themeFromUrlRef.current,
        aiDifficulty: aiDifficultyRef.current,
      });
    };

    const handleConnect = () => {
      console.log('[Socket] Connected');
      if (isSpectatorRef.current) {
        socket.emit('spectate', { matchId: sessionMatchId });
      } else if (scriptIdRef.current) {
        emitJoinMatch();
      }
      // If scriptId is not yet resolved (e.g. guest async resolve), joinMatch
      // will be sent from handleAuthenticated once the server confirms identity.
    };

    const handleMatchJoinedInfo = (data: { mode: string; phase?: MatchPhaseState['phase']; roundNumber?: number; timeLeft?: number; phaseEndsAt?: number }) => {
      setServerConfirmedMode(data.mode);
      if (data.phase) {
        setMatchPhase((prev) => ({
          ...prev,
          phase: data.phase ?? prev.phase,
          roundNumber: data.roundNumber ?? prev.roundNumber,
          timeLeft: data.timeLeft ?? prev.timeLeft,
          phaseEndsAt: data.phaseEndsAt ?? prev.phaseEndsAt,
        }));
      }
    };

    const handleAuthenticated = (data: { userId?: string; isGuest?: boolean }) => {
      console.log('[Socket] Authenticated:', data);
      if (data.userId) {
        setSocketUserId(data.userId);
        // Force-set selectedRobotId to the new userId. Using prev || id
        // would keep a stale guest ID from the previous socket connection.
        setSelectedRobotId(data.userId);

        // Guest case: scriptId may not have been resolved yet when handleConnect
        // fired. Now that the server has confirmed our identity and we have a
        // userId, send joinMatch if scriptId is ready and we are not spectating.
        if (!isSpectatorRef.current && scriptIdRef.current) {
          emitJoinMatch();
        }
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

      // Push every snapshot into the interpolation buffer for smooth 120fps rendering
      interpolationBuffer.push(parsed);

      // Throttled UI state update — 10×/sec max
      // Uses the DELAYED snapshot (100ms ago) so React component liveness
      // matches the visual timeline — projectiles won't vanish mid-air.
      const now = performance.now();
      if (now - lastUiUpdateRef.current > 100) {
        lastUiUpdateRef.current = now;
        const delayedState = interpolationBuffer.getDelayedSnapshot() ?? parsed;
        setUiState({ ...delayedState, obstacles: [] });
        const activeUserId = getAuthUserId() || socketUserId;
        setSelectedRobotId(prev => {
          const hasUser = activeUserId && delayedState.robots.some(r => r.id === activeUserId);
          const hasPrev = prev && delayedState.robots.some(r => r.id === prev);

          if (!hasPrev && delayedState.robots.length > 0) {
            return hasUser ? activeUserId : delayedState.robots[0].id;
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
          firedTracerRef.current = {
            robotId: data.robotId,
            targetPosition: targetRobot.position,
            isPredicted: data.isPredicted ?? false,
            predictedPosition: data.predictedPosition,
          };
          if (tracerTimeoutRef.current !== null) window.clearTimeout(tracerTimeoutRef.current);
          tracerTimeoutRef.current = window.setTimeout(() => {
            firedTracerRef.current = null;
          }, 100);
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
      aiPoints?: { pointsAwarded: number; breakdown: { base: number; difficultyMultiplier: number; performance: number; performanceLabel: string } };
    }) => {
      setMatchResult({
        winner: data.winner,
        draw: data.draw,
        efficiencyScores: data.efficiencyScores ?? {},
        playerStats: data.playerStats,
        aiPoints: data.aiPoints,
      });
    };

    const handlePhaseChanged = (data: { phase: MatchPhaseState['phase']; roundNumber: number; timeLeft: number; phaseEndsAt?: number }) => {
      setMatchPhase((prev) => ({
        ...prev,
        phase: data.phase,
        roundNumber: data.roundNumber,
        timeLeft: data.timeLeft,
        phaseEndsAt: data.phaseEndsAt ?? (Date.now() + data.timeLeft * 1000),
        readyUserIds: data.phase === 'BREAK' ? prev.readyUserIds : [],
      }));
    };

    const handleBreakStarted = (data: { scripts: MatchPhaseState['scripts']; timeLeft: number; phaseEndsAt?: number }) => {
      setMatchPhase((prev) => ({
        ...prev,
        phase: 'BREAK',
        timeLeft: data.timeLeft,
        phaseEndsAt: data.phaseEndsAt ?? (Date.now() + data.timeLeft * 1000),
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
      // Notify server to forcefully clean up the match before disconnecting
      if (socket.connected) {
        socket.emit('leaveMatch', { matchId: sessionMatchId });
      }
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
      firedTracerRef.current = null;
      cleanupBubbles();
      interpolationBuffer.clear();
    };
  }, [socket, matchIdFromUrl, matchMode, setRobotBubble, cleanupBubbles]);

  const robotIdsKey = JSON.stringify(uiState.robots.map(r => r.id).sort());
  const availableRobots = useMemo(() => uiState.robots.map(r => r.id), [robotIdsKey]);

  return {
    gameStateRef,
    obstaclesRef,
    uiState,
    firedTracer: firedTracerRef,
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
    sessionMatchId,
    clearMatchResult: () => setMatchResult(null),
  };
};
