'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Socket } from 'socket.io-client';
import { getAuthUsername } from '../../../../lib/client-security';
import { apiClient } from '../../../../lib/api-client';
import { useAuthState } from '../../../../hooks/useAuthState';
import { StarRating } from './StarRating';
import { useEloAnimation } from './useEloAnimation';
import styles from './WinnerScreen.module.css';

/* ─── Constants ─────────────────────────────────────────────── */
const THREE_STAR_THRESHOLD = 50;
const TWO_STAR_THRESHOLD = 20;

/* Mock ELO delta — will be replaced by real server data later */
const MOCK_ELO_DELTA = 24;
const MOCK_RANK = 'BRONZE II';

interface StatEntry {
  label: string;
  value: string;
}

/* Mock stats — will be replaced by real server data later */
const MOCK_STATS: readonly StatEntry[] = [
  { label: 'TIME TAKEN', value: '1.24s' },
  { label: 'ACCURACY', value: '87%' },
  { label: 'ENERGY LEFT', value: '450 / 1000' },
  { label: 'MAX COMBO', value: 'x4' },
] as const;

/* ─── Types ─────────────────────────────────────────────────── */
interface PlayerStatsEntry {
  eloDelta: number;
  newStats: {
    precision: number;
    defense: number;
    aggression: number;
  };
  durationSecs: number;
  rank: string | number;
}

interface WinnerScreenProps {
  matchResult: {
    winner: { id: string; color: string } | null;
    draw: boolean;
    efficiencyScores: Record<string, number>;
    playerStats?: Record<string, PlayerStatsEntry>;
  };
  currentUserId: string | null;
  socket: Socket;
  matchId: string;
  onRematchClient: () => void;
}

