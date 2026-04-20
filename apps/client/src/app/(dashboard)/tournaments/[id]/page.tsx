"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { Tournament } from "./types";
import { TournamentHeader } from "./components/TournamentHeader";
import { BracketSVG } from "./components/BracketSVG";
import { MatchSidebar } from "./components/MatchSidebar";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";

export default function TournamentBracketPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  const fetchTournament = useCallback(async () => {
    try {
      const res = await apiClient.get(`/tournaments/${id}`);
      setTournament(res.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournament();
    const interval = setInterval(fetchTournament, 3000);
    return () => clearInterval(interval);
  }, [fetchTournament]);

  const handleStart = async () => {
    try {
      await apiClient.post(`/tournaments/${id}/start`);
      fetchTournament();
    } catch {
      /* silent */
    }
  };

  const handleSimulateWin = async (matchId: string) => {
    if (!userId) return;
    setSimulating(matchId);
    try {
      await apiClient.post(`/tournaments/${id}/matches/${matchId}/complete`, { winnerId: userId });
      fetchTournament();
    } catch {
      /* silent */
    } finally {
      setSimulating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center font-mono text-accent/30 text-[10px] tracking-[0.34em] uppercase animate-pulse">
        <span className="mb-4">UPLINKING_BRACKET_DATA...</span>
        <div className="w-24 h-[1px] bg-accent/20" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center font-mono text-red-500/50 text-[11px] tracking-[0.2em] uppercase font-bold">
        [ERROR] TOURNAMENT_NOT_FOUND
      </div>
    );
  }

  const myMatch =
    tournament.status === "IN_PROGRESS" && userId
      ? tournament.matches.find(
          (m) =>
            m.status !== "COMPLETED" &&
            (m.player1Id === userId || m.player2Id === userId) &&
            m.player1Id &&
            m.player2Id
        ) || null
      : null;

  const myOpponent =
    myMatch && userId
      ? myMatch.player1Id === userId
        ? myMatch.player2
        : myMatch.player1
      : null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(var(--color-yellow-500),0.2); }
          50% { border-color: rgba(var(--color-yellow-500),0.6); }
        }
      `}</style>
      <div className="min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
        {/* Grid bg */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className={`max-w-[1400px] mx-auto ${isMobile ? "px-4 py-6" : "px-6 py-10"} pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]`}>
          
          <TournamentHeader 
            tournament={tournament} 
            userId={userId} 
            onStart={handleStart} 
            isMobile={isMobile}
          />

          {/* MAIN CONTENT: Bracket + Sidebar */}
          <div className={`flex ${isMobile ? "flex-col" : "lg:flex-nowrap"} gap-6`}>
            {/* BRACKET AREA */}
            <div className={`flex-1 min-w-0 ${isMobile ? "" : "lg:min-w-[600px]"} rounded-2xl bg-card/10 border border-accent/10 ${isMobile ? "p-4" : "p-6"} overflow-x-auto relative group shadow-2xl backdrop-blur-md`}>
              {/* Scanline overlay for bracket container */}
              <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.02] bg-[repeating-linear-gradient(0deg,rgba(var(--accent-rgb),0.5)_0px,rgba(var(--accent-rgb),0.5)_1px,transparent_1px,transparent_4px)]" />
              
              <BracketSVG tournament={tournament} userId={userId} isMobile={isMobile} />
            </div>

            {/* SIDEBAR / MATCH TRACKER */}
            <MatchSidebar 
              tournament={tournament} 
              userId={userId} 
              myMatch={myMatch} 
              myOpponent={myOpponent} 
              simulating={simulating} 
              onSimulateWin={handleSimulateWin} 
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
    </>
  );
}
