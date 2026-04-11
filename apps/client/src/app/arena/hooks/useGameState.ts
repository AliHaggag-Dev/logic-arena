import { useState, useEffect, useRef, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { GameState, RobotState, ProjectileState, ObstacleState, FiredTracer, SpeechBubbleState } from "../types";

export const useGameState = () => {
  const socket: Socket = useMemo(() => io("http://localhost:3001", { autoConnect: false }), []);

  const gameStateRef = useRef<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const [uiState, setUiState] = useState<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const [firedTracer, setFiredTracer] = useState<FiredTracer | null>(null);
  const [speechBubble, setSpeechBubble] = useState<SpeechBubbleState | null>(null);
  const [selectedRobotId, setSelectedRobotId] = useState<string>("bot-1");

  const lastUiUpdateRef = useRef(0);
  const tracerTimeoutRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket Connected!");
      socket.emit("join", { userId: socket.id });
    };

    const handleGameState = (data: unknown) => {
      if (!data || typeof data !== "object") return;
      const payload = data as Record<string, unknown>;

      const parsedData: GameState = { robots: [], projectiles: [], obstacles: [] };

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
      const nestedProjectilesContainer = robotsContainer && typeof robotsContainer === "object"
        ? (robotsContainer as Record<string, unknown>)["projectiles"]
        : undefined;
      const projectilesPayload = Array.isArray(projectilesContainer)
        ? projectilesContainer
        : Array.isArray(nestedProjectilesContainer) ? nestedProjectilesContainer : [];
      parsedData.projectiles = projectilesPayload as ProjectileState[];

      const obstaclesContainer = payload["obstacles"];
      const nestedObstaclesContainer = robotsContainer && typeof robotsContainer === "object"
        ? (robotsContainer as Record<string, unknown>)["obstacles"]
        : undefined;
      const obstaclesPayload = Array.isArray(obstaclesContainer)
        ? obstaclesContainer
        : Array.isArray(nestedObstaclesContainer) ? nestedObstaclesContainer : [];
      parsedData.obstacles = obstaclesPayload as ObstacleState[];

      // Update ref instantly — zero re-render
      gameStateRef.current = parsedData;

      // Update UI state throttled — only 10x/sec
      const now = performance.now();
      if (now - lastUiUpdateRef.current > 100) {
        lastUiUpdateRef.current = now;
        setUiState(parsedData);
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

    socket.on("connect", handleConnect);
    socket.on("gameState", handleGameState);
    socket.on("logicExecuted", handleLogicExecuted);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("gameState", handleGameState);
      socket.off("logicExecuted", handleLogicExecuted);
      socket.disconnect();
      if (tracerTimeoutRef.current !== null) window.clearTimeout(tracerTimeoutRef.current);
      if (speechTimeoutRef.current !== null) window.clearTimeout(speechTimeoutRef.current);
    };
  }, [socket]);

  const availableRobots = useMemo(() => uiState.robots.map(r => r.id), [uiState.robots]);

  return { gameStateRef, uiState, firedTracer, speechBubble, selectedRobotId, setSelectedRobotId, availableRobots, socket };
};