"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { LobbyMatch, LobbyMatchCard } from "./components/LobbyMatchCard";
import { LobbySkeleton } from "./components/LobbySkeleton";
import { NoScriptModal } from "./components/NoScriptModal";

import { API_BASE_URL } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";

export default function LobbyPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<LobbyMatch[]>([]);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBtn, setHoveredBtn] = useState(false);
  const [showScriptWarning, setShowScriptWarning] = useState(false);

  const socket: Socket = useMemo(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return io(API_BASE_URL, {
      autoConnect: false,
      auth: { token },
    });
  }, []);

  useEffect(() => {
    const storedScriptId = localStorage.getItem("selectedScriptId");
    if (storedScriptId) {
      setScriptId(storedScriptId);
    }

    socket.connect();

    socket.on("connect", () => {
      console.log("Connected to lobby socket");
      socket.emit("getLobby");
      setTimeout(() => setLoading(false), 500);
    });

    socket.on("lobbyList", (data: LobbyMatch[]) => {
      setMatches(data);
      setLoading(false);
    });

    socket.on("lobbyUpdated", (data: LobbyMatch[]) => {
      setMatches(data);
    });

    socket.on("matchCreated", (data: { matchId: string }) => {
      if (storedScriptId) {
        router.push(`/arena?scriptId=${storedScriptId}&matchId=${data.matchId}`);
      }
    });

    return () => {
      socket.off("lobbyList");
      socket.off("lobbyUpdated");
      socket.off("matchCreated");
      socket.disconnect();
    };
  }, [socket, router]);

  const handleCreateMatch = () => {
    if (scriptId) {
      socket.emit("createMatch", { scriptId, hostName: "Player" });
    } else {
      setShowScriptWarning(true);
    }
  };

  const handleJoinMatch = (matchId: string) => {
    if (scriptId) {
      router.push(`/arena?scriptId=${scriptId}&matchId=${matchId}`);
    } else {
      setShowScriptWarning(true);
    }
  };

  const isMobile = useMediaQuery("(max-width: 768px)");

  const DesktopLayout = (
    <div className="max-w-[1000px] mx-auto px-6 pt-12 pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]">
      {/* Header */}
      <div className="border-b border-accent/10 pb-7 mb-10 flex justify-between items-end flex-wrap gap-5">
        <div>
          <p className="text-[10px] tracking-[0.4em] text-accent/30 mb-2.5 uppercase">
            // GLOBAL_NETWORK
          </p>
          <h1 className="m-0 text-[clamp(24px,5vw,40px)] font-black tracking-[0.2em] text-accent" style={{ textShadow: "0 0 12px rgba(var(--accent-rgb),0.7), 0 0 30px rgba(var(--accent-rgb),0.3)" }}>
            MULTIPLAYER LOBBY
          </h1>
          <div className="flex items-center gap-2.5 mt-3 text-[10px] tracking-[0.18em] text-accent/70 uppercase font-bold">
            <span className="w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_var(--accent)] animate-pulse" />
            Scanning for active battlefields...
          </div>
        </div>

        <button
          onClick={handleCreateMatch}
          onMouseEnter={() => setHoveredBtn(true)}
          onMouseLeave={() => setHoveredBtn(false)}
          className={`px-7 py-3 rounded-md text-[10px] font-black tracking-[0.25em] font-mono cursor-pointer transition-all duration-200 ${hoveredBtn
              ? "bg-accent/20 border border-accent/70 text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]"
              : "bg-accent/10 border border-accent/30 text-accent/70"
            }`}
        >
          [+] DEPLOY MATCH
        </button>
      </div>

      {/* Lobby Content */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <LobbySkeleton />
        ) : matches.length === 0 ? (
          <div className="text-center p-[60px_24px] text-accent/25 text-[11px] tracking-[0.2em] border border-dashed border-accent/10 rounded-xl bg-bg-secondary/30 backdrop-blur-md">
            NO ACTIVE MATCHES FOUND.<br />
            <span className="text-[10px] text-accent/15 mt-2 block">
              DEPLOY A NEW MATCH TO CHALLENGE OTHER OPERATORS.
            </span>
          </div>
        ) : (
          matches.map((match, idx) => (
            <LobbyMatchCard
              key={match.matchId}
              match={match}
              index={idx}
              onJoin={handleJoinMatch}
            />
          ))
        )}
      </div>
    </div>
  );

  const MobileLayout = (
    <div className="w-full px-4 pt-6 pb-[calc(24px+env(safe-area-inset-bottom))] relative z-10 animate-[fadeIn_0.35s_ease] flex flex-col min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="border-b border-accent/20 pb-5 mb-5 flex flex-col text-center">
        <p className="text-[9px] tracking-[0.4em] text-accent/40 mb-1.5 uppercase">
          // GLOBAL_NETWORK
        </p>
        <h1 className="m-0 text-2xl font-black tracking-[0.2em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)] leading-tight">
          LOBBY
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2 text-[9px] tracking-[0.18em] text-accent/70 uppercase font-bold">
          <span className="w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_var(--accent)] animate-pulse" />
          Scanning signals...
        </div>
        <button
          onClick={handleCreateMatch}
          className="mt-5 w-full h-[44px] rounded-lg text-[10px] font-black tracking-[0.25em] font-mono cursor-pointer transition-transform active:scale-95 bg-accent/10 border border-accent/40 text-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.15)] uppercase flex items-center justify-center"
        >
          [+] DEPLOY MATCH
        </button>
      </div>

      {/* Lobby Content */}
      <div className="flex flex-col gap-3 flex-1">
        {loading ? (
           Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[100px] rounded-xl border border-accent/10 bg-accent/5 animate-[shimmer_1.5s_infinite]" />
           ))
        ) : matches.length === 0 ? (
          <div className="text-center p-8 text-accent/30 text-[10px] tracking-[0.2em] border border-accent/10 rounded-xl bg-accent/5 uppercase">
            No active matches.<br/>Deploy a new match to begin.
          </div>
        ) : (
          matches.map((match, idx) => (
            <LobbyMatchCard
              key={match.matchId}
              match={match}
              index={idx}
              onJoin={handleJoinMatch}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className={`min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden ${isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : "pb-12"}`}>
        {/* Grid Background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {isMobile ? MobileLayout : DesktopLayout}
      </div>

      {showScriptWarning && (
        <NoScriptModal onClose={() => setShowScriptWarning(false)} />
      )}
    </>
  );
}
