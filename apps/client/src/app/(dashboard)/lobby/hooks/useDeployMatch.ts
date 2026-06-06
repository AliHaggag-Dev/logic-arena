"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { getSelectedScriptId } from "../../../../lib/client-security";
import type { MatchMode } from "../../../../context/SocketContext";

const DEPLOY_TIMEOUT_MS = 10000;

interface UseDeployMatchOptions {
  socket: Socket;
  mode: MatchMode;
  onNoScript: () => void;
}

export interface UseDeployMatchReturn {
  handleDeployMatch: () => void;
  deploying: boolean;
}

export function useDeployMatch({ socket, mode, onNoScript }: UseDeployMatchOptions): UseDeployMatchReturn {
  const [deploying, setDeploying] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onMatchCreated = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const onCreateMatchError = (data: { message: string }) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setDeploying(false);
      alert(`Error: ${data.message}`);
    };

    socket.on("matchCreated", onMatchCreated);
    socket.on("createMatchError", onCreateMatchError);

    return () => {
      socket.off("matchCreated", onMatchCreated);
      socket.off("createMatchError", onCreateMatchError);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [socket]);

  const handleDeployMatch = useCallback(() => {
    const scriptId = getSelectedScriptId();
    if (!scriptId) {
      onNoScript();
      return;
    }
    setDeploying(true);
    socket.emit("createMatch", { scriptId, hostName: "Player", mode });

    timeoutRef.current = setTimeout(() => {
      setDeploying(false);
      alert("Match creation timed out. Please try again.");
    }, DEPLOY_TIMEOUT_MS);
  }, [socket, mode, onNoScript]);

  return { handleDeployMatch, deploying };
}
