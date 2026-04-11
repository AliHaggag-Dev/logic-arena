import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface GameState {
  // Define your GameState structure here, matching what MatchEngine sends
  players: Array<{ id: string; position: { x: number; y: number }; health: number }>;
  projectiles: any[];
}

export const useSocket = (scriptId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!scriptId) return;

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      console.error("No JWT token found. Cannot connect to websocket.");
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000", { // Adjust as needed
      auth: { token },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("WebSocket connected.");
      newSocket.emit("joinMatch", { matchId: "test-match-1", script: scriptId }); // Use a static matchId for now
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("WebSocket disconnected.");
    });

    newSocket.on("matchState", (state: GameState) => {
      setGameState(state);
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
