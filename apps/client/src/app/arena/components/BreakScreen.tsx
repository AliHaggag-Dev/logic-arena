'use client';

import { Check, Clock, Heart, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { MatchPhaseState } from '../hooks/game/useGameState';
import type { RobotState } from '../types';

const TIMER_PAD = 2;
const SECONDS_PER_MINUTE = 60;

interface BreakScreenProps {
  socket: Socket;
  phase: MatchPhaseState;
  robots: RobotState[];
  currentUserId: string | null;
  fallbackScript: string;
}

export function BreakScreen({
  socket,
  phase,
  robots,
  currentUserId,
  fallbackScript,
}: BreakScreenProps) {
  const ownScript = useMemo(() => {
    return (
      phase.scripts.find((entry) => entry.userId === currentUserId)?.script ??
      fallbackScript
    );
  }, [currentUserId, fallbackScript, phase.scripts]);
  const [draftScript, setDraftScript] = useState(ownScript);
  const [localTimeLeft, setLocalTimeLeft] = useState(phase.timeLeft);

  useEffect(() => {
    setDraftScript(ownScript);
  }, [ownScript]);

  useEffect(() => {
    setLocalTimeLeft(phase.timeLeft);
    if (phase.phase !== 'BREAK') return;
    const timer = window.setInterval(() => {
      setLocalTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase.phase, phase.timeLeft]);

  if (phase.phase !== 'BREAK') return null;

  const ownRobot = robots.find((robot) => robot.id === currentUserId);
  const enemyRobot = robots.find((robot) => robot.id !== currentUserId);
  const isReady = currentUserId
    ? phase.readyUserIds.includes(currentUserId)
    : false;
  const opponentReady = enemyRobot
    ? phase.readyUserIds.includes(enemyRobot.id)
    : false;
  const minutes = Math.floor(localTimeLeft / SECONDS_PER_MINUTE);
  const seconds = localTimeLeft % SECONDS_PER_MINUTE;

  const handleReady = (): void => {
    socket.emit('match:submit-ready', { script: draftScript });
  };

  return (
    <section
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(var(--bg-primary-rgb), 0.78)' }}
      aria-label="Tactical break"
    >
      <div
        className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-lg border p-2.5 md:p-4 backdrop-blur-md"
        style={{
          background: 'var(--card)',
          borderColor: 'rgba(var(--accent-rgb), 0.45)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="mb-2 md:mb-4 flex items-center justify-between gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-black uppercase tracking-widest">
            <ShieldAlert className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
            <span>Break - Round {phase.roundNumber} Complete</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-black tabular-nums">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {minutes}:{String(seconds).padStart(TIMER_PAD, '0')}
          </div>
        </div>

        <div className="mb-2 md:mb-4 grid grid-cols-2 gap-2 md:gap-3">
          <RobotVitals label="You" health={ownRobot?.health ?? 0} />
          <RobotVitals label="Enemy" health={enemyRobot?.health ?? 0} />
        </div>

        <label className="mb-1 md:mb-2 block text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary">
          Script
        </label>
        <textarea
          aria-label="Break script editor"
          className="h-20 md:h-72 w-full resize-none rounded border bg-bg-primary p-2 md:p-3 font-mono text-xs md:text-sm text-text-primary outline-none"
          style={{ borderColor: 'rgba(var(--accent-rgb), 0.35)' }}
          value={draftScript}
          onChange={(event) => setDraftScript(event.target.value)}
          spellCheck={false}
        />

        <div className="mt-2 md:mt-4 flex items-center justify-between gap-2 md:gap-3">
          <div className="flex flex-col md:flex-row gap-1 md:gap-4 text-[9px] md:text-xs font-black uppercase tracking-widest text-text-secondary">
            <span>{isReady ? 'You ready' : 'You waiting'}</span>
            <span className="hidden md:inline">•</span>
            <span>{opponentReady ? 'Opponent ready' : 'Opponent waiting'}</span>
          </div>
          <button
            type="button"
            onClick={handleReady}
            disabled={isReady}
            className="flex h-8 md:h-11 items-center gap-1.5 md:gap-2 rounded border px-3 md:px-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-accent disabled:opacity-50"
            style={{
              background: 'rgba(var(--accent-rgb), 0.12)',
              borderColor: 'rgba(var(--accent-rgb), 0.45)',
            }}
          >
            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Ready
          </button>
        </div>
      </div>
    </section>
  );
}

function RobotVitals({ label, health }: { label: string; health: number }) {
  return (
    <div
      className="rounded border p-1.5 md:p-3"
      style={{ borderColor: 'rgba(var(--accent-rgb), 0.28)' }}
    >
      <div className="mb-0.5 md:mb-2 text-[9px] md:text-xs font-black uppercase tracking-widest text-text-secondary">
        {label}
      </div>
      <div className="flex items-center gap-1.5 md:gap-2 text-sm md:text-lg font-black">
        <Heart className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
        {Math.round(health)}
      </div>
    </div>
  );
}
