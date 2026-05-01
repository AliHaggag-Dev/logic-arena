import React from "react";
import { Crown, Swords } from "lucide-react";
import { LeaderboardSkeleton } from "./LeaderboardSkeleton";
import { OnlineDot } from "./ui/OnlineDot";
import { YouBadge } from "./ui/YouBadge";
import { getRankColor } from "./utils";
import type { LeaderboardViewProps } from "./types";

export function MobileList({
  users,
  isLoading,
  currentUserId,
  onChallenge,
  isGuest,
}: LeaderboardViewProps) {
  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <LeaderboardSkeleton variant="card" />
      ) : users.length === 0 ? (
        <div className="px-6 py-12 text-center text-text-secondary tracking-widest uppercase text-xs border border-accent/10 rounded-xl bg-card">
          No combat data yet. Be the first to compete.
        </div>
      ) : (
        users.map((user, index) => {
          const isSelf = user.id === currentUserId;
          return (
            <div
              key={user.id}
              className={`border rounded-xl p-4 flex flex-col gap-4 relative ${
                isSelf
                  ? "bg-accent/10 border-accent/40"
                  : "bg-card border-accent/20"
              }`}
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span
                    className="font-black text-xl"
                    style={{ color: getRankColor(index) }}
                  >
                    #{index + 1}
                  </span>
                  {index === 0 && (
                    <Crown
                      size={14}
                      style={{ color: "var(--rank-gold)" }}
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="text-text-primary text-[15px] font-bold tracking-wider flex items-center gap-2 flex-wrap">
                      <OnlineDot isOnline={user.isOnline} />
                      {user.username}
                      {isSelf && <YouBadge />}
                    </span>
                  </div>
                </div>
                <span className="text-accent font-black text-base">
                  {user.rank} PTS
                </span>
              </div>

              {/* Action Bar */}
              <div className="w-full">
                {isSelf ? (
                  <div className="w-full h-[44px] flex items-center justify-center text-accent/30 font-bold tracking-[0.15em] text-[10px] uppercase">
                    YOUR POSITION
                  </div>
                ) : isGuest ? (
                  <button
                    type="button"
                    aria-label="Log in to challenge this player"
                    disabled
                    className="w-full h-[44px] flex items-center justify-center bg-transparent border border-accent/10 text-accent/20 font-bold tracking-[0.15em] text-[10px] rounded-lg cursor-not-allowed uppercase"
                  >
                    LOGIN TO CHALLENGE
                  </button>
                ) : user.isOnline ? (
                  <button
                    type="button"
                    aria-label={`Challenge ${user.username}`}
                    onClick={() => onChallenge(user.id)}
                    className="w-full h-[44px] flex items-center justify-center gap-2 bg-transparent border border-accent text-accent font-bold tracking-[0.15em] text-[10px] rounded-lg transition-transform duration-150 active:scale-95 uppercase"
                  >
                    <Swords size={13} aria-hidden="true" />
                    CHALLENGE
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Player is offline"
                    disabled
                    className="w-full h-[44px] flex items-center justify-center bg-transparent border border-accent/15 text-accent/30 font-bold tracking-[0.15em] text-[10px] rounded-lg cursor-not-allowed uppercase"
                  >
                    OFFLINE / UNAVAILABLE
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
