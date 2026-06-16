"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LobbyMatchCard } from "./components/LobbyMatchCard";
import type { LobbyMatch } from "./components/LobbyMatchCard";
import { LobbySkeleton } from "./components/LobbySkeleton";
import { NoScriptModal } from "./components/NoScriptModal";
import { ConnectionStatusBar } from "./components/ConnectionStatusBar";
import { ErrorPanel } from "./components/ErrorPanel";
import { MatchModeSelector } from "./components/MatchModeSelector";
import { useLobbySocket } from "./hooks/useLobbySocket";
import { useDeployMatch } from "./hooks/useDeployMatch";
import { useAuthState } from "../../../hooks/useAuthState";
import { getSelectedScriptId } from "../../../lib/client-security";
import type { MatchMode } from "../../../context/SocketContext";
import type { ConnectionStatus } from "./hooks/useLobbySocket";

/* ── min-height constants for CLS prevention ── */
const DESKTOP_HEADER_MIN_H = "min-h-[280px]";
const MOBILE_HEADER_MIN_H = "min-h-[340px]";

/* ── Shared layout prop types ── */
interface LayoutShellProps {
  matches: LobbyMatch[];
  connectionStatus: ConnectionStatus;
  selectedMode: MatchMode;
  onSelectMode: (mode: MatchMode) => void;
  onDeployMatch: () => void;
  onJoinMatch: (match: LobbyMatch) => void;
  onRetry: () => void;
  isGuest: boolean;
}

/* ── Desktop shell (pure presentation) ── */
function DesktopShell({
  matches,
  connectionStatus,
  selectedMode,
  onSelectMode,
  onDeployMatch,
  onJoinMatch,
  onRetry,
  isGuest,
}: LayoutShellProps) {
  return (
    <div className="mx-auto hidden min-h-full max-w-[1120px] flex-col px-6 py-6 relative z-10 animate-[fadeIn_0.35s_ease] md:flex">
      <div className={`shrink-0 border-b border-white/[0.08] pb-4 mb-4 relative ${DESKTOP_HEADER_MIN_H}`}>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="m-0 text-4xl font-bold tracking-tight text-white mb-2">
            Multiplayer Lobby
          </h1>
          <ConnectionStatusBar connectionStatus={connectionStatus} isMobile={false} />
        </div>
        <div className="mt-5 flex max-w-[980px] flex-col gap-4 relative z-10">
          <MatchModeSelector selectedMode={selectedMode} onSelectMode={onSelectMode} isMobile={false} />
          <button
            type="button"
            onClick={onDeployMatch}
            disabled={isGuest}
            className={`group relative min-h-[50px] overflow-hidden rounded-full border border-white/10 px-8 text-sm font-bold tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-accent text-bg-primary hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] flex justify-center items-center shadow-lg ${isGuest ? '' : 'cursor-pointer'}`}
          >
            <span>{isGuest ? "LOGIN TO DEPLOY" : `CREATE ${selectedMode} MATCH`}</span>
          </button>
        </div>
      </div>
      <div className="flex-1 pr-2 flex flex-col gap-4 relative z-10">
        {connectionStatus === "connecting" ? <LobbySkeleton /> : connectionStatus === "error" ? <ErrorPanel onRetry={onRetry} /> : matches.length === 0 ? (
          <div className="text-center p-10 text-white/50 text-sm font-medium border border-white/5 rounded-[24px] bg-white/[0.02] backdrop-blur-xl">
            No active matches found.<br />
            <span className="text-xs text-white/30 mt-2 block font-normal">Create a new match to challenge other players.</span>
          </div>
        ) : matches.map((match, idx) => <LobbyMatchCard key={match.matchId} match={match} index={idx} onJoin={onJoinMatch} isGuest={isGuest} isMobile={false} />)}
      </div>
    </div>
  );
}

