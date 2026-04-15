import { useState, useEffect, useRef, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";
import { GameState, RobotState, ProjectileState, ObstacleState, FiredTracer, SpeechBubbleState } from "../types";

export const useGameState = (scriptId: string | null, mode: string | null) => {
    const searchParams = useSearchParams();
    const matchIdFromUrl = searchParams.get("matchId");
  const socket: Socket = useMemo(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return io("http://localhost:3001", {
      autoConnect: false,
      auth: { token }
    });
  }, []);

  const gameStateRef = useRef<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const [uiState, setUiState] = useState<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const [firedTracer, setFiredTracer] = useState<FiredTracer | null>(null);
  const [speechBubble, setSpeechBubble] = useState<SpeechBubbleState | null>(null);
  const [selectedRobotId, setSelectedRobotId] = useState<string>("");
  const [matchResult, setMatchResult] = useState<{ winner: { id: string; color: string } | null; draw: boolean } | null>(null);
  const [serverConfirmedMode, setServerConfirmedMode] = useState<string>(mode || "COMBAT");

  const lastUiUpdateRef = useRef(0);
  const tracerTimeoutRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear state dynamically when effect re-runs (e.g. mode changes)
    gameStateRef.current = { robots: [], projectiles: [], obstacles: [] };
    setUiState({ robots: [], projectiles: [], obstacles: [] });
    setMatchResult(null);

    const handleConnect = () => {
      console.log("✅ Socket Connected or Mode Re-initialized!");
      if (scriptId) {
        const matchId = matchIdFromUrl || "default-match";
        socket.emit("joinMatch", { matchId, scriptId, mode: mode || "COMBAT" });
      }
    };

    const handleMatchJoinedInfo = (data: { mode: string }) => {
      setServerConfirmedMode(data.mode);
    };

    const handleAuthenticated = (data: any) => {
      console.log("✅ Authenticated:", data);
    };

    const handleError = (error: any) => {
      console.error("❌ Socket Error:", error);
    };

    const handleGameState = (data: unknown) => {
      if (!data || typeof data !== "object") return;
      const payload = data as Record<string, unknown>;

      let parsedData: GameState = { robots: [], projectiles: [], obstacles: [] };

      if (payload.type === 'delta') {
          const diff: any = payload.diff;
          parsedData = { ...gameStateRef.current };
          if (diff.robots) {
              parsedData.robots = parsedData.robots.map(r => {
                  const rd = diff.robots.find((d: any) => d.id === r.id);
                  if (rd) return { ...r, ...rd };
                  return r;
              });
          }
          if (diff.projectiles) parsedData.projectiles = diff.projectiles;
          if (diff.obstacles) parsedData.obstacles = diff.obstacles;
      } else if (payload.type === 'full') {
          parsedData = payload.state as GameState;
      } else {
          // Fallback legacy
          const robotsContainer = payload["robots"];
          const nestedRobotsContainer = robotsContainer && typeof robotsContainer === "object"
            ? (robotsContainer as Record<string, unknown>)["robots"]
            : undefined;
          const robotsPayload = Array.isArray(robotsContainer)
            ? robotsContainer
            : Array.isArray(nestedRobotsContainer) ? nestedRobotsContainer : [];

          parsedData.robots = robotsPayload.map(item => {
            const robot = item as RobotState;
            return {
              ...robot,
              rotation: typeof robot.rotation === "number" ? robot.rotation : 0,
              spotted: typeof robot.spotted === "boolean" ? robot.spotted : undefined
            };
          });

          const projectilesContainer = payload["projectiles"];
          const projectilesPayload = Array.isArray(projectilesContainer) ? projectilesContainer : [];
          parsedData.projectiles = projectilesPayload as ProjectileState[];

          const obstaclesContainer = payload["obstacles"];
          const obstaclesPayload = Array.isArray(obstaclesContainer) ? obstaclesContainer : [];
          parsedData.obstacles = obstaclesPayload as ObstacleState[];
      }

      // Update ref instantly — zero re-render
      gameStateRef.current = parsedData;

      // Update UI state throttled — only 10x/sec
      const now = performance.now();
      if (now - lastUiUpdateRef.current > 200) {
        lastUiUpdateRef.current = now;
        setUiState(parsedData);
        setSelectedRobotId(prev => {
          if (!prev && parsedData.robots.length > 0) {
            return parsedData.robots[0].id;
          }
          return prev;
        });
      }
    };

    const handleLogicExecuted = (data: { robotId: string; action: string; message?: string }) => {
      if (data.action === "FIRE") {
        const currentState = gameStateRef.current;
        const targetRobot = currentState.robots.find(r => r.id !== data.robotId);
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

    const handleMatchOver = (data: { winner: { id: string; color: string } | null; draw: boolean }) => {
      setMatchResult(data);
    };

    socket.on("connect", handleConnect);
    socket.on("authenticated", handleAuthenticated);
    socket.on("error", handleError);
    socket.on("gameState", handleGameState);
    socket.on("logicExecuted", handleLogicExecuted);
    socket.on("matchOver", handleMatchOver);
    socket.on("matchJoinedInfo", handleMatchJoinedInfo);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("authenticated", handleAuthenticated);
      socket.off("error", handleError);
      socket.off("gameState", handleGameState);
      socket.off("logicExecuted", handleLogicExecuted);
      socket.off("matchOver", handleMatchOver);
      socket.off("matchJoinedInfo", handleMatchJoinedInfo);
      socket.disconnect();
      if (tracerTimeoutRef.current !== null) window.clearTimeout(tracerTimeoutRef.current);
      if (speechTimeoutRef.current !== null) window.clearTimeout(speechTimeoutRef.current);
    };
  }, [socket, scriptId, matchIdFromUrl, mode]);

  const availableRobots = useMemo(() => uiState.robots.map(r => r.id), [uiState.robots]);

  return { gameStateRef, uiState, firedTracer, speechBubble, selectedRobotId, setSelectedRobotId, availableRobots, socket, matchResult, serverConfirmedMode };
};
