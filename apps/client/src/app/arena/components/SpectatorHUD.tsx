"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Eye, LogOut } from "lucide-react";
import { Socket } from "socket.io-client";

interface SpectatorHUDProps {
  spectatorCount: number;
  socket: Socket | null;
  matchId: string;
}

export function SpectatorHUD({
  spectatorCount,
  socket,
  matchId,
}: SpectatorHUDProps) {
  const router = useRouter();

  const handleExit = () => {
    if (socket?.connected) {
      socket.emit("leaveSpectate");
    }
    router.push("/leaderboard");
  };

  return (
    <>
      {/* Top-center: spectator count badge */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs font-black tracking-[0.2em] uppercase select-none pointer-events-none"
        style={{
          background: "rgba(var(--arena-spectator-bg-rgb),0.25)",
          border: "1px solid rgba(var(--arena-spectator-border-rgb),0.35)",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 0 24px rgba(var(--arena-spectator-glow-rgb),0.25), inset 0 0 12px rgba(var(--arena-spectator-bg-rgb),0.15)",
          color: "var(--arena-spectator-text)",
        }}
        aria-live="polite"
        aria-label={`${spectatorCount} spectator${spectatorCount !== 1 ? "s" : ""} watching`}
      >
        <Eye
          size={14}
          className="animate-pulse"
          aria-hidden="true"
        />
        <span>{spectatorCount} WATCHING</span>
        <span
          className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"
          aria-hidden="true"
        />
        <span className="text-violet-400/60">LIVE</span>
      </div>

      {/* Top-right: exit spectate button */}
      <div className="absolute top-4 right-4 z-40">
        <button
          type="button"
          aria-label="Exit spectator mode and return to leaderboard"
          onClick={handleExit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-black tracking-[0.15em] uppercase transition-all duration-200"
          style={{
            background: "rgba(var(--arena-black-rgb),0.8)",
            border: "1px solid rgba(var(--sem-danger-rgb),0.35)",
            backdropFilter: "blur(12px)",
            color: "rgba(var(--sem-danger-rgb),0.8)",
            boxShadow: "0 0 12px rgba(var(--sem-danger-rgb),0.1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(var(--arena-exit-hover-rgb),0.4)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(var(--sem-danger-rgb),0.7)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(var(--sem-danger-rgb),1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(var(--arena-black-rgb),0.8)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(var(--sem-danger-rgb),0.35)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(var(--sem-danger-rgb),0.8)";
          }}
        >
          <LogOut size={13} aria-hidden="true" />
          EXIT
        </button>
      </div>

      {/* Bottom-center: spectator watermark */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        aria-hidden="true"
      >
        <span
          className="font-mono text-[10px] tracking-[0.4em] uppercase font-black opacity-30"
          style={{ color: "var(--arena-spectator-text)" }}
        >
          ── SPECTATOR MODE ──
        </span>
      </div>
    </>
  );
}
