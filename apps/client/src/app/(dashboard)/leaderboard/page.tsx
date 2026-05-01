"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../../lib/api-client";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { useSocket } from "../../../context/SocketContext";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import type { LeaderboardUser } from "./types";
import { POLL_INTERVAL_MS } from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extract the `sub` claim from a JWT without verifying its signature.
 *  Used only to derive currentUserId for UI highlighting — not for auth. */
const parseJwtSub = (token: string): string => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.sub === "string" ? payload.sub : "";
  } catch {
    return "";
  }
};

// ─── Page ────────────────────────────────────────────────────────────────────

const LeaderboardPage = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isGuest, setIsGuest] = useState(false);

  const { sendChallenge } = useSocket();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await apiClient.get<LeaderboardUser[]>("/users/leaderboard");
      setUsers(response.data);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("jwtToken");
    setIsGuest(!token);
    setCurrentUserId(token ? parseJwtSub(token) : "");

    fetchLeaderboard();

    const interval = setInterval(() => {
      // Only poll when the tab is visible — saves battery and server load
      if (document.visibilityState === "visible") {
        fetchLeaderboard();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return (
    <div
      className={`min-h-screen bg-bg-primary font-mono text-accent selection:bg-accent/30 relative overflow-hidden ${
        isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : "pb-12"
      }`}
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(var(--accent-rgb),0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {isMobile ? (
        /* ── Mobile Layout ───────────────────────────────── */
        <div className="w-full px-4 pt-4 pb-[env(safe-area-inset-bottom)] relative z-20">
          <div className="mb-6 border-b border-accent/20 pb-4">
            <h1 className="text-accent font-black text-xl tracking-[0.15em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]">
              LEADERBOARD
            </h1>
            <p className="text-accent/60 text-[10px] tracking-widest uppercase mt-2">
              Global Player Rankings
            </p>
          </div>

          {hasError ? (
            <div className="px-6 py-10 text-center text-text-secondary tracking-widest uppercase text-xs border border-accent/10 rounded-xl bg-card">
              Failed to load rankings. Check your connection.
            </div>
          ) : (
            <LeaderboardTable
              users={users}
              isLoading={isLoading}
              currentUserId={currentUserId}
              onChallenge={sendChallenge}
              isGuest={isGuest}
              isMobile={true}
            />
          )}
        </div>
      ) : (
        /* ── Desktop Layout ──────────────────────────────── */
        <div className="max-w-5xl mx-auto pt-16 px-6 relative z-20">
          <div className="mb-8 border-b border-accent/20 pb-6">
            <h1 className="text-accent font-black text-4xl tracking-[0.15em] drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]">
              LEADERBOARD
            </h1>
            <p className="text-accent/60 text-xs tracking-widest uppercase mt-2">
              Global Player Rankings
            </p>
          </div>

          {hasError ? (
            <div className="px-6 py-12 text-center text-text-secondary tracking-widest uppercase text-xs border border-accent/10 rounded-xl bg-card/60">
              Failed to load rankings. Check your connection and try refreshing.
            </div>
          ) : (
            <LeaderboardTable
              users={users}
              isLoading={isLoading}
              currentUserId={currentUserId}
              onChallenge={sendChallenge}
              isGuest={isGuest}
              isMobile={false}
            />
          )}

          {/* Footer Decoration */}
          <div className="mt-8 flex justify-center opacity-30">
            <div className="flex gap-4 items-center">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-accent" />
              <div className="w-2 h-2 border border-accent rotate-45 animate-pulse" />
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-accent" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
