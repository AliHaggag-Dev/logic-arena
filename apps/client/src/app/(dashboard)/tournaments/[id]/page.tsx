"use client";

import React from "react";
import { useParams } from "next/navigation";
import { TournamentHeader } from "./components/TournamentHeader";
import { BracketSVG } from "./components/bracket/BracketSVG";
import { MatchSidebar } from "./components/MatchSidebar";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";
import { AuthModal } from "../../../../components/AuthModal";
import { TournamentBracketSkeleton } from "./components/TournamentBracketSkeleton";
import { useTournamentDetail } from "./hooks/useTournamentDetail";

export default function TournamentBracketPage() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery("(max-width: 1024px)");
  
  const {
    tournament,
    loading,
    userId,
    simulating,
    isGuest,
    showAuthModal,
    startError,
    setShowAuthModal,
    handleStart,
    handleSimulateWin,
    myMatch,
    myOpponent,
  } = useTournamentDetail(id);

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
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
      <div className="min-h-dvh bg-bg-primary flex items-center justify-center font-mono text-red-500/50 text-[11px] tracking-[0.2em] uppercase font-bold">
        [ERROR] Tournament not found
      </div>
    );
  }

  return (
    <>
      <div className="min-h-dvh bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
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
