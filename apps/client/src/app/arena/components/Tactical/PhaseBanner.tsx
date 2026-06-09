import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Swords, Pause } from 'lucide-react';

interface PhaseBannerProps {
  phase: string;
  phaseEndsAt: number;
}

const TICK_INTERVAL_MS = 250;

export function PhaseBanner({ phase, phaseEndsAt }: PhaseBannerProps) {
  const computeRemaining = useCallback((): number => {
    if (!phaseEndsAt || phaseEndsAt <= 0) return 0;
    return Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000));
  }, [phaseEndsAt]);

  const [secondsLeft, setSecondsLeft] = useState(computeRemaining);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecondsLeft(computeRemaining());

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const remaining = computeRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, TICK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [computeRemaining]);

  const isFighting = phase === 'ROUND_ACTIVE';
  const isBreak = phase === 'BREAK';

  if (!isFighting && !isBreak) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="absolute top-1 lg:top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center animate-[fadeInDown_0.3s_ease-out]">
      <div 
        className={`flex items-center gap-1.5 lg:gap-3 px-3 lg:px-6 py-1 lg:py-2 rounded-full border shadow-2xl backdrop-blur-md transition-all duration-500 ${
          isFighting 
            ? 'bg-red-950/80 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
            : 'bg-cyan-950/80 border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]'
        }`}
      >
        <div className="flex items-center justify-center w-5 h-5 lg:w-8 lg:h-8">
          {isFighting ? <Swords className="w-3.5 h-3.5 lg:w-6 lg:h-6 text-red-400" /> : <Pause className="w-3.5 h-3.5 lg:w-6 lg:h-6 text-cyan-400" />}
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className={`text-[6px] lg:text-[10px] font-black tracking-[0.3em] uppercase mb-0.5 lg:mb-0 ${isFighting ? 'text-red-400' : 'text-cyan-400'}`}>
            {isFighting ? 'COMBAT ROUND' : 'TACTICAL BREAK'}
          </span>
          <span className={`text-sm lg:text-2xl font-mono font-black tracking-widest ${isFighting ? 'text-red-100' : 'text-cyan-100'}`}>
            {timeDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}
