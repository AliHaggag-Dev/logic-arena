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
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useAuthState } from "../../../hooks/useAuthState";
import { getSelectedScriptId } from "../../../lib/client-security";
import type { MatchMode } from "../../../context/SocketContext";

export default function LobbyPage() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showScriptWarning, setShowScriptWarning] = useState(false);
  const [selectedMode, setSelectedMode] = useState<MatchMode>("CLASSIC");
  const { isGuest } = useAuthState();

  const { matches, connectionStatus, setRetryKey, socket } = useLobbySocket(selectedMode);
  const { handleDeployMatch } = useDeployMatch({ socket, mode: selectedMode, onNoScript: () => setShowScriptWarning(true) });

  const handleJoinMatch = (match: LobbyMatch) => {
    if (isGuest) return;
    const scriptId = getSelectedScriptId();
    if (scriptId) router.push(`/arena?scriptId=${scriptId}&matchId=${match.matchId}&mode=${match.mode ?? "CLASSIC"}`);
    else setShowScriptWarning(true);
  };


  const DesktopLayout = (
    <div className="max-w-[1000px] mx-auto px-6 pt-12 pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]">
      <div className="border-b border-accent/10 pb-7 mb-10 flex justify-between items-end flex-wrap gap-5">
        <div>
          <p className="text-[10px] tracking-[0.4em] text-accent/30 mb-2.5 uppercase">// LIVE</p>
          <h1 className="m-0 text-[clamp(24px,5vw,40px)] font-black tracking-[0.2em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)]">
            MULTIPLAYER_LOBBY
          </h1>
          <ConnectionStatusBar connectionStatus={connectionStatus} isMobile={false} />
        </div>
        <div className="flex flex-col items-stretch gap-4">
          <MatchModeSelector selectedMode={selectedMode} onSelectMode={setSelectedMode} isMobile={false} />
          <button
            type="button"
            onClick={handleDeployMatch}
            disabled={isGuest}
            className={`px-7 py-3 rounded-md text-[10px] font-black tracking-[0.25em] font-mono transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed 
            bg-accent/10 border border-accent/30 text-accent/70 hover:bg-accent/20 hover:border-accent/70 hover:text-accent hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]
            ${isGuest ? 'text-accent/40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isGuest ? "LOGIN TO DEPLOY" : "[+] CREATE MATCH"}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {connectionStatus === "connecting" ? <LobbySkeleton /> : connectionStatus === "error" ? <ErrorPanel onRetry={() => setRetryKey((k) => k + 1)} /> : matches.length === 0 ? (
          <div className="text-center p-[60px_24px] text-accent/25 text-[11px] tracking-[0.2em] border border-dashed border-accent/10 rounded-xl bg-bg-secondary/30 backdrop-blur-md">
            NO ACTIVE MATCHES FOUND.<br />
            <span className="text-[10px] text-accent/15 mt-2 block">Create a new match to challenge other players.</span>
          </div>
        ) : matches.map((match, idx) => <LobbyMatchCard key={match.matchId} match={match} index={idx} onJoin={handleJoinMatch} isGuest={isGuest} />)}
      </div>
    </div>
  );

  const MobileLayout = (
    <div className="w-full px-4 pt-6 pb-[calc(24px+env(safe-area-inset-bottom))] relative z-10 animate-[fadeIn_0.35s_ease] flex flex-col min-h-[calc(100vh-80px)]">
      <div className="border-b border-accent/20 pb-5 mb-5 flex flex-col text-center">
        <p className="text-[9px] tracking-[0.4em] text-accent/70 mb-1.5 uppercase">// LIVE</p>
        <h1 className="m-0 text-2xl font-black tracking-[0.2em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)] leading-tight">LOBBY</h1>
        <ConnectionStatusBar connectionStatus={connectionStatus} isMobile={true} />
        <div className="mt-5">
          <MatchModeSelector selectedMode={selectedMode} onSelectMode={setSelectedMode} isMobile={true} />
        </div>
        <button type="button" disabled={isGuest} onClick={handleDeployMatch} className="mt-5 w-full h-[44px] rounded-lg text-[10px] font-black tracking-[0.25em] font-mono transition-transform active:scale-95 bg-accent/10 border border-accent/40 text-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.15)] uppercase flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          {isGuest ? "LOGIN TO CREATE MATCH" : "[+] CREATE MATCH"}
        </button>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {connectionStatus === "connecting" ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[100px] rounded-xl border border-accent/10 bg-accent/5 animate-[shimmer_1.5s_infinite]" />
        )) : connectionStatus === "error" ? <ErrorPanel onRetry={() => setRetryKey((k) => k + 1)} /> : matches.length === 0 ? (
          <div className="text-center p-8 text-accent/30 text-[10px] tracking-[0.2em] border border-accent/10 rounded-xl bg-accent/5 uppercase">
            NO ACTIVE MATCHES FOUND.<br />
            <span className="text-[9px] text-accent/20 mt-2 block">Create a new match to challenge other players.</span>
          </div>
        ) : matches.map((match, idx) => <LobbyMatchCard key={match.matchId} match={match} index={idx} onJoin={handleJoinMatch} isGuest={isGuest} />)}
      </div>
    </div>
  );

  return (
    <>
      <div className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : "pb-12"}`}>
        <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        {isMobile ? MobileLayout : DesktopLayout}
      </div>
      {showScriptWarning && <NoScriptModal onClose={() => setShowScriptWarning(false)} />}
    </>
  );
}