const WinnerScreen: React.FC<WinnerScreenProps> = ({
  matchResult,
  currentUserId,
  socket,
  matchId,
  onRematchClient,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scriptId = searchParams.get('scriptId');
  const { winner, draw, efficiencyScores, playerStats } = matchResult;
  const username = getAuthUsername() ?? 'PLAYER';
  const { isGuest } = useAuthState();

  useEffect(() => {
    apiClient.post(`/ai/insights/generate/${matchId}`).catch(() => {});
  }, [matchId]);

  const isWinner = winner?.id === currentUserId;
  const title = draw ? 'DRAW' : isWinner ? 'VICTORY' : 'DEFEATED';
  const subtitle = draw ? 'MATCH_DELETED' : isWinner ? 'VICTORY!' : `${username} DEFEATED!`;

  const myScore = currentUserId ? (efficiencyScores?.[currentUserId] ?? null) : null;
  const myPlayerStats = currentUserId ? (playerStats?.[currentUserId] ?? null) : null;

  const earnedStars = myScore === null ? 0
    : myScore >= THREE_STAR_THRESHOLD ? 3
      : myScore >= TWO_STAR_THRESHOLD ? 2 : 1;

  const eloDelta = myPlayerStats ? myPlayerStats.eloDelta : (draw ? 0 : isWinner ? MOCK_ELO_DELTA : -MOCK_ELO_DELTA);
  const animatedElo = useEloAnimation(eloDelta);

  const handleRematch = useCallback(() => {
    if (scriptId) {
      socket.emit('createMatch', { scriptId });
    } else {
      router.push('/lobby');
    }
  }, [socket, scriptId, router]);

  useEffect(() => {
    const onMatchCreated = (data: { matchId: string }) => {
      const mode = searchParams.get('mode') || 'COMBAT';
      const theme = searchParams.get('theme') || 'CYBER';
      window.location.href = `/arena?matchId=${data.matchId}&scriptId=${scriptId}&mode=${mode}&theme=${theme}`;
    };
    const onMatchError = (data: { message: string }) => {
      alert(data.message);
    };
    socket.on('matchCreated', onMatchCreated);
    socket.on('createMatchError', onMatchError);
    return () => {
      socket.off('matchCreated', onMatchCreated);
      socket.off('createMatchError', onMatchError);
    };
  }, [socket, scriptId, searchParams]);

  const handleReturnToLobby = useCallback(() => router.push('/lobby'), [router]);

  const resultTheme = draw ? 'draw' : isWinner ? 'victory' : 'defeat';
  const scoreTier = myScore === null ? 'na'
    : myScore >= THREE_STAR_THRESHOLD ? 'optimal'
      : myScore >= TWO_STAR_THRESHOLD ? 'moderate' : 'low';

  const rootClass = `${styles.root} ${
    resultTheme === 'draw'
      ? styles.rootDraw
      : resultTheme === 'victory'
      ? styles.rootVictory
      : styles.rootDefeat
  }`;

  const bgRadialClass = `${styles.bgRadial} ${
    resultTheme === 'draw'
      ? styles.bgRadialDraw
      : resultTheme === 'victory'
      ? styles.bgRadialVictory
      : styles.bgRadialDefeat
  }`;

  const titleClass = `${styles.title} ${
    resultTheme === 'draw'
      ? styles.titleDraw
      : resultTheme === 'victory'
      ? styles.titleVictory
      : styles.titleDefeat
  } ${!isWinner && !draw ? styles.glitch : styles.pulse}`;

  const titleGhostClass = `${styles.title} ${
    resultTheme === 'draw'
      ? styles.titleDraw
      : resultTheme === 'victory'
      ? styles.titleVictory
      : styles.titleDefeat
  } ${styles.titleGhost}`;

  const miniOrbRingClass = `${styles.miniOrbRing} ${
    resultTheme === 'victory' ? styles.miniOrbRingVictory : styles.miniOrbRingDefeat
  }`;

  const miniOrbClass = `${styles.miniOrb} ${
    resultTheme === 'victory' ? styles.miniOrbVictory : styles.miniOrbDefeat
  }`;

  const effNumClass = `${styles.effNum} ${
    scoreTier === 'optimal'
      ? styles.effNumOptimal
      : scoreTier === 'moderate'
      ? styles.effNumModerate
      : scoreTier === 'low'
      ? styles.effNumLow
      : ''
  }`;

  const barFillClass = `${styles.barFill} ${
    scoreTier === 'optimal'
      ? styles.barFillOptimal
      : scoreTier === 'moderate'
      ? styles.barFillModerate
      : scoreTier === 'low'
      ? styles.barFillLow
      : ''
  }`;

  const eloBadgeClass = `${styles.eloBadge} ${
    resultTheme === 'victory' ? styles.eloBadgeVictory : styles.eloBadgeDefeat
  }`;

  const eloDeltaClass = `${styles.eloDelta} ${
    resultTheme === 'victory' ? styles.eloDeltaVictory : styles.eloDeltaDefeat
  }`;

  return (
    <div className={rootClass}>
      {/* ── Guest Victory Modal ───────────────────────────────── */}
      {isWinner && searchParams.get('mode') === 'CAMPAIGN' && isGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-bg-primary border border-arena-cyan/30 rounded-xl shadow-[0_0_30px_rgba(var(--arena-cyan-rgb),0.2)] text-center font-mono">
            <h2 className="text-xl font-bold text-arena-cyan tracking-widest mb-4">GUEST VICTORY!</h2>
            <p className="text-sm text-accent/80 mb-6 leading-relaxed">
              Congratulations on winning! However, as a guest, your progress is not saved. 
              Please log in or create an account to save your progress and unlock the next level.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-arena-cyan/10 border border-arena-cyan text-arena-cyan font-bold rounded tracking-widest hover:bg-arena-cyan/20 transition-all cursor-pointer"
              >
                LOG IN
              </button>
              <button
                type="button"
                onClick={handleReturnToLobby}
                className="px-6 py-2 border border-accent/20 text-accent/60 font-bold rounded tracking-widest hover:bg-accent/10 hover:text-accent transition-all cursor-pointer"
              >
                LOBBY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Background ─────────────────────────────────────────── */}
      <div className={styles.bg}>
        <div className={styles.bgDots} />
        <div className={styles.bgScanlines} />
        <div className={styles.bgGrid} />
        <div className={bgRadialClass} />
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className={styles.layout}>

        {/* ── Top section: Title + Stars ────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.subtitle}>{subtitle}</div>
          <div className={styles.titleWrap}>
            <h1 className={titleClass}>
              {title}
            </h1>
            <h1 className={titleGhostClass} aria-hidden="true">
              {title}
            </h1>
          </div>
          {myScore !== null && <StarRating earnedStars={earnedStars} />}
        </div>

        {/* ── Center: Glass card ────────────────────────────────── */}
        <div className={styles.card}>
          {/* Card top row: Orb + Efficiency side by side */}
          <div className={styles.cardHero}>
            {/* Mini orb */}
            {!draw && winner && (
              <div className={styles.miniOrbWrap}>
                <div className={miniOrbRingClass} />
                <div
                  className={miniOrbClass}
                  style={{ backgroundColor: `color-mix(in oklab, ${winner.color} 20%, transparent)` }}
                >
                  <div className={styles.miniOrbCore} style={{ backgroundColor: winner.color }} />
                </div>
              </div>
            )}

            {/* Efficiency */}
            <div className={styles.eff}>
              <div className={styles.effLabel}>EFFICIENCY SCORE</div>
              {myScore !== null ? (
                <>
                  <div className={effNumClass}>
                    {myScore.toFixed(1)}
                  </div>
                  <div className={styles.bar}>
                    <div
                      className={barFillClass}
                      style={{ width: `${Math.min(myScore, 100)}%` }}
                    />
                  </div>
                  <div className={styles.effVerdict}>
                    {myScore >= THREE_STAR_THRESHOLD ? 'EXCELLENT' :
                      myScore >= TWO_STAR_THRESHOLD ? 'GOOD EFFORT' :
                        'NEEDS IMPROVEMENT'}
                  </div>
                </>
              ) : (
                <div className={styles.effNa}>N/A</div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className={styles.stats}>
            {(myPlayerStats?.newStats ? [
              { label: 'TIME TAKEN', value: `${myPlayerStats.durationSecs}s` },
              { label: 'PRECISION', value: `${myPlayerStats.newStats.precision}%` },
              { label: 'DEFENSE', value: `${myPlayerStats.newStats.defense}%` },
              { label: 'AGGRESSION', value: `${myPlayerStats.newStats.aggression}%` },
            ] : MOCK_STATS).map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <div className={styles.statLabel}>{stat.label}</div>
                <div className={styles.statValue}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* ELO section */}
          {!draw && (
            <div className={styles.elo}>
              <div className={eloBadgeClass}>
                {myPlayerStats?.rank ? `RANK: ${myPlayerStats.rank}` : MOCK_RANK}
              </div>
              <div className={eloDeltaClass}>
                POINTS {animatedElo >= 0 ? '+' : ''}{animatedElo}
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom: buttons ──────────────────────────────────── */}
        <div className={styles.actions}>
          <button type="button" aria-label="Rematch" onClick={handleRematch} className={`${styles.btn} ${styles.btnPrimary}`}>
            <span className={styles.btnText}>PLAY AGAIN</span>
          </button>
          <button type="button" aria-label="Return to lobby" onClick={handleReturnToLobby} className={`${styles.btn} ${styles.btnSecondary}`}>
            <span className={styles.btnText}>BACK TO LOBBY</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerScreen;
