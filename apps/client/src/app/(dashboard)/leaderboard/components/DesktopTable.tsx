import React from "react";
import { Crown } from "lucide-react";
import { LeaderboardSkeleton } from "./LeaderboardSkeleton";
import { OnlineDot } from "./ui/OnlineDot";
import { YouBadge } from "./ui/YouBadge";
import { EfficiencyBadge } from "./ui/EfficiencyBadge";
import { getRankColor, deriveEfficiency } from "./utils";
import type { LeaderboardViewProps } from "./types";
import { RANK_BAR_MAX } from "../types";

export function DesktopTable({
  users,
  isLoading,
  currentUserId,
  onChallenge,
  isGuest,
}: LeaderboardViewProps) {
  return (
    <div
      className="bg-card/60 backdrop-blur-xl border border-accent/10 rounded-xl overflow-hidden"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-accent/10 bg-accent/5">
              <th className="px-6 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[15%]">
                Rank
              </th>
              <th className="px-6 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[35%]">
                Player
              </th>
              <th className="px-6 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[15%]">
                Points
              </th>
              <th className="px-6 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold">
                Victories
              </th>
              <th className="px-6 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold text-right">
                Efficiency
              </th>
              <th className="px-6 py-4 w-[130px] pr-8">
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
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-black text-lg drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)]"
                          style={{ color: getRankColor(index) }}
                        >
                          #{index + 1}
                        </span>
                        {index === 0 && (
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <OnlineDot isOnline={user.isOnline} />
                        <span className="text-text-primary text-base font-bold tracking-wider group-hover:text-text-primary transition-colors truncate max-w-[200px]">
                          {user.username}
                        </span>
                        {isSelf && <YouBadge />}
                      </div>
                    </td>

                    {/* Points */}
                    <td className="px-6 py-4 align-middle">
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
                    <td className="px-6 py-4">
                      <span className="text-emerald-500 font-bold drop-shadow-[0_0_5px_rgba(var(--sem-success-rgb),0.3)]">
                        {user._count.wonMatches}
                      </span>
                    </td>

                    {/* Efficiency */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <EfficiencyBadge score={deriveEfficiency(user)} />
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4">
                      <div className="w-[130px] flex justify-end shrink-0 pr-2">
                        {isSelf ? null : isGuest ? (
                          <button
                            type="button"
                            aria-label="Log in to challenge this player"
                            disabled
                            className="text-[10px] tracking-[0.15em] px-3 py-1 rounded border border-accent/10 bg-transparent text-accent/20 cursor-not-allowed whitespace-nowrap"
                          >
                            LOGIN TO CHALLENGE
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
                          <span className="text-[10px] tracking-[0.15em] px-3 py-1 text-accent/25 whitespace-nowrap">
                            OFFLINE
                          </span>
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