/* ── Mobile shell (pure presentation) ── */
function MobileShell({
  matches,
  connectionStatus,
  selectedMode,
  onSelectMode,
  onDeployMatch,
  onJoinMatch,
  onRetry,
  isGuest,
}: LayoutShellProps) {
  return (
    <div className="w-full px-5 pt-6 pb-[calc(20px+env(safe-area-inset-bottom))] relative z-10 animate-[fadeIn_0.35s_ease] flex min-h-full flex-col md:hidden">
      <div className={`shrink-0 pb-5 flex flex-col relative ${MOBILE_HEADER_MIN_H}`}>
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-accent/15 rounded-full blur-[60px] pointer-events-none" />
        <h1 className="m-0 text-[32px] font-bold tracking-tight text-white mb-2 relative z-10">Lobby</h1>
        <div className="relative z-10"><ConnectionStatusBar connectionStatus={connectionStatus} isMobile={true} /></div>
        <div className="mt-6 relative z-10">
          <MatchModeSelector selectedMode={selectedMode} onSelectMode={onSelectMode} isMobile={true} />
        </div>
        <button type="button" disabled={isGuest} onClick={onDeployMatch} className="mt-5 w-full h-[56px] rounded-full text-sm font-bold tracking-wide transition-all duration-300 active:scale-[0.96] bg-accent text-bg-primary shadow-[0_12px_30px_rgba(var(--accent-rgb),0.3)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed relative z-10">
          {isGuest ? "LOGIN TO CREATE" : `CREATE ${selectedMode} MATCH`}
        </button>
      </div>
      <div className="flex flex-col gap-4 flex-1 relative z-10 px-1 -mx-1 pt-2">
        {connectionStatus === "connecting" ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[120px] rounded-[28px] border border-white/[0.05] bg-white/[0.03] backdrop-blur-xl animate-pulse" />
        )) : connectionStatus === "error" ? <ErrorPanel onRetry={onRetry} /> : matches.length === 0 ? (
          <div className="text-center p-8 text-white/50 text-sm font-medium border border-white/5 rounded-[28px] bg-white/[0.02] backdrop-blur-xl">
            No active matches found.<br />
            <span className="text-xs text-white/30 mt-2 block font-normal">Create a new match to challenge other players.</span>
          </div>
        ) : matches.map((match, idx) => <LobbyMatchCard key={match.matchId} match={match} index={idx} onJoin={onJoinMatch} isGuest={isGuest} isMobile={true} />)}
      </div>
    </div>
  );
}

export default function LobbyPage() {
  const router = useRouter();
  const [showScriptWarning, setShowScriptWarning] = useState(false);
  const [selectedMode, setSelectedMode] = useState<MatchMode>("CLASSIC");
  const { isGuest } = useAuthState();

  /* All socket/data logic lives here — shared by both layout shells */
  const { matches, connectionStatus, setRetryKey, socket } = useLobbySocket(selectedMode);
  const { handleDeployMatch } = useDeployMatch({ socket, mode: selectedMode, onNoScript: () => setShowScriptWarning(true) });

  const handleJoinMatch = (match: LobbyMatch) => {
    if (isGuest) return;
    const scriptId = getSelectedScriptId();
    if (scriptId) router.push(`/arena?scriptId=${scriptId}&matchId=${match.matchId}&mode=${match.mode ?? "CLASSIC"}`);
    else setShowScriptWarning(true);
  };

  const handleRetry = () => setRetryKey((k) => k + 1);

  /* Shared props — both shells get identical data, zero duplicate connections */
  const shellProps: LayoutShellProps = {
    matches,
    connectionStatus,
    selectedMode,
    onSelectMode: setSelectedMode,
    onDeployMatch: handleDeployMatch,
    onJoinMatch: handleJoinMatch,
    onRetry: handleRetry,
    isGuest,
  };

  return (
    <>
      <div className="bg-bg-primary font-sans text-white relative min-h-[calc(100vh-80px)]">
        <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-primary to-accent/10 pointer-events-none z-0" />
        <DesktopShell {...shellProps} />
        <MobileShell {...shellProps} />
      </div>
      {showScriptWarning && <NoScriptModal onClose={() => setShowScriptWarning(false)} />}
    </>
  );
}
