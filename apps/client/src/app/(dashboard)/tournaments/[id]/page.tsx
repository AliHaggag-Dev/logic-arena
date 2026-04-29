"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "../../../../lib/api-client";
import { Tournament } from "./types";
import { TournamentHeader } from "./components/TournamentHeader";
import { BracketSVG } from "./components/BracketSVG";
import { MatchSidebar } from "./components/MatchSidebar";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";
import { AuthModal } from "../../../../components/AuthModal";

const POLL_INTERVAL_MS = 10_000; // FIX 6: 10s — bracket only changes on match completion

// FIX 10: Bracket page skeleton — mirrors the TournamentHeader + bracket + sidebar layout
function TournamentBracketSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-accent/10 pb-7 mb-8 flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="h-2.5 w-36 bg-accent/10 rounded mb-3" />
          <div className="h-9 w-64 bg-accent/20 rounded mb-3" />
          <div className="flex gap-3 items-center">
            <div className="h-5 w-14 bg-accent/10 rounded" />
            <div className="h-3 w-40 bg-accent/10 rounded" />
          </div>
        </div>
        <div className="h-10 w-48 bg-accent/10 rounded-lg" />
      </div>

      {/* Main content skeleton */}
      <div className="flex gap-6">
        {/* Bracket area */}
        <div className="flex-1 min-w-0 rounded-2xl bg-card/10 border border-accent/10 p-6 shadow-2xl backdrop-blur-md">
          <div className="flex gap-4 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-3 w-28 bg-accent/10 rounded" />
            ))}
          </div>
          <div className="flex gap-8 items-center justify-center py-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-6">
                {[1, 2].map((j) => (
                  <div key={j} className="w-[200px] h-[54px] bg-accent/10 border border-accent/10 rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="w-[300px] shrink-0 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-card/10 border border-accent/10 backdrop-blur-md">
            <div className="flex justify-between mb-4">
              <div className="h-2 w-16 bg-accent/10 rounded" />
              <div className="h-2 w-8 bg-accent/10 rounded" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-accent/5 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-accent/20 shrink-0" />
                <div className="h-2 w-24 bg-accent/10 rounded flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TournamentBracketPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 1024px)");

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  const fetchTournament = useCallback(async () => {
    try {
      const res = await apiClient.get(`/tournaments/${id}`);
      setTournament(res.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        setIsGuest(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournament();
    const interval = setInterval(fetchTournament, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchTournament]);

  const handleStart = async () => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    setStartError(null);
    try {
      await apiClient.post(`/tournaments/${id}/start`);
      fetchTournament();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setStartError(axiosError.response?.data?.message || "Failed to start tournament");
    }
  };

  const handleSimulateWin = async (matchId: string) => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
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

  // FIX 10: Show proper skeleton instead of full-screen pulse text
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className={`max-w-[1400px] mx-auto ${isMobile ? "px-4 py-6" : "px-6 py-10"} pb-[100px] relative z-10`}>
          <TournamentBracketSkeleton />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center font-mono text-red-500/50 text-[11px] tracking-[0.2em] uppercase font-bold">
        [ERROR] Tournament not found
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
      {/* FIX 12: keyframes live in globals.css — no inline <style> blocks */}
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
            isGuest={isGuest}
            onShowAuth={() => setShowAuthModal(true)}
            startError={startError}
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
              isGuest={isGuest}
              onShowAuth={() => setShowAuthModal(true)}
            />
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="GUEST ACCESS DETECTED"
        message="You must create an account to participate in tournaments. Register now to compete and play your matches."
      />
    </>
  );
}
