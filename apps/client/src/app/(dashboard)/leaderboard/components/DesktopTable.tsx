import React from "react";
import { Crown, Eye } from "lucide-react";
import { LeaderboardSkeleton } from "./LeaderboardSkeleton";
import { OnlineDot } from "./ui/OnlineDot";
import { YouBadge } from "./ui/YouBadge";
import { EfficiencyBadge } from "./ui/EfficiencyBadge";
import { getRankColor, deriveEfficiency } from "./utils";
import type { LeaderboardViewProps } from "./types";
import { RANK_BAR_MAX } from "../types";
import { UserLink } from "../../../../components/ui/UserLink";
import { AchievementBadge } from "../../profile/components/ui/AchievementBadge";

export function DesktopTable({
  users,
  isLoading,
  currentUserId,
  onChallenge,
  onSpectate,
  isGuest,
  globalRankOffset,
}: LeaderboardViewProps) {
  return (
    <div
      className="bg-card/60 backdrop-blur-xl border border-accent/10 rounded-xl overflow-hidden"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="border-b border-accent/10 bg-accent/5">
              <th className="px-4 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[8%]">
                Rank
              </th>
              <th className="px-4 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[22%]">
                Player
              </th>
              <th className="px-4 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[20%]">
                Points
              </th>
              <th className="px-4 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[15%]">
                Victories
              </th>
              <th className="px-4 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[15%] text-right">
                Efficiency
              </th>
              <th className="px-4 py-4 w-[20%] pr-8">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LeaderboardSkeleton variant="table" />
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-text-secondary tracking-widest uppercase text-xs"
                >
                  No combat data yet. Be the first to compete.
                </td>
              </tr>
            ) : (
              users.map((user, index) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr
                    key={user.id}
                    className={`border-b border-accent/10 transition-colors group ${
                      isSelf
                        ? "bg-accent/10 border-l-2 border-l-accent"
                        : "hover:bg-accent/5"
                    }`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-black text-lg drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)]"
                          style={{ color: getRankColor(globalRankOffset + index) }}
                        >
                          #{globalRankOffset + index + 1}
                        </span>
                        {globalRankOffset === 0 && index === 0 && (
                          <Crown
                            size={16}
                            style={{ color: "var(--rank-gold)" }}
                            className="drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </td>

                    {/* Player */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <OnlineDot isOnline={user.isOnline} />
                        <UserLink
                          username={user.username}
                          title={user.username}
                          className="text-text-primary text-base font-bold tracking-wider group-hover:text-accent transition-colors truncate max-w-[80px] lg:max-w-[120px]"
                        />
                        {isSelf && <YouBadge />}

                        {/* Badges Stack */}
                        {user.achievements && user.achievements.some((ach) => ach.unlockedLevel > 0) && (() => {
                          const unlocked = user.achievements.filter((ach) => ach.unlockedLevel > 0);
                          const firstAch = unlocked[0];
                          const remainingCount = unlocked.length - 1;

                          return (
                            <div tabIndex={0} className="relative group/badges-stack shrink-0 outline-none">
                              {/* Single Badge & +N Pill Trigger */}
                              <div className="flex items-center gap-1.5 select-none">
                                <AchievementBadge
                                  id={firstAch.achievementId}
                                  level={firstAch.unlockedLevel}
                                  size={16}
                                  showTooltip={false}
                                />
                                {remainingCount > 0 && (
                                  <span className="text-[9px] font-black font-mono px-1 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent/80 transition-colors duration-200 group-hover/badges-stack:bg-accent/20 group-hover/badges-stack:text-accent">
                                    +{remainingCount}
                                  </span>
                                )}
                              </div>

                              {/* Unified Premium Tooltip Card */}
                              <div className={`absolute ${globalRankOffset + index < 3 ? "top-full mt-2" : "bottom-full mb-2"} left-1/2 -translate-x-1/2 scale-0 group-hover/badges-stack:scale-100 group-focus/badges-stack:scale-100 transition-all duration-200 bg-card/95 border border-accent/20 rounded-lg pt-3.5 pb-2.5 px-3 z-[100] pointer-events-none shadow-lg min-w-[170px] backdrop-blur-md`}>
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
                    </td>

                    {/* Points */}
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center justify-start gap-2">
                        <span className="text-accent font-black text-base drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.3)]">
                          {user.rank}
                        </span>
                        <div className="h-1 w-20 bg-accent/10 rounded-full overflow-hidden hidden xl:block">
                          <div
                            className="h-full bg-accent shadow-[0_0_8px_var(--accent)]"
                            style={{
                              width: `${Math.min(
                                (user.rank / RANK_BAR_MAX) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Victories */}
                    <td className="px-4 py-4">
                      <span className="text-emerald-500 font-bold drop-shadow-[0_0_5px_rgba(var(--sem-success-rgb),0.3)]">
                        {user._count.wonMatches}
                      </span>
                    </td>

                    {/* Efficiency */}
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <EfficiencyBadge score={deriveEfficiency(user)} />
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4">
                      <div className="w-full flex justify-end pr-4">
                        {isSelf ? null : isGuest ? (
                          <button
                            type="button"
                            aria-label="Log in to challenge this player"
                            disabled
                            className="text-[10px] tracking-[0.15em] px-3 py-1 rounded border border-accent/10 bg-transparent text-accent/50 cursor-not-allowed whitespace-nowrap"
                          >
                            LOGIN TO CHALLENGE
                          </button>
                        ) : user.inMatchId ? (
                          <button
                            type="button"
                            aria-label={`Watch ${user.username}'s live match`}
                            onClick={() => onSpectate(user.inMatchId!)}
                            className="text-[10px] tracking-[0.15em] px-3 py-1 rounded border border-violet-500/50 bg-violet-900/20 hover:bg-violet-500/25 text-violet-300 hover:text-violet-100 transition-all whitespace-nowrap flex items-center gap-1"
                          >
                            <Eye size={12} aria-hidden="true" /> WATCH
                          </button>
                        ) : user.isOnline ? (
                          <button
                            type="button"
                            aria-label={`Challenge ${user.username}`}
                            onClick={() => onChallenge(user.id)}
                            className="text-[10px] tracking-[0.15em] px-3 py-1 rounded border border-accent/30 bg-accent/5 hover:bg-accent/15 text-accent/70 hover:text-accent transition-all whitespace-nowrap"
                          >
                            CHALLENGE
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label="Player is offline"
                            disabled
                            className="text-[10px] tracking-[0.15em] px-3 py-1 text-accent/50 whitespace-nowrap cursor-not-allowed"
                          >
                            OFFLINE
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
