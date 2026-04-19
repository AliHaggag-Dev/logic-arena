'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';

interface WinnerScreenProps {
  matchResult: {
    winner: { id: string; color: string } | null;
    draw: boolean;
    efficiencyScores: Record<string, number>;
  };
  currentUserId: string | null;
  socket: Socket;
  matchId: string;
}

const WinnerScreen: React.FC<WinnerScreenProps> = ({
  matchResult, currentUserId, socket, matchId,
}) => {
  const router = useRouter();
  const { winner, draw, efficiencyScores } = matchResult;
  const [username, setUsername] = useState<string>('OPERATOR');

  useEffect(() => {
    const stored = localStorage.getItem('username');
    if (stored) setUsername(stored);
  }, []);

  const isWinner = winner?.id === currentUserId;
  const title = draw ? 'DRAW' : isWinner ? 'VICTORY' : 'DEFEATED';

  const titleColor = draw
    ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]'
    : isWinner
      ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]'
      : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]';

  const orbGlow = draw
    ? 'shadow-[0_0_50px_rgba(250,204,21,0.6)] border-yellow-400/50'
    : isWinner
      ? 'shadow-[0_0_50px_rgba(34,211,238,0.6)] border-cyan-400/50'
      : 'shadow-[0_0_50px_rgba(239,68,68,0.6)] border-red-500/50';

  // Efficiency score for the current player
  const myScore = currentUserId ? (efficiencyScores?.[currentUserId] ?? null) : null;
  const scoreColor =
    myScore === null ? 'text-white/40' :
      myScore >= 50 ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' :
        myScore >= 20 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
          'text-red-400  drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]';

  const handleRematch = () => {
    socket.emit('resetGame', { matchId });
    window.location.reload();
  };

  const handleReturnToLobby = () => router.push('/lobby');

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden animate-in fade-in duration-700">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '100px 100px' }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,var(--accent)_1px,transparent_1px),linear-gradient(to_bottom,var(--accent)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] [transform-origin:top]" />
      </div>

      <div className="relative z-20 flex flex-col items-center max-w-2xl w-full px-4">
        {/* Status subtitle */}
        <div className="mb-2 text-[10px] tracking-[0.5em] text-white/40 uppercase font-black">
          {draw ? 'MATCH_TERMINATED' : isWinner ? 'NEURAL_DOMINANCE_ACHIEVED' : `OPERATOR_${username}_ELIMINATED`}
        </div>

        {/* Main title */}
        <div className="relative mb-8">
          <h1 className={`text-8xl md:text-9xl font-black tracking-tighter ${titleColor} ${!isWinner && !draw ? 'animate-glitch' : 'animate-pulse'}`}>
            {title}
          </h1>
          <h1 className={`absolute inset-0 text-8xl md:text-9xl font-black tracking-tighter opacity-50 blur-sm ${titleColor}`}>
            {title}
          </h1>
        </div>

        {/* Pulsing orb */}
        {!draw && winner && (
          <div className="relative mb-8">
            <div className={`absolute inset-0 -m-8 rounded-full border border-dashed animate-[spin_10s_linear_infinite] opacity-20 ${isWinner ? 'border-cyan-400' : 'border-red-500'}`} />
            <div className={`absolute inset-0 -m-4 rounded-full border animate-[spin_15s_linear_infinite_reverse] opacity-40 ${isWinner ? 'border-cyan-400' : 'border-red-500'}`} />
            <div
              className={`w-32 h-32 rounded-full border-2 animate-pulse flex items-center justify-center ${orbGlow}`}
              style={{ backgroundColor: `${winner.color}33` }}
            >
              <div className="w-16 h-16 rounded-full shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]" style={{ backgroundColor: winner.color }} />
            </div>
          </div>
        )}

        {/* ── Efficiency Score card ─────────────────────────────── */}
        <div className="mb-8 w-full max-w-sm border border-cyan-900/40 bg-cyan-950/10 backdrop-blur-sm p-4 rounded-sm">
          <div className="text-[10px] tracking-[0.4em] text-cyan-700 uppercase font-black mb-2 text-center">
            ⚡ EFFICIENCY_SCORE
          </div>
          {myScore !== null ? (
            <>
              <div className={`text-5xl font-black text-center tracking-tight ${scoreColor}`}>
                {myScore.toFixed(1)}
              </div>
              <div className="text-[9px] text-white/20 tracking-widest text-center mt-1 uppercase">
                damage_dealt / energy_consumed × 100
              </div>
              {/* Score bar */}
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${myScore >= 50 ? 'bg-cyan-400 shadow-[0_0_6px_var(--accent)]' :
                    myScore >= 20 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                  style={{ width: `${Math.min(myScore, 100)}%` }}
                />
              </div>
              <div className="mt-2 text-[9px] text-white/20 text-center tracking-widest">
                {myScore >= 50 ? 'OPTIMAL ALGORITHM' : myScore >= 20 ? 'MODERATE EFFICIENCY' : 'INEFFICIENT SCRIPT — REFACTOR RECOMMENDED'}
              </div>
            </>
          ) : (
            <div className="text-white/30 text-center text-xs tracking-widest">N/A</div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-6 w-72">
          <button onClick={handleRematch} className="group relative px-8 py-4 bg-transparent transition-all overflow-hidden">
            <div className="absolute inset-0 border border-cyan-500/50 group-hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all" />
            <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-all" />
            <span className="relative z-10 text-cyan-400 font-black tracking-[0.3em] text-sm group-hover:text-cyan-300">REINIT_SESSION</span>
          </button>
          <button onClick={handleReturnToLobby} className="group relative px-8 py-4 bg-transparent transition-all overflow-hidden">
            <div className="absolute inset-0 border border-white/10 group-hover:border-white/20 transition-all" />
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-all" />
            <span className="relative z-10 text-white/40 font-black tracking-[0.3em] text-sm group-hover:text-white/60">ABORT_TO_LOBBY</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes glitch {
          0%   { transform: translate(0); }
          20%  { transform: translate(-2px, 2px); }
          40%  { transform: translate(-2px, -2px); }
          60%  { transform: translate(2px, 2px); }
          80%  { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        .animate-glitch { animation: glitch 0.3s cubic-bezier(.25,.46,.45,.94) both infinite; }
      `}</style>
    </div>
  );
};

export default WinnerScreen;
