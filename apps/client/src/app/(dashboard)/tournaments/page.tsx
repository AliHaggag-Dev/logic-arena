"use client";

import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../../lib/api-client";
import { TournamentSkeleton } from "./components/TournamentSkeleton";
import { TournamentCard, Tournament } from "./components/TournamentCard";
import { CreateTournamentForm } from "./components/CreateTournamentForm";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { AuthModal } from "../../../components/AuthModal";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
    setIsGuest(!localStorage.getItem("token"));
  }, []);

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await apiClient.get("/tournaments");
      // FIX 13: deep-compare to avoid flicker on unchanged poll results
      setTournaments((prev) =>
        JSON.stringify(prev) === JSON.stringify(res.data) ? prev : res.data
      );
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        setIsGuest(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
    const interval = setInterval(fetchTournaments, 5000);
    return () => clearInterval(interval);
  }, [fetchTournaments]);

  const handleCreate = async (name: string) => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    setCreating(true);
    try {
      await apiClient.post("/tournaments/create", { name });
      setShowCreate(false);
      fetchTournaments();
    } catch {
      /* silent */
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (tournamentId: string) => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    setJoining(tournamentId);
    try {
      await apiClient.post(`/tournaments/${tournamentId}/join`);
      fetchTournaments();
    } catch {
      /* silent */
    } finally {
      setJoining(null);
    }
  };

  const handleCreateClick = () => {
    if (isGuest) {
      setShowAuthModal(true);
      return;
    }
    setShowCreate(true);
  };

  return (
    <>
      <div className="min-h-screen bg-bg-primary font-mono text-accent/90 relative overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className={`max-w-[1100px] mx-auto ${isMobile ? "px-4 pt-6" : "px-6 pt-12"} pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]`}>
          <div className={`border-b border-accent/10 ${isMobile ? "pb-6 mb-6" : "pb-9 mb-10"} flex justify-between items-end flex-wrap gap-5`}>
            <div>
              <p className="text-[10px] tracking-[0.4em] text-accent/30 mb-2.5 uppercase font-bold">
                // TOURNAMENTS_v2.1
              </p>
              <h1 className="m-0 text-[clamp(28px,5vw,48px)] font-black tracking-[0.22em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.9)] leading-none uppercase">
                TOURNAMENT
                <span className={`block ${isMobile ? "text-[0.45em]" : "text-[0.38em]"} text-accent/70 tracking-[0.35em] mt-1.5 drop-shadow-none`}>
                  _OPERATIONS
                </span>
              </h1>
            </div>

            {!showCreate && (
              <button
                type="button"
                title={isGuest ? "LOGIN REQUIRED" : "Create Tournament"}
                onMouseEnter={() => !isGuest && setHoveredBtn("create")}
                onMouseLeave={() => setHoveredBtn(null)}
                onClick={handleCreateClick}
                disabled={isGuest}
                className={`px-7 py-3 rounded-md text-[10px] font-black tracking-[0.25em] font-mono transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? "w-full" : ""} ${isGuest
                  ? "bg-accent/10 border border-accent/30 text-accent/70 opacity-60 cursor-not-allowed"
                  : hoveredBtn === "create"
                    ? "bg-accent/20 border border-accent/70 text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)] cursor-pointer"
                    : "bg-accent/10 border border-accent/30 text-accent/70 cursor-pointer"
                  }`}
              >
                {isGuest ? "LOGIN TO DEPLOY" : "[+] CREATE TOURNAMENT"}
              </button>
            )}
          </div>

          {showCreate && !isGuest && (
            <CreateTournamentForm
              onClose={() => setShowCreate(false)}
              onCreate={handleCreate}
              creating={creating}
              isMobile={isMobile}
            />
          )}

          <div className={`flex gap-2 mb-7 flex-wrap ${isMobile ? "justify-center" : ""}`}>
            {[
              { label: "TOTAL", value: tournaments.length },
              { label: "LIVE", value: tournaments.filter((t) => t.status === "IN_PROGRESS").length },
              { label: "QUEUE", value: tournaments.filter((t) => t.status === "WAITING").length },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="px-3 py-1.5 border border-accent/10 rounded-lg bg-accent/5 text-[9px] tracking-[0.18em] text-accent/70 flex gap-2 items-center backdrop-blur-sm"
              >
                <span className="text-accent/20 font-bold">{label}:</span>
                <span className="text-accent font-black">{value}</span>
              </div>
            ))}
          </div>

          {loading ? (
            <TournamentSkeleton />
          ) : tournaments.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-accent/20 rounded-2xl bg-accent/[0.02] backdrop-blur-sm">
              <div className="text-accent/30 mb-4 font-mono text-[10px] tracking-[0.3em]">NO TOURNAMENTS YET</div>
              <h3 className="text-accent font-black tracking-widest text-lg mb-2 uppercase font-sans">AWAITING TOURNAMENTS</h3>
              <p className="text-accent/40 text-[10px] tracking-[0.15em] max-w-[440px] mx-auto uppercase leading-relaxed px-6">
                No tournaments running. Start a new tournament to challenge players.
              </p>
            </div>
          ) : (
            <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5"}`}>
              {tournaments.map((t, idx) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  index={idx}
                  userId={userId}
                  joining={joining}
                  onJoin={handleJoin}
                  isMobile={isMobile}
                  isGuest={isGuest}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="GUEST ACCESS DETECTED"
        message="You must initialize a user account to create or join tournament brackets. Register now to compete in the arena."
      />
    </>
  );
}