"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { apiClient, API_BASE_URL } from "../../../lib/api-client";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { useSocket } from "../../../context/SocketContext";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useAuthState } from "../../../hooks/useAuthState";
import type { LeaderboardUser } from "./types";
import { POLL_INTERVAL_MS } from "./types";
import { getAuthSession } from "../../../lib/client-security";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStatusUpdatePayload {
  userId: string;
  status: "idle" | "in-match";
  matchId?: string;
}

// ─── Page ────────────────────────────────────────────────────────────────────

const LeaderboardPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reactive auth state — correctly handles async session load after HttpOnly cookie auth
  const { isGuest } = useAuthState();
  const [currentUserId, setCurrentUserId] = useState(() => getAuthSession().userId ?? "");

  const { sendChallenge } = useSocket();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Dedicated socket for leaderboard presence (reuses existing WS connection)
  const socketRef = useRef<Socket | null>(null);

  // Apply a status update to a single user in the users list
  const applyStatusUpdate = useCallback(
    (payload: UserStatusUpdatePayload) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== payload.userId) return u;
          return {
            ...u,
            inMatchId:
              payload.status === "in-match" ? payload.matchId : undefined,
          };
        }),
      );
    },
    [],
  );

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await apiClient.get<LeaderboardUser[]>(
        "/users/leaderboard",
      );
      setUsers(response.data);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to leaderboard presence room over WebSocket
  useEffect(() => {
    const wsUrl = API_BASE_URL.replace("https://", "wss://")
      .replace("http://", "ws://")
      .replace(/\/api$/, "");

    const socket = io(wsUrl, { withCredentials: true, autoConnect: false });
    socketRef.current = socket;

    const handleSnapshot = (
      snapshot: Array<{ userId: string; matchId?: string }>,
    ) => {
      setUsers((prev) =>
        prev.map((u) => {
          const entry = snapshot.find((s) => s.userId === u.id);
          if (!entry) return u;
          return { ...u, inMatchId: entry.matchId };
        }),
      );
    };

    socket.on("connect", () => {
      socket.emit("joinLeaderboard");
    });

    socket.on("userStatusSnapshot", handleSnapshot);
    socket.on("userStatusUpdate", (payload: UserStatusUpdatePayload) => {
      applyStatusUpdate(payload);
    });

    socket.connect();

    return () => {
      socket.emit("leaveLeaderboard");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [applyStatusUpdate]);

  // Sync currentUserId reactively whenever the auth session changes
  useEffect(() => {
    const sync = () => setCurrentUserId(getAuthSession().userId ?? "");
    window.addEventListener("auth:changed", sync);
    return () => window.removeEventListener("auth:changed", sync);
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchLeaderboard();
      }
    }, POLL_INTERVAL_MS);

    const handleGlobalRefresh = () => fetchLeaderboard();
    window.addEventListener("global-refresh", handleGlobalRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("global-refresh", handleGlobalRefresh);
    };
  }, [fetchLeaderboard]);

  const handleSpectate = useCallback(
    (matchId: string) => {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("spectate", { matchId });
      }
      router.push(`/arena?matchId=${matchId}&spectate=true`);
    },
    [router],
  );

  return (
    <div
      className={`min-h-screen bg-bg-primary font-mono text-accent selection:bg-accent/30 relative overflow-hidden ${isMobile ? "pb-[calc(80px+env(safe-area-inset-bottom))]" : "pb-12"}`}
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
              onSpectate={handleSpectate}
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
              onSpectate={handleSpectate}
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
