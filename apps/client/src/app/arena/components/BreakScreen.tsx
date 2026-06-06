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
        className="w-full max-w-4xl rounded-lg border p-4 backdrop-blur-md"
        style={{
          background: 'var(--card)',
          borderColor: 'rgba(var(--accent-rgb), 0.45)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <ShieldAlert size={18} />
            <span>Break - Round {phase.roundNumber} Complete</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-black tabular-nums">
            <Clock size={16} />
            {minutes}:{String(seconds).padStart(TIMER_PAD, '0')}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <RobotVitals label="You" health={ownRobot?.health ?? 0} />
          <RobotVitals label="Enemy" health={enemyRobot?.health ?? 0} />
        </div>

        <label className="mb-2 block text-xs font-black uppercase tracking-widest text-text-secondary">
          Script
        </label>
        <textarea
          aria-label="Break script editor"
          className="h-72 w-full resize-none rounded border bg-bg-primary p-3 font-mono text-sm text-text-primary outline-none"
          style={{ borderColor: 'rgba(var(--accent-rgb), 0.35)' }}
          value={draftScript}
          onChange={(event) => setDraftScript(event.target.value)}
          spellCheck={false}
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-4 text-xs font-black uppercase tracking-widest text-text-secondary">
            <span>{isReady ? 'You ready' : 'You waiting'}</span>
            <span>{opponentReady ? 'Opponent ready' : 'Opponent waiting'}</span>
          </div>
          <button
            type="button"
            onClick={handleReady}
            disabled={isReady}
            className="flex h-11 items-center gap-2 rounded border px-4 text-xs font-black uppercase tracking-widest text-accent disabled:opacity-50"
            style={{
              background: 'rgba(var(--accent-rgb), 0.12)',
              borderColor: 'rgba(var(--accent-rgb), 0.45)',
            }}
          >
            <Check size={16} />
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
      className="rounded border p-3"
      style={{ borderColor: 'rgba(var(--accent-rgb), 0.28)' }}
    >
      <div className="mb-2 text-xs font-black uppercase tracking-widest text-text-secondary">
        {label}
      </div>
      <div className="flex items-center gap-2 text-lg font-black">
        <Heart size={18} />
        {Math.round(health)}
      </div>
    </div>
  );
}
