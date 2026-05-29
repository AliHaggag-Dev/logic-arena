import React from "react";
import { Crown, Eye, Swords } from "lucide-react";
import { LeaderboardSkeleton } from "./LeaderboardSkeleton";
import { OnlineDot } from "./ui/OnlineDot";
import { YouBadge } from "./ui/YouBadge";
import { getRankColor } from "./utils";
import type { LeaderboardViewProps } from "./types";
import { UserLink } from "../../../../components/ui/UserLink";
import { AchievementBadge } from "../../profile/components/ui/AchievementBadge";

export function MobileList({
  users,
  isLoading,
  currentUserId,
  onChallenge,
  onSpectate,
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
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <OnlineDot isOnline={user.isOnline} />
                      <UserLink
                        username={user.username}
                        className="text-text-primary text-[15px] font-bold tracking-wider hover:text-accent transition-colors truncate max-w-[130px]"
                      />
                      {isSelf && <YouBadge />}
                    </div>
                    {user.achievements && user.achievements.some((ach) => ach.unlockedLevel > 0) && (
                      <div className="flex items-center -space-x-1 pl-3.5 mt-0.5">
                        {user.achievements
                          .filter((ach) => ach.unlockedLevel > 0)
                          .map((ach, idx) => (
                            <div
                              key={ach.achievementId}
                              style={{ zIndex: 10 - idx }}
                            >
                              <AchievementBadge
                                id={ach.achievementId}
                                level={ach.unlockedLevel}
                                size={14}
                                showTooltip={false}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-accent font-black text-base">
                  {user.rank} PTS
                </span>
              </div>

              {/* Action Bar */}
              <div className="w-full">
                {isSelf ? null : isGuest ? (
                  <button
                    type="button"
                    aria-label="Log in to challenge this player"
                    disabled
                    className="w-full h-[44px] flex items-center justify-center bg-transparent border border-accent/10 text-accent/20 font-bold tracking-[0.15em] text-[10px] rounded-lg cursor-not-allowed uppercase"
                  >
                    LOGIN TO CHALLENGE
                  </button>
                ) : user.inMatchId ? (
                  <button
                    type="button"
                    aria-label={`Watch ${user.username}'s live match`}
                    onClick={() => onSpectate(user.inMatchId!)}
                    className="w-full h-[44px] flex items-center justify-center gap-2 bg-transparent border border-violet-500/50 text-violet-300 font-bold tracking-[0.15em] text-[10px] rounded-lg transition-transform duration-150 active:scale-95 uppercase hover:bg-violet-900/20"
                  >
                    <Eye size={13} aria-hidden="true" />
                    WATCH LIVE
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
