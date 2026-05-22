'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';
import { getAuthUsername } from '../../../lib/client-security';
import { apiClient } from '../../../lib/api-client';

/* ─── Constants ─────────────────────────────────────────────── */
const THREE_STAR_THRESHOLD = 50;
const TWO_STAR_THRESHOLD = 20;
const STAR_ANIMATION_BASE_DELAY_MS = 500;
const STAR_ANIMATION_INTERVAL_MS = 500;
const ELO_ANIMATION_DURATION_MS = 1000;
const ELO_TICK_INTERVAL_MS = 16;

/* Mock ELO delta — will be replaced by real server data later */
const MOCK_ELO_DELTA = 24;
const MOCK_RANK = 'BRONZE II';

/* Mock stats — will be replaced by real server data later */
const MOCK_STATS: readonly StatEntry[] = [
  { label: 'EXEC TIME', value: '1.24s' },
  { label: 'ACCURACY', value: '87%' },
  { label: 'ENERGY LEFT', value: '450 / 1000' },
  { label: 'MAX COMBO', value: 'x4' },
] as const;

/* ─── Types ─────────────────────────────────────────────────── */
interface StatEntry {
  label: string;
  value: string;
}

interface WinnerScreenProps {
  matchResult: {
    winner: { id: string; color: string } | null;
    draw: boolean;
    efficiencyScores: Record<string, number>;
  };
  currentUserId: string | null;
  socket: Socket;
  matchId: string;
  onRematchClient: () => void;
}

/* ─── Star Rating Component ─────────────────────────────────── */
interface StarRatingProps {
  earnedStars: number;
}

