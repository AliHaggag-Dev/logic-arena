"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { LobbyMatch } from "../components/LobbyMatchCard";
// Socket.IO connects to the server origin — strip the /api path suffix if present
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api").replace(/\/api$/, "");

export type ConnectionStatus = "connecting" | "connected" | "error";

export interface UseLobbySocketReturn {
  matches: LobbyMatch[];
  connectionStatus: ConnectionStatus;
  retryKey: number;
  setRetryKey: React.Dispatch<React.SetStateAction<number>>;
  socket: Socket;
}

export function useLobbySocket(): UseLobbySocketReturn {
  const router = useRouter();
  const [matches, setMatches] = useState<LobbyMatch[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [retryKey, setRetryKey] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  
  if (!socketRef.current && typeof window !== "undefined") {
    socketRef.current = io(SOCKET_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }

  const scriptIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    scriptIdRef.current = localStorage.getItem("selectedScriptId");
    
    const handleStorage = () => {
      scriptIdRef.current = localStorage.getItem("selectedScriptId");
    };
    
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("jwtToken") ||
      null;

    if (!token) {
      setConnectionStatus("error");
      return;
    }

    socket.auth = { token };

    setConnectionStatus("connecting");
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      console.log("Connected to lobby socket");
      socket.emit("getLobby");
      setTimeout(() => setConnectionStatus("connected"), 500);
    };

    const onConnectError = () => {
      setConnectionStatus("error");
    };

    const onLobbyList = (data: LobbyMatch[]) => {
      setMatches(data);
      setConnectionStatus("connected");
    };

    const onLobbyUpdated = (data: LobbyMatch[]) => {
      setMatches(data);
    };

    const onMatchCreated = (data: { matchId: string }) => {
      if (scriptIdRef.current) {
        router.push(`/arena?scriptId=${scriptIdRef.current}&matchId=${data.matchId}`);
      }
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("lobbyList", onLobbyList);
    socket.on("lobbyUpdated", onLobbyUpdated);
    socket.on("matchCreated", onMatchCreated);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("lobbyList", onLobbyList);
      socket.off("lobbyUpdated", onLobbyUpdated);
      socket.off("matchCreated", onMatchCreated);
    };
  }, [retryKey, router]);

  useEffect(() => {
    const socket = socketRef.current;
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return { matches, connectionStatus, retryKey, setRetryKey, socket: socketRef.current as Socket };
}
