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
  globalRankOffset,
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
                    style={{ color: getRankColor(globalRankOffset + index) }}
                  >
                    #{globalRankOffset + index + 1}
                  </span>
                  {globalRankOffset === 0 && index === 0 && (
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
                    {user.achievements && user.achievements.some((ach) => ach.unlockedLevel > 0) && (() => {
                      const unlocked = user.achievements.filter((ach) => ach.unlockedLevel > 0);
                      const firstAch = unlocked[0];
                      const remainingCount = unlocked.length - 1;

                      return (
                        <div tabIndex={0} className="relative group/badges-stack shrink-0 outline-none ml-2 mt-1">
                          {/* Single Badge & +N Pill Trigger */}
                          <div className="flex items-center gap-1.5 select-none">
                            <AchievementBadge
                              id={firstAch.achievementId}
                              level={firstAch.unlockedLevel}
                              size={20}
                              showTooltip={false}
                            />
                            {remainingCount > 0 && (
                              <span className="text-[9px] font-black font-mono px-1 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent/80 transition-colors duration-200 group-hover/badges-stack:bg-accent/20 group-hover/badges-stack:text-accent">
                                +{remainingCount}
                              </span>
                            )}
                          </div>

                          {/* Unified Premium Tooltip Card */}
                          <div className={`absolute ${globalRankOffset + index < 3 ? "top-full mt-2" : "bottom-full mb-2"} left-0 scale-0 group-hover/badges-stack:scale-100 group-focus/badges-stack:scale-100 transition-all duration-200 bg-card/95 border border-accent/20 rounded-lg pt-3.5 pb-2.5 px-3 z-[100] pointer-events-none shadow-lg min-w-[170px] backdrop-blur-md`}>
                            <div className="text-[10px] font-black text-accent tracking-widest border-b border-accent/15 pb-1.5 mb-1.5 uppercase font-mono">
                              Player Badges
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {unlocked.map((ach) => {
                                const label = ['LOCKED', 'ALPHA', 'BETA', 'GAMMA', 'DELTA'][ach.unlockedLevel];
                                const color = [
                                  'var(--text-primary)/20',
                                  'var(--docs-cyan)',
                                  'var(--docs-purple)',
                                  'var(--docs-orange)',
                                  'var(--docs-yellow)',
                                ][ach.unlockedLevel];
                                const name = ach.achievementId.replace('_', ' ').toUpperCase();
                                return (
                                  <div key={ach.achievementId} className="flex items-center gap-2 text-[9px] font-bold font-mono">
                                    <span style={{ color }} className="text-[11px] leading-none">●</span>
                                    <span className="text-text-primary">{name}:</span>
                                    <span style={{ color }} className="ml-auto">{label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
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
