import { useState, useEffect, useRef, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { GameState, RobotState, ProjectileState, ObstacleState, FiredTracer, SpeechBubbleState } from "../types";

/**
 * Manages the game state, including socket communication and state updates.
 */
export const useGameState = () => {
  const socket: Socket = useMemo(() => io("http://localhost:3001", { autoConnect: false }), []);

  const [gameState, setGameState] = useState<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const [firedTracer, setFiredTracer] = useState<FiredTracer | null>(null);
  const [speechBubble, setSpeechBubble] = useState<SpeechBubbleState | null>(null);
  const [selectedRobotId, setSelectedRobotId] = useState<string>("bot-1");

  const gameStateRef = useRef<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const lastGameStateRef = useRef<GameState>({ robots: [], projectiles: [], obstacles: [] });
  const lastGameStateUpdateRef = useRef(0);
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

      const now = performance.now();
      if (now - lastGameStateUpdateRef.current < 50) return;
      lastGameStateUpdateRef.current = now;

      const robotsContainer = payload["robots"];
      const nestedRobotsContainer =
        robotsContainer && typeof robotsContainer === "object"
          ? (robotsContainer as Record<string, unknown>)["robots"]
          : undefined;

      const robotsPayload = Array.isArray(robotsContainer)
        ? robotsContainer
        : Array.isArray(nestedRobotsContainer)
          ? nestedRobotsContainer
          : [];

      const projectilesContainer = payload["projectiles"];
      const nestedProjectilesContainer =
        robotsContainer && typeof robotsContainer === "object"
          ? (robotsContainer as Record<string, unknown>)["projectiles"]
          : undefined;

      const projectilesPayload = Array.isArray(projectilesContainer)
        ? projectilesContainer
        : Array.isArray(nestedProjectilesContainer)
          ? nestedProjectilesContainer
          : [];

      const obstaclesContainer = payload["obstacles"];
      const nestedObstaclesContainer =
        robotsContainer && typeof robotsContainer === "object"
          ? (robotsContainer as Record<string, unknown>)["obstacles"]
          : undefined;

      const obstaclesPayload = Array.isArray(obstaclesContainer)
        ? obstaclesContainer
        : Array.isArray(nestedObstaclesContainer)
          ? nestedObstaclesContainer
          : [];

      const nextState: GameState = {
        robots: robotsPayload.map(item => {
          const robot = item as RobotState;
          return {
            ...robot,
            rotation: typeof robot.rotation === "number" ? robot.rotation : 0,
            spotted: typeof robot.spotted === "boolean" ? robot.spotted : undefined
          };
        }),
        projectiles: projectilesPayload as ProjectileState[],
        obstacles: obstaclesPayload as ObstacleState[]
      };

      const current = lastGameStateRef.current;

      const hasRobotDiff =
        current.robots.length !== nextState.robots.length ||
        current.robots.some((robot, index) => {
          const nextRobot = nextState.robots[index];
          if (!nextRobot) return true;
          return (
            robot.id !== nextRobot.id ||
            robot.health !== nextRobot.health ||
            robot.rotation !== nextRobot.rotation ||
            robot.spotted !== nextRobot.spotted ||
            robot.position.x !== nextRobot.position.x ||
            robot.position.y !== nextRobot.position.y
          );
        });

      const hasProjectileDiff =
        current.projectiles.length !== nextState.projectiles.length ||
        current.projectiles.some((projectile, index) => {
          const nextProjectile = nextState.projectiles[index];
          if (!nextProjectile) return true;
          return (
            projectile.id !== nextProjectile.id ||
            projectile.position.x !== nextProjectile.position.x ||
            projectile.position.y !== nextProjectile.position.y
          );
        });

      if (!hasRobotDiff && !hasProjectileDiff) return;

      lastGameStateRef.current = nextState;
      gameStateRef.current = nextState;
      setGameState(nextState);
    };

    const handleLogicExecuted = (data: { robotId: string; action: string; message?: string }) => {
      if (data.action === "FIRE") {
        setGameState(currentState => {
          const targetRobot = currentState.robots.find(r => r.id !== data.robotId);
          if (targetRobot) {
            setFiredTracer({ robotId: data.robotId, targetPosition: targetRobot.position });
            if (tracerTimeoutRef.current !== null) {
              window.clearTimeout(tracerTimeoutRef.current);
            }
            tracerTimeoutRef.current = window.setTimeout(() => setFiredTracer(null), 100);
          }
          return currentState;
        });
      }

      setSpeechBubble({ robotId: data.robotId, message: data.message ?? data.action });
      if (speechTimeoutRef.current !== null) {
        window.clearTimeout(speechTimeoutRef.current);
      }
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

      if (tracerTimeoutRef.current !== null) {
        window.clearTimeout(tracerTimeoutRef.current);
      }
      if (speechTimeoutRef.current !== null) {
        window.clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [socket]);

  const availableRobots = useMemo(() => gameState.robots.map(r => r.id), [gameState.robots]);

  return { gameState, firedTracer, speechBubble, selectedRobotId, setSelectedRobotId, availableRobots, socket };
};
