import React from "react";
import { UserLink } from "../../../../components/ui/UserLink";
import { Lock, Clock, Hash, Gamepad2, ChevronRight } from "lucide-react";
import type { MatchMode } from "../../../../context/SocketContext";

export interface LobbyMatch {
  hostId: string;
  hostName: string;
  matchId: string;
  createdAt: number;
  mode?: MatchMode;
}

interface Props {
  match: LobbyMatch;
  index: number;
  onJoin: (match: LobbyMatch) => void;
  isGuest?: boolean;
  isMobile: boolean;
}

export const LobbyMatchCard = React.memo(function LobbyMatchCard({ match, index, onJoin, isGuest, isMobile }: Props) {

  const DesktopCard = (
    <div
      className="bg-white/[0.03] backdrop-blur-2xl p-6 rounded-[24px] border border-white/[0.08] flex justify-between items-center group transition-all duration-300 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] animate-[fadeIn_0.4s_ease_both] overflow-hidden relative"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex items-center gap-6">
        <div className="h-14 w-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shadow-inner">
          <span className="text-xl font-bold text-accent">{match.hostName.charAt(0).toUpperCase()}</span>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white mb-1">
            <UserLink
              username={match.hostName}
              className="hover:text-accent transition-colors"
            />
            <span className="text-white/40 font-normal ml-2 text-sm">/ HOST</span>
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium text-white/50">
            <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full border border-white/5">
              <Hash size={12} className="text-accent/70" />
              <span className="truncate max-w-[100px]">{match.matchId}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full border border-white/5">
              <Gamepad2 size={12} className="text-accent/70" />
              <span>{match.mode ?? "CLASSIC"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/40">
              <Clock size={12} />
              <span>{new Date(match.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Join match"
        onClick={() => onJoin(match)}
        disabled={isGuest}
        className="relative z-10 px-8 py-3.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-accent text-bg-primary hover:scale-105 hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)] flex items-center gap-2"
      >
        {isGuest ? (
          <>
            <Lock size={16} />
            <span>LOCKED</span>
          </>
        ) : (
          <>
            <span>JOIN MATCH</span>
            <ChevronRight size={16} className="opacity-70 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );

  const MobileCard = (
    <div
      className="bg-white/[0.04] backdrop-blur-2xl p-5 rounded-[28px] border border-white/[0.08] flex flex-col gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-[fadeIn_0.4s_ease_both] relative overflow-hidden"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 opacity-50" />
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="h-12 w-12 shrink-0 rounded-[18px] bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center shadow-inner">
          <span className="text-lg font-bold text-accent">{match.hostName.charAt(0).toUpperCase()}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-white truncate">
            <UserLink
              username={match.hostName}
              className="hover:text-accent transition-colors"
            />
          </h3>
          <p className="text-xs text-white/50 mt-0.5">Host Player</p>
        </div>
        
        <div className="shrink-0 flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-accent/80 bg-accent/10 px-2.5 py-1 rounded-full">
            <Gamepad2 size={10} />
            {match.mode ?? "CLASSIC"}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/40">
            <Clock size={10} />
            {new Date(match.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      
      <div className="relative z-10 w-full">
        <button
          type="button"
          aria-label="Join match"
          onClick={() => onJoin(match)}
          disabled={isGuest}
          className="w-full h-14 flex items-center justify-center gap-2 bg-accent text-bg-primary font-bold tracking-wide text-sm rounded-full transition-transform active:scale-[0.97] shadow-[0_8px_16px_rgba(var(--accent-rgb),0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGuest ? (
            <>
              <Lock size={16} />
              <span>LOGIN TO JOIN</span>
            </>
          ) : (
            <>
              <span>JOIN BATTLE</span>
              <ChevronRight size={18} className="opacity-70" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return isMobile ? MobileCard : DesktopCard;
});