const StarRating: React.FC<StarRatingProps> = ({ earnedStars }) => {
  const totalStars = 3;
  return (
    <div className="ws-stars" role="img" aria-label={`${earnedStars} out of ${totalStars} stars`}>
      {Array.from({ length: totalStars }, (_, i) => {
        const isEarned = i < earnedStars;
        const delayMs = STAR_ANIMATION_BASE_DELAY_MS + i * STAR_ANIMATION_INTERVAL_MS;
        return (
          <span
            key={i}
            className={`ws-star ${isEarned ? 'ws-star--earned' : 'ws-star--empty'}`}
            style={{ animationDelay: `${delayMs}ms` }}
            aria-hidden="true"
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

/* ─── ELO Animation Hook ────────────────────────────────────── */
function useEloAnimation(targetDelta: number): number {
  const [displayDelta, setDisplayDelta] = useState(0);

  useEffect(() => {
    if (targetDelta === 0) return;

    const totalTicks = Math.ceil(ELO_ANIMATION_DURATION_MS / ELO_TICK_INTERVAL_MS);
    const absTarget = Math.abs(targetDelta);
    const sign = targetDelta > 0 ? 1 : -1;
    let currentTick = 0;

    const interval = window.setInterval(() => {
      currentTick++;
      const progress = Math.min(currentTick / totalTicks, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayDelta(Math.round(eased * absTarget) * sign);

      if (currentTick >= totalTicks) {
        window.clearInterval(interval);
      }
    }, ELO_TICK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [targetDelta]);

  return displayDelta;
}

/* ─── Main Component ────────────────────────────────────────── */
const WinnerScreen: React.FC<WinnerScreenProps> = ({
  matchResult, currentUserId, socket, matchId, onRematchClient,
}) => {
  const router = useRouter();
  const { winner, draw, efficiencyScores } = matchResult;
  const username = getAuthUsername() ?? 'PLAYER';

  useEffect(() => {
    apiClient.post(`/ai/insights/generate/${matchId}`).catch(() => {});
  }, [matchId]);

  const isWinner = winner?.id === currentUserId;
  const title = draw ? 'DRAW' : isWinner ? 'VICTORY' : 'DEFEATED';
  const subtitle = draw ? 'MATCH_DELETED' : isWinner ? 'VICTORY!' : `${username} DEFEATED!`;

  const myScore = currentUserId ? (efficiencyScores?.[currentUserId] ?? null) : null;

  const earnedStars = myScore === null ? 0
    : myScore >= THREE_STAR_THRESHOLD ? 3
      : myScore >= TWO_STAR_THRESHOLD ? 2 : 1;

  const eloDelta = draw ? 0 : isWinner ? MOCK_ELO_DELTA : -MOCK_ELO_DELTA;
  const animatedElo = useEloAnimation(eloDelta);

  const handleRematch = useCallback(() => {
    socket.emit('resetGame', { matchId });
    onRematchClient();
  }, [socket, matchId, onRematchClient]);

  const handleReturnToLobby = useCallback(() => router.push('/lobby'), [router]);

  const resultTheme = draw ? 'draw' : isWinner ? 'victory' : 'defeat';
  const scoreTier = myScore === null ? 'na'
    : myScore >= THREE_STAR_THRESHOLD ? 'optimal'
      : myScore >= TWO_STAR_THRESHOLD ? 'moderate' : 'low';

  return (
    <div className={`ws-root ws-root--${resultTheme}`}>
      {/* ── Background ─────────────────────────────────────────── */}
      <div className="ws-bg">
        <div className="ws-bg__dots" />
        <div className="ws-bg__scanlines" />
        <div className="ws-bg__grid" />
        <div className={`ws-bg__radial ws-bg__radial--${resultTheme}`} />
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="ws-layout">

        {/* ── Top section: Title + Stars ────────────────────────── */}
        <div className="ws-header">
          <div className="ws-subtitle">{subtitle}</div>
          <div className="ws-title-wrap">
            <h1 className={`ws-title ws-title--${resultTheme} ${!isWinner && !draw ? 'ws-glitch' : 'ws-pulse'}`}>
              {title}
            </h1>
            <h1 className={`ws-title ws-title--${resultTheme} ws-title--ghost`} aria-hidden="true">
              {title}
            </h1>
          </div>
          {myScore !== null && <StarRating earnedStars={earnedStars} />}
        </div>

        {/* ── Center: Glass card ────────────────────────────────── */}
        <div className="ws-card">
          {/* Card top row: Orb + Efficiency side by side */}
          <div className="ws-card__hero">
            {/* Mini orb */}
            {!draw && winner && (
              <div className="ws-mini-orb-wrap">
                <div className={`ws-mini-orb-ring ws-mini-orb-ring--${resultTheme}`} />
                <div
                  className={`ws-mini-orb ws-mini-orb--${resultTheme}`}
                  style={{ backgroundColor: `color-mix(in oklab, ${winner.color} 20%, transparent)` }}
                >
                  <div className="ws-mini-orb__core" style={{ backgroundColor: winner.color }} />
                </div>
              </div>
            )}

            {/* Efficiency */}
            <div className="ws-eff">
              <div className="ws-eff__label">EFFICIENCY SCORE</div>
              {myScore !== null ? (
                <>
                  <div className={`ws-eff__num ws-eff__num--${scoreTier}`}>
                    {myScore.toFixed(1)}
                  </div>
                  <div className="ws-bar">
                    <div
                      className={`ws-bar__fill ws-bar__fill--${scoreTier}`}
                      style={{ width: `${Math.min(myScore, 100)}%` }}
                    />
                  </div>
                  <div className="ws-eff__verdict">
                    {myScore >= THREE_STAR_THRESHOLD ? 'OPTIMAL ALGORITHM' :
                      myScore >= TWO_STAR_THRESHOLD ? 'MODERATE EFFICIENCY' :
                        'REFACTOR RECOMMENDED'}
                  </div>
                </>
              ) : (
                <div className="ws-eff__na">N/A</div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="ws-stats">
            {MOCK_STATS.map((stat) => (
              <div key={stat.label} className="ws-stat">
                <div className="ws-stat__label">{stat.label}</div>
                <div className="ws-stat__value">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* ELO section */}
          {!draw && (
            <div className="ws-elo">
              <div className={`ws-elo__badge ws-elo__badge--${resultTheme}`}>{MOCK_RANK}</div>
              <div className={`ws-elo__delta ws-elo__delta--${resultTheme}`}>
                ELO {animatedElo >= 0 ? '+' : ''}{animatedElo}
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom: buttons ──────────────────────────────────── */}
        <div className="ws-actions">
          <button type="button" aria-label="Rematch" onClick={handleRematch} className="ws-btn ws-btn--primary">
            <span className="ws-btn__text">REINIT_SESSION</span>
          </button>
          <button type="button" aria-label="Return to lobby" onClick={handleReturnToLobby} className="ws-btn ws-btn--secondary">
            <span className="ws-btn__text">ABORT_TO_LOBBY</span>
          </button>
        </div>
      </div>

      {/* ── Scoped Styles ──────────────────────────────────────── */}
      <style jsx>{`
        /* ── Keyframes ──────────────────────────────────────────── */
        @keyframes wsGlitch {
          0%   { transform: translate(0); }
          20%  { transform: translate(-2px, 2px); }
          40%  { transform: translate(-2px, -2px); }
          60%  { transform: translate(2px, 2px); }
          80%  { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        @keyframes wsStarPop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.25) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes wsCardIn {
          0%   { transform: translateY(20px) scale(0.96); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes wsFadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes wsPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.75; }
        }
        @keyframes wsBarGrow {
          0% { width: 0%; }
        }
        @keyframes wsRingSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes wsFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }

        .ws-glitch { animation: wsGlitch 0.3s cubic-bezier(.25,.46,.45,.94) both infinite; }
        .ws-pulse  { animation: wsPulse 2.5s ease-in-out infinite; }

        /* ── Root — full viewport, NO scroll ────────────────────── */
        .ws-root {
          position: fixed; inset: 0; z-index: 100;
          display: flex; align-items: center; justify-content: center;
          background: var(--arena-black);
          overflow: hidden;
          animation: wsFadeIn 600ms ease-out;
        }

        /* ── Background layers ──────────────────────────────────── */
        .ws-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .ws-bg__dots {
          position: absolute; inset: 0; opacity: 0.15;
          background-image: radial-gradient(circle, var(--arena-white) 0.5px, transparent 0.5px);
          background-size: 80px 80px;
        }
        .ws-bg__scanlines {
          position: absolute; inset: 0; opacity: 0.12; z-index: 1;
          background:
            linear-gradient(rgba(var(--arena-black-rgb),0) 50%, rgba(var(--arena-black-rgb),0.3) 50%),
            linear-gradient(90deg, rgba(var(--arena-red-rgb),0.04), rgba(var(--arena-green-rgb),0.015), rgba(var(--arena-stasis-rgb),0.04));
          background-size: 100% 2px, 3px 100%;
        }
        .ws-bg__grid {
          position: absolute; inset: 0; opacity: 0.06;
          background:
            linear-gradient(to right, var(--accent) 1px, transparent 1px),
            linear-gradient(to bottom, var(--accent) 1px, transparent 1px);
          background-size: 50px 50px;
          transform: perspective(600px) rotateX(65deg);
          transform-origin: top;
        }
        .ws-bg__radial {
          position: absolute; inset: 0; opacity: 0.15;
        }
        .ws-bg__radial--victory {
          background: radial-gradient(ellipse at 50% 30%, rgba(var(--arena-cyan-rgb), 0.25), transparent 60%);
        }
        .ws-bg__radial--defeat {
          background: radial-gradient(ellipse at 50% 30%, rgba(var(--sem-danger-rgb), 0.25), transparent 60%);
        }
        .ws-bg__radial--draw {
          background: radial-gradient(ellipse at 50% 30%, rgba(var(--arena-fps-warn-rgb), 0.25), transparent 60%);
        }

        /* ── Layout — flex column, constrained to viewport ───── */
        .ws-layout {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center;
          gap: 1.25rem;
          width: 100%; max-width: 28rem;
          padding: 1.5rem 1rem;
          max-height: 100vh;
          box-sizing: border-box;
        }

        /* ── Header: title + stars ──────────────────────────────── */
        .ws-header {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.25rem;
          animation: wsFadeIn 600ms ease-out;
        }
        .ws-subtitle {
          font-size: 9px; letter-spacing: 0.45em;
          color: rgba(var(--arena-white-rgb), 0.3);
          text-transform: uppercase; font-weight: 900;
        }
        .ws-title-wrap { position: relative; line-height: 1; }
        .ws-title {
          font-size: clamp(3rem, 10vw, 5.5rem);
          font-weight: 900; letter-spacing: -0.04em; line-height: 1;
        }
        .ws-title--victory {
          color: var(--arena-cyan);
          filter: drop-shadow(0 0 20px rgba(var(--arena-cyan-rgb), 0.7));
        }
        .ws-title--defeat {
          color: var(--sem-danger);
          filter: drop-shadow(0 0 20px rgba(var(--sem-danger-rgb), 0.7));
        }
        .ws-title--draw {
          color: var(--arena-fps-warn);
          filter: drop-shadow(0 0 20px rgba(var(--arena-fps-warn-rgb), 0.7));
        }
        .ws-title--ghost {
          position: absolute; inset: 0;
          opacity: 0.35; filter: blur(6px);
          pointer-events: none;
        }

        /* ── Stars ──────────────────────────────────────────────── */
        .ws-stars { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
        .ws-star {
          font-size: 1.5rem; line-height: 1;
          opacity: 0;
          animation: wsStarPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .ws-star--earned {
          color: var(--arena-cyan);
          filter: drop-shadow(0 0 8px rgba(var(--arena-cyan-rgb), 0.7))
                  drop-shadow(0 0 16px rgba(var(--arena-cyan-rgb), 0.3));
        }
        .ws-star--empty { color: rgba(var(--arena-white-rgb), 0.1); }

        /* ── Glass Card ─────────────────────────────────────────── */
        .ws-card {
          width: 100%;
          border: 1px solid rgba(var(--arena-cyan-rgb), 0.12);
          background: rgba(var(--arena-cyan-rgb), 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 0.75rem;
          padding: 1.25rem;
          animation: wsCardIn 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-shadow:
            0 0 0 1px rgba(var(--arena-white-rgb), 0.03),
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(var(--arena-white-rgb), 0.04);
        }

        /* ── Card hero: orb + efficiency side by side ───────────── */
        .ws-card__hero {
          display: flex; align-items: center;
          gap: 1.25rem;
          margin-bottom: 1rem;
        }

        /* ── Mini orb ───────────────────────────────────────────── */
        .ws-mini-orb-wrap {
          position: relative; flex-shrink: 0;
          width: 4rem; height: 4rem;
          animation: wsFloat 3s ease-in-out infinite;
        }
        .ws-mini-orb-ring {
          position: absolute; inset: -6px;
          border-radius: 50%; border: 1px dashed;
          animation: wsRingSpin 8s linear infinite;
          opacity: 0.3;
        }
        .ws-mini-orb-ring--victory { border-color: var(--arena-cyan); }
        .ws-mini-orb-ring--defeat  { border-color: var(--sem-danger); }
        .ws-mini-orb {
          width: 100%; height: 100%; border-radius: 50%;
          border: 1.5px solid; display: flex;
          align-items: center; justify-content: center;
        }
        .ws-mini-orb--victory {
          border-color: rgba(var(--arena-cyan-rgb), 0.4);
          box-shadow: 0 0 24px rgba(var(--arena-cyan-rgb), 0.4);
        }
        .ws-mini-orb--defeat {
          border-color: rgba(var(--sem-danger-rgb), 0.4);
          box-shadow: 0 0 24px rgba(var(--sem-danger-rgb), 0.4);
        }
        .ws-mini-orb__core {
          width: 1.75rem; height: 1.75rem; border-radius: 50%;
          box-shadow: inset 0 0 10px rgba(var(--arena-white-rgb), 0.4);
        }

        /* ── Efficiency ─────────────────────────────────────────── */
        .ws-eff { flex: 1; min-width: 0; }
        .ws-eff__label {
          font-size: 8px; letter-spacing: 0.35em;
          color: rgba(var(--arena-cyan-rgb), 0.5);
          text-transform: uppercase; font-weight: 900;
          margin-bottom: 0.125rem;
        }
        .ws-eff__num {
          font-size: 2.25rem; font-weight: 900;
          letter-spacing: -0.03em; line-height: 1.1;
        }
        .ws-eff__num--optimal {
          color: var(--eff-optimal);
          filter: drop-shadow(0 0 6px rgba(var(--arena-cyan-rgb), 0.5));
        }
        .ws-eff__num--moderate {
          color: var(--eff-moderate);
          filter: drop-shadow(0 0 6px rgba(var(--arena-amber-rgb), 0.4));
        }
        .ws-eff__num--low {
          color: var(--eff-low);
          filter: drop-shadow(0 0 6px rgba(var(--sem-danger-rgb), 0.4));
        }
        .ws-eff__verdict {
          font-size: 7px; letter-spacing: 0.12em;
          color: rgba(var(--arena-white-rgb), 0.2);
          text-transform: uppercase; margin-top: 0.25rem;
        }
        .ws-eff__na {
          color: rgba(var(--arena-white-rgb), 0.25);
          font-size: 0.75rem; letter-spacing: 0.12em;
        }

        /* ── Score bar ──────────────────────────────────────────── */
        .ws-bar {
          margin-top: 0.375rem; height: 4px;
          background: rgba(var(--arena-white-rgb), 0.05);
          border-radius: 9999px; overflow: hidden;
          border: 1px solid rgba(var(--arena-white-rgb), 0.06);
        }
        .ws-bar__fill {
          height: 100%; border-radius: 9999px;
          animation: wsBarGrow 1s ease-out;
        }
        .ws-bar__fill--optimal {
          background: var(--eff-optimal);
          box-shadow: 0 0 6px var(--accent);
        }
        .ws-bar__fill--moderate { background: var(--eff-moderate); }
        .ws-bar__fill--low      { background: var(--eff-low); }

        /* ── Stats Grid ─────────────────────────────────────────── */
        .ws-stats {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(var(--arena-white-rgb), 0.05);
        }
        .ws-stat {
          padding: 0.5rem;
          background: rgba(var(--arena-white-rgb), 0.02);
          border: 1px solid rgba(var(--arena-white-rgb), 0.05);
          border-radius: 0.375rem;
        }
        .ws-stat__label {
          font-size: 7px; letter-spacing: 0.15em;
          color: rgba(var(--arena-white-rgb), 0.35);
          text-transform: uppercase; font-weight: 900;
          margin-bottom: 0.125rem;
        }
        .ws-stat__value {
          font-size: 1rem; font-weight: 900;
          color: rgba(var(--arena-white-rgb), 0.85);
          letter-spacing: -0.02em;
        }

        /* ── ELO / Rank ─────────────────────────────────────────── */
        .ws-elo {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(var(--arena-white-rgb), 0.05);
        }
        .ws-elo__badge {
          font-size: 9px; font-weight: 900;
          letter-spacing: 0.25em;
          padding: 0.2rem 0.6rem;
          border-radius: 0.25rem;
          text-transform: uppercase;
        }
        .ws-elo__badge--victory {
          color: var(--arena-cyan);
          background: rgba(var(--arena-cyan-rgb), 0.08);
          border: 1px solid rgba(var(--arena-cyan-rgb), 0.2);
        }
        .ws-elo__badge--defeat {
          color: var(--sem-danger);
          background: rgba(var(--sem-danger-rgb), 0.08);
          border: 1px solid rgba(var(--sem-danger-rgb), 0.2);
        }
        .ws-elo__delta {
          font-size: 1.25rem; font-weight: 900;
          letter-spacing: -0.02em;
        }
        .ws-elo__delta--victory {
          color: var(--sem-success);
          filter: drop-shadow(0 0 4px rgba(var(--sem-success-rgb), 0.4));
        }
        .ws-elo__delta--defeat {
          color: var(--sem-danger);
          filter: drop-shadow(0 0 4px rgba(var(--sem-danger-rgb), 0.4));
        }

        /* ── Action buttons — side by side ──────────────────────── */
        .ws-actions {
          display: flex; gap: 0.75rem;
          width: 100%;
          animation: wsFadeIn 800ms ease-out 300ms both;
        }
        .ws-btn {
          flex: 1; position: relative;
          padding: 0.75rem 0.5rem;
          background: transparent;
          cursor: pointer; border: none;
          border-radius: 0.375rem;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .ws-btn--primary {
          border: 1px solid rgba(var(--arena-cyan-rgb), 0.35);
          background: rgba(var(--arena-cyan-rgb), 0.04);
          box-shadow: 0 0 12px rgba(var(--arena-cyan-rgb), 0.1);
        }
        .ws-btn--primary:hover {
          border-color: rgba(var(--arena-cyan-rgb), 0.7);
          background: rgba(var(--arena-cyan-rgb), 0.1);
          box-shadow: 0 0 24px rgba(var(--arena-cyan-rgb), 0.3);
        }
        .ws-btn--secondary {
          border: 1px solid rgba(var(--arena-white-rgb), 0.08);
          background: rgba(var(--arena-white-rgb), 0.02);
        }
        .ws-btn--secondary:hover {
          border-color: rgba(var(--arena-white-rgb), 0.18);
          background: rgba(var(--arena-white-rgb), 0.06);
        }
        .ws-btn__text {
          font-weight: 900; letter-spacing: 0.2em;
          font-size: 0.7rem; font-family: inherit;
        }
        .ws-btn--primary .ws-btn__text { color: var(--arena-cyan); }
        .ws-btn--primary:hover .ws-btn__text { filter: brightness(1.2); }
        .ws-btn--secondary .ws-btn__text { color: rgba(var(--arena-white-rgb), 0.35); }
        .ws-btn--secondary:hover .ws-btn__text { color: rgba(var(--arena-white-rgb), 0.6); }

        /* ── Responsive: smaller screens ────────────────────────── */
        @media (max-height: 700px) {
          .ws-layout { gap: 0.75rem; padding: 1rem 0.75rem; }
          .ws-title { font-size: clamp(2.25rem, 8vw, 3.5rem); }
          .ws-card { padding: 1rem; }
          .ws-eff__num { font-size: 1.75rem; }
          .ws-star { font-size: 1.25rem; }
          .ws-mini-orb-wrap { width: 3rem; height: 3rem; }
          .ws-mini-orb__core { width: 1.25rem; height: 1.25rem; }
          .ws-stats { gap: 0.375rem; }
          .ws-stat { padding: 0.375rem; }
          .ws-stat__value { font-size: 0.875rem; }
        }

        @media (max-height: 550px) {
          .ws-layout { gap: 0.5rem; padding: 0.5rem; }
          .ws-title { font-size: 2rem; }
          .ws-card { padding: 0.75rem; }
          .ws-card__hero { gap: 0.75rem; margin-bottom: 0.5rem; }
          .ws-eff__num { font-size: 1.5rem; }
          .ws-stats { padding-top: 0.5rem; gap: 0.25rem; }
          .ws-elo { margin-top: 0.5rem; padding-top: 0.5rem; }
          .ws-btn { padding: 0.5rem; }
        }
      `}</style>
    </div>
  );
};

export default WinnerScreen;
