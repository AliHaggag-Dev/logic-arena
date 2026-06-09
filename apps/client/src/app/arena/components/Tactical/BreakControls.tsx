import React from 'react';

interface BreakControlsProps {
  isActive: boolean;
  isReady: boolean;
  opponentReady: boolean;
  onToggleReady: () => void;
  opponentName?: string;
}

export function BreakControls({ isActive, isReady, opponentReady, onToggleReady, opponentName = "OPPONENT" }: BreakControlsProps) {
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-black border border-cyan-900/50 rounded-xl shadow-[0_-4px_20px_rgba(0,0,0,0.8)]">
      <div className="flex-1 flex flex-col pl-1 overflow-hidden">
        <span className="text-[8px] font-mono font-bold tracking-[0.15em] uppercase text-cyan-500/70 truncate">
          Tactical Link Established
        </span>
        <span className={`text-[9px] font-black tracking-widest uppercase truncate ${opponentReady ? 'text-green-400' : 'text-amber-400 animate-pulse'}`}>
          {opponentReady ? `[✅ ${opponentName} READY]` : `[✍️ ${opponentName} WRITING...]`}
        </span>
      </div>
      
      <button
        type="button"
        onClick={onToggleReady}
        className={`px-4 py-2 rounded-lg border text-[10px] font-black tracking-[0.1em] uppercase transition-all duration-200 shrink-0 ${
          isReady
            ? 'bg-green-950/60 border-green-500/50 text-green-400 shadow-[inset_0_0_10px_rgba(34,197,94,0.2)]'
            : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/80 hover:border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.15)] cursor-pointer'
        }`}
      >
        {isReady ? 'READY FOR COMBAT' : 'MARK AS READY'}
      </button>
    </div>
  );
}
