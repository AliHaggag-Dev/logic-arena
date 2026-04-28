import React from 'react';
import { LeaderboardSkeleton } from './LeaderboardSkeleton';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';

export interface LeaderboardUser {
  id: string;
  username: string;
  rank: number;
  isOnline: boolean;
  _count: {
    wonMatches: number;
  };
}

const getRankColor = (index: number) => {
  if (index === 0) return '#FFD700';
  if (index === 1) return '#C0C0C0';
  if (index === 2) return '#CD7F32';
  return 'var(--accent)';
};

/**
 * Derive a display efficiency score from rank points and wins.
 * Formula: (wins / max(rank, 1)) * 1000 — a rough proxy until
 * the server aggregates real per-match efficiency data.
 * TODO: aggregate from match replayData once server endpoint is updated.
 */
const deriveEfficiency = (user: LeaderboardUser): number => {
  const wins = user._count.wonMatches;
  const pts = Math.max(user.rank, 1);
  return Math.round((wins / pts) * 1000 * 10) / 10;
};

const EfficiencyBadge = ({ score }: { score: number }) => {
  const color =
    score >= 50 ? 'var(--accent)' :
      score >= 20 ? '#fb923c' :
        '#f87171';
  const label =
    score >= 50 ? 'OPTIMAL' :
      score >= 20 ? 'MODERATE' :
        'LOW';

  return (
    <div className="flex items-center gap-2 justify-end">
      <span
        className="text-xs font-black tracking-wider"
        style={{ color, textShadow: `0 0 8px ${color}66` }}
      >
        {score.toFixed(1)}
      </span>
      <span
        className="text-[9px] font-bold tracking-[0.15em] px-1.5 py-0.5 border rounded-sm"
        style={{ color, borderColor: `${color}44`, background: `${color}0d` }}
      >
        {label}
      </span>
    </div>
  );
};

export const LeaderboardTable = ({
  users,
  isLoading,
  currentUserId,
  onChallenge,
  isGuest,
}: {
  users: LeaderboardUser[];
  isLoading: boolean;
  currentUserId: string;
  onChallenge: (userId: string, username: string) => void;
  isGuest?: boolean;
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const DesktopTable = (
    <div className="bg-card/60 backdrop-blur-xl border border-accent/10 rounded-xl overflow-hidden" style={{ boxShadow: 'var(--card-shadow)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-accent/10 bg-accent/5">
              <th className="px-6 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[15%]">Rank</th>
              <th className="px-6 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[35%]">Player</th>
              <th className="px-6 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold w-[15%]">Points</th>
              <th className="px-6 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold">Victories</th>
              <th className="px-6 py-4 text-accent/80 uppercase tracking-widest text-xs font-bold text-right">
                ⚡ Efficiency
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LeaderboardSkeleton />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-text-secondary tracking-widest uppercase text-xs">
                  No player data available.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} className="border-b border-accent/10 hover:bg-accent/5 transition-colors group">
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)]" style={{ color: getRankColor(index) }}>
                        #{index + 1}
                      </span>
                      {index === 0 && <span className="text-xl transform rotate-12 drop-shadow-[0_0_10px_#FFD700]">👑</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${user.isOnline
                          ? 'bg-emerald-500 shadow-[0_0_6px_var(--color-emerald-500)]'
                          : 'bg-accent/15'
                          }`} />
                        <span className="text-text-primary text-base font-bold tracking-wider group-hover:text-text-primary transition-colors truncate max-w-[200px]">
                          {user.username}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle text-left">
                    <div className="flex items-center justify-start gap-2">
                      <span className="text-accent font-black text-base drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.3)]">{user.rank}</span>
                      <div className="h-1 w-20 bg-accent/10 rounded-full overflow-hidden hidden xl:block">
                        <div
                          className="h-full bg-accent shadow-[0_0_8px_var(--accent)]"
                          style={{ width: `${Math.min((user.rank / 1000) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]">
                      {user._count.wonMatches}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <EfficiencyBadge score={deriveEfficiency(user)} />
                      <div className="w-[100px] flex justify-end shrink-0">
                        {user.isOnline && user.id !== currentUserId && (
                          <button
                            type="button"
                            aria-label="Challenge user"
                            onClick={() => onChallenge(user.id, user.username)}
                            disabled={isGuest}
                            className={`text-[10px] tracking-[0.15em] px-3 py-1 rounded border transition-all whitespace-nowrap ${isGuest ? 'border-accent/10 bg-transparent text-accent/20 cursor-not-allowed' : 'border-accent/30 bg-accent/5 hover:bg-accent/15 text-accent/70 hover:text-accent'}`}
                          >
                            {isGuest ? "🔒 LOGIN TO CHALLENGE" : "⚔ CHALLENGE"}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const MobileList = (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="p-4"><LeaderboardSkeleton /></div>
      ) : users.length === 0 ? (
        <div className="px-6 py-12 text-center text-text-secondary tracking-widest uppercase text-xs border border-accent/10 rounded-xl bg-card">
          No combat data.
        </div>
      ) : (
        users.map((user, index) => (
          <div key={user.id} className="bg-card border border-accent/20 rounded-xl p-4 flex flex-col gap-4 relative" style={{ boxShadow: 'var(--card-shadow)' }}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="font-black text-xl" style={{ color: getRankColor(index) }}>
                  #{index + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-text-primary text-[15px] font-bold tracking-wider flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-500 shadow-[0_0_6px_var(--color-emerald-500)]' : 'bg-accent/15'}`} />
                    {user.username}
                  </span>
                </div>
              </div>
              <span className="text-accent font-black text-base">{user.rank} PTS</span>
            </div>
            {/* Action Bar */}
            <div className="w-full">
                {isGuest ? (
                   <button type="button" aria-label="Challenge user" disabled className="w-full h-[44px] flex items-center justify-center bg-transparent border border-accent/10 text-accent/20 font-bold tracking-[0.15em] text-[10px] rounded-lg cursor-not-allowed uppercase">
                    🔒 LOGIN TO CHALLENGE
                  </button>
                ) : user.isOnline && user.id !== currentUserId ? (
                  <button
                    type="button"
                    aria-label="Challenge user"
                    onClick={() => onChallenge(user.id, user.username)}
                    className="w-full h-[44px] flex items-center justify-center bg-transparent border border-accent text-accent font-bold tracking-[0.15em] text-[10px] rounded-lg transition-transform duration-150 active:scale-95 uppercase"
                  >
                    ⚔ CHALLENGE 
                  </button>
                ) : (
                  <button type="button" aria-label="Challenge user" disabled className="w-full h-[44px] flex items-center justify-center bg-transparent border border-accent/15 text-accent/30 font-bold tracking-[0.15em] text-[10px] rounded-lg cursor-not-allowed uppercase">
                    OFFLINE / UNAVAILABLE
                  </button>
                )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={isMobile ? "w-full" : ""}>
      {isMobile ? MobileList : DesktopTable}
    </div>
  );
};
