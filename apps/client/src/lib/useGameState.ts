import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface RobotState {
  id: string;
  position: { x: number; y: number };
  health: number;
  color?: string;
  rotation?: number;
  velocity?: { x: number; y: number };
  spotted?: boolean;
}

interface GameState {
  robots: RobotState[];
  projectiles: any[];
  obstacles?: any[];
}

export const useSocket = (scriptId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const normalizeState = (state: any): GameState => ({
    ...state,
    robots: state.players || state.robots || [],
    projectiles: state.projectiles || [],
    obstacles: state.obstacles || [],
  });

  useEffect(() => {
    if (!scriptId) return;

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      console.error("No JWT token found. Cannot connect to websocket.");
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001", {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("WebSocket connected.");
      newSocket.emit("joinMatch", { matchId: "test-match-1", scriptId });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("WebSocket disconnected.");
    });

    newSocket.on("matchState", (state: any) => {
      setGameState(normalizeState(state));
    });

    newSocket.on("gameState", (state: any) => {
      setGameState(normalizeState(state));
    });

    newSocket.on("error", (error: any) => {
      console.error("WebSocket error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [scriptId]);

  return { socket, isConnected, gameState };
};