"use client";

import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../../lib/api-client";
import { TournamentSkeleton } from "./components/TournamentSkeleton";
import { TournamentCard, Tournament } from "./components/TournamentCard";
import { CreateTournamentForm } from "./components/CreateTournamentForm";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await apiClient.get("/tournaments");
      setTournaments(res.data);
    } catch {
      /* silent */
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

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
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

        <div className="max-w-[1100px] mx-auto px-6 pt-12 pb-[100px] relative z-10 animate-[fadeIn_0.35s_ease]">
          {/* HERO */}
          <div className="border-b border-accent/10 pb-9 mb-10 flex justify-between items-end flex-wrap gap-5">
            <div>
              <p className="text-[10px] tracking-[0.4em] text-accent/30 mb-2.5 uppercase">
                // BRACKET_SYSTEM_v1.0
              </p>
              <h1 className="m-0 text-[clamp(28px,5vw,48px)] font-black tracking-[0.22em] text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.9)] leading-none">
                TOURNAMENT
                <span className="block text-[0.38em] text-accent/40 tracking-[0.35em] mt-1.5 drop-shadow-none">
                  _HUB
                </span>
              </h1>
            </div>

            {/* CREATE button */}
            {!showCreate && (
              <button
                onMouseEnter={() => setHoveredBtn("create")}
                onMouseLeave={() => setHoveredBtn(null)}
                onClick={() => setShowCreate(true)}
                className={`px-7 py-3 rounded-lg text-[10px] font-black tracking-[0.28em] font-mono cursor-pointer transition-all duration-200 border ${hoveredBtn === "create"
                    ? "bg-accent/20 border-accent/70 text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.6)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)]"
                    : "bg-accent/10 border-accent/30 text-accent/70"
                  }`}
              >
                [+] DEPLOY TOURNAMENT
              </button>
            )}
          </div>

          {/* CREATE FORM */}
          {showCreate && (
            <CreateTournamentForm
              onClose={() => setShowCreate(false)}
              onCreate={handleCreate}
              creating={creating}
            />
          )}

          {/* STATUS BADGES ROW */}
          <div className="flex gap-3 mb-7 flex-wrap">
            {[
              { label: "TOTAL", value: tournaments.length },
              { label: "ACTIVE", value: tournaments.filter((t) => t.status === "IN_PROGRESS").length },
              { label: "WAITING", value: tournaments.filter((t) => t.status === "WAITING").length },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="px-4 py-1.5 border border-accent/15 rounded bg-accent/5 text-[10px] tracking-[0.18em] text-accent/45 flex gap-2 items-center"
              >
                <span className="text-accent/25">{label}:</span>
                <span className="text-accent font-bold">{value}</span>
              </div>
            ))}
          </div>

          {/* TOURNAMENT GRID */}
          {loading ? (
            <TournamentSkeleton />
          ) : tournaments.length === 0 ? (
            <div className="text-center p-[80px_24px] text-accent/20 text-[11px] tracking-[0.18em] border border-dashed border-accent/10 rounded-xl bg-card/30 backdrop-blur-md">
              NO TOURNAMENTS DETECTED. DEPLOY A NEW TOURNAMENT TO BEGIN.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
              {tournaments.map((t, idx) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  index={idx}
                  userId={userId}
                  joining={joining}
                  onJoin={handleJoin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
