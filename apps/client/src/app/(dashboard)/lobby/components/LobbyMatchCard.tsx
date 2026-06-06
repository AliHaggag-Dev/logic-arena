import React, { useState } from "react";
import { useMediaQuery } from "../../../../hooks/useMediaQuery";
import { UserLink } from "../../../../components/ui/UserLink";
import { Lock } from "lucide-react";
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
}

export const LobbyMatchCard = React.memo(function LobbyMatchCard({ match, index, onJoin, isGuest }: Props) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const DesktopCard = (
    <div
      className="bg-card/55 backdrop-blur-md p-5 rounded-lg border border-accent/10 flex justify-between items-center group transition-all duration-300 hover:border-accent/40 hover:-translate-y-[2px] animate-[fadeIn_0.3s_ease_both]"
      style={{ boxShadow: 'var(--card-shadow)', animationDelay: `${index * 0.08}s` }}
    >
      <div>
        <h3 className="text-[14px] font-black tracking-[0.14em] text-accent transition-all group-hover:drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]">
          HOST:{" "}
          <UserLink
            username={match.hostName}
            className="hover:text-accent/80 transition-colors"
          />
        </h3>
        <p className="text-[10px] text-accent/70 tracking-[0.18em] uppercase mt-2">
          ID: {match.matchId} <span className="opacity-50 mx-2">|</span> DETECTED: {new Date(match.createdAt).toLocaleTimeString()}
          <span className="opacity-50 mx-2">|</span> MODE: {match.mode ?? "CLASSIC"}
        </p>
      </div>

      <button
        type="button"
        aria-label="Join match"
        onClick={() => onJoin(match)}
        disabled={isGuest}
        className="px-8 py-2.5 rounded-md text-[10px] font-black tracking-[0.18em] font-mono transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed bg-accent/5 border-accent/30 text-accent/70 hover:bg-accent/20 hover:border-accent/70 hover:text-accent hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.25)]"
      >
        {isGuest ? <span className="flex items-center gap-1.5 justify-center"><Lock size={12} /> LOCKED</span> : "JOIN"}
      </button>
    </div>
  );

  const MobileCard = (
    <div
      className="bg-card backdrop-blur-md px-4 pt-4 pb-0 rounded-xl border border-accent/15 flex flex-col gap-3 shadow-md animate-[fadeIn_0.3s_ease_both]"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-[14px] font-black tracking-[0.14em] text-accent">
          <UserLink
            username={match.hostName}
            className="hover:text-accent/80 transition-colors"
          />
        </h3>
        <div className="flex items-center gap-1 text-[9px] text-accent/70 tracking-[0.15em] uppercase w-full">
          <span>ID: </span>
          <span className="truncate flex-1 max-w-[80px]">{match.matchId}</span>
          <span className="opacity-50 mx-1">|</span> {new Date(match.createdAt).toLocaleTimeString()}
          <span className="opacity-50 mx-1">|</span> {match.mode ?? "CLASSIC"}
        </div>
      </div>
      <div className="w-full mt-1 border-t border-accent/10 pt-3 pb-3">
        <button
          type="button"
          aria-label="Join match"
          onClick={() => onJoin(match)}
          disabled={isGuest}
          className="w-full h-[44px] flex items-center justify-center bg-accent/10 border border-accent/40 text-accent font-black tracking-[0.2em] text-[10px] rounded-lg transition-transform active:scale-95 shadow-[0_0_8px_rgba(var(--accent-rgb),0.15)] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGuest ? <span className="flex items-center gap-1.5 justify-center"><Lock size={12} /> LOCKED</span> : "JOIN MATCH"}
        </button>
      </div>
    </div>
  );

  return isMobile ? MobileCard : DesktopCard;
});
