"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { PaginationControls } from "./components/ui/PaginationControls";
import { useSocket } from "../../../context/SocketContext";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useAuthState } from "../../../hooks/useAuthState";
import { useGlobalSocket } from "../../../hooks/useGlobalSocket";
import { useVisibilityPause } from "../../../hooks/useVisibilityPause";
import type { UserStatusSnapshotEntry, UserStatusUpdatePayload } from "../../../hooks/useGlobalSocket";
import type { LeaderboardUser, LeaderboardPageResponse } from "./types";
import { POLL_INTERVAL_MS, DEFAULT_PAGE_LIMIT } from "./types";

// ─── Page ────────────────────────────────────────────────────────────────────

const LeaderboardPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const currentPageRef = useRef(currentPage);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Reactive auth state — correctly handles async session load after HttpOnly cookie auth
  const { isGuest, userId } = useAuthState();
  const currentUserId = userId ?? "";

  const { sendChallenge } = useSocket();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Apply a single user's status change in-place.
  const applyStatusUpdate = useCallback(
    (payload: UserStatusUpdatePayload) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== payload.userId) return u;
          const isOnline = payload.isOnline ?? true;
          return {
            ...u,
            isOnline,
            inMatchId:
              isOnline && payload.status === "in-match"
                ? payload.matchId
                : undefined,
          };
        }),
      );
    },
    [],
  );

  // O(n) snapshot apply via Map lookup instead of nested Array.find.
  const applySnapshot = useCallback(
    (snapshot: UserStatusSnapshotEntry[]) => {
      const byId = new Map(snapshot.map((s) => [s.userId, s]));
      setUsers((prev) =>
        prev.map((u) => {
          const entry = byId.get(u.id);
          if (!entry) return u;
          return {
            ...u,
            isOnline: entry.isOnline,
            inMatchId: entry.matchId,
          };
        }),
      );
    },
    [],
  );

  const socketHandlers = useMemo(() => ({
    onUserStatusSnapshot: applySnapshot,
    onUserStatusUpdate: applyStatusUpdate,
  }), [applySnapshot, applyStatusUpdate]);

  const { joinLeaderboard, leaveLeaderboard, emitSpectate } = useGlobalSocket(socketHandlers);

  // Join the leaderboard presence room on mount, leave on unmount
  useEffect(() => {
    joinLeaderboard();
    return () => {
      leaveLeaderboard();
    };
  }, [joinLeaderboard, leaveLeaderboard]);

  const fetchLeaderboard = useCallback(async (page: number) => {
    try {
      const response = await apiClient.get<LeaderboardPageResponse>(
        "/users/leaderboard",
        { params: { page, limit: DEFAULT_PAGE_LIMIT } },
      );
      setUsers(response.data.data);
      setTotalPages(response.data.totalPages);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling: always resets to page 1 to avoid stale page state.
  const pollFetch = useCallback(() => {
    setCurrentPage(1);
    currentPageRef.current = 1;
    void fetchLeaderboard(1);
  }, [fetchLeaderboard]);

  useVisibilityPause(pollFetch, POLL_INTERVAL_MS);

  // On manual page change: fetch new page without resetting.
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      setIsLoading(true);
      void fetchLeaderboard(page);
    },
    [fetchLeaderboard],
  );

  // Listen for global refresh events (e.g. from challenge completion)
  useEffect(() => {
    const handleGlobalRefresh = () => {
      setCurrentPage(1);
      currentPageRef.current = 1;
      void fetchLeaderboard(1);
    };
    window.addEventListener("global-refresh", handleGlobalRefresh);
    return () => {
      window.removeEventListener("global-refresh", handleGlobalRefresh);
    };
  }, [fetchLeaderboard]);

  const handleSpectate = useCallback(
    (matchId: string) => {
      emitSpectate(matchId);
      router.push(`/arena?matchId=${matchId}&spectate=true`);
    },
    [router, emitSpectate],
  );

  // Zero-based offset so child tables can display the correct global rank number.
  const globalRankOffset = (currentPage - 1) * DEFAULT_PAGE_LIMIT;

  return (
    <div
      className={`min-h-dvh bg-bg-primary font-mono text-accent selection:bg-accent/30 relative overflow-hidden ${isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : "pb-12"}`}
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
            <>
              <LeaderboardTable
                users={users}
                isLoading={isLoading}
                currentUserId={currentUserId}
                onChallenge={(id) => sendChallenge(id, 'leaderboard')}
                onSpectate={handleSpectate}
                isGuest={isGuest}
                isMobile={true}
                globalRankOffset={globalRankOffset}
              />
              <PaginationControls
                page={currentPage}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={handlePageChange}
              />
            </>
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
            <>
              <LeaderboardTable
                users={users}
                isLoading={isLoading}
                currentUserId={currentUserId}
                onChallenge={(id) => sendChallenge(id, 'leaderboard')}
                onSpectate={handleSpectate}
                isGuest={isGuest}
                isMobile={false}
                globalRankOffset={globalRankOffset}
              />
              <PaginationControls
                page={currentPage}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={handlePageChange}
              />
            </>
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
