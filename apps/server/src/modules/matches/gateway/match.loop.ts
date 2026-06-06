import { Server } from 'socket.io';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import { MatchState } from './match.state';
import { captureReplaySnapshot } from './match.snapshot';
import { checkWinCondition } from './match.win-condition';
import { persistMatchResults } from './match.persistence';
import { computeDeltaDiff, generateSafeSnapshot } from './match.delta-diff';
import { AchievementsService } from '../../achievements/achievements.service';

const ROUND_START_COUNTDOWN_SECONDS = 3;
const SECONDS_PER_MS = 1000;

export class MatchLoopManager {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private state: MatchState,
    private server: Server,
    private prisma: PrismaService,
    private redis?: RedisService,
    private achievementsService?: AchievementsService,
  ) {}

  startLoop() {
    if (this.timer) return;

    this.timer = setInterval(async () => {
      for (const [matchId, match] of this.state.matches.entries()) {
        this.advanceMatchPhase(matchId, match);
        if (this.state.matchPhases.get(matchId) === 'BREAK') continue;

        const state = match.getState();

        // 1. Snapshot capture
        const tick = (this.state.tickCount.get(matchId) || 0) + 1;
        this.state.tickCount.set(matchId, tick);
        captureReplaySnapshot(matchId, state, this.state, tick);

        // 2. Win condition checks
        const mode = this.state.matchModes.get(matchId) || 'COMBAT';
        const { matchIsOver, winner } = checkWinCondition(
          state,
          mode,
          state.modeData,
        );

        if (matchIsOver) {
          if (this.state.savingMatches.has(matchId)) continue;
          this.state.savingMatches.add(matchId);

          const efficiencyScores = match.getEfficiencyScores();

          const persistenceResult = await persistMatchResults(
            matchId,
            state,
            winner,
            efficiencyScores,
            this.state,
            this.prisma,
            match,
            this.redis,
            this.achievementsService,
          );

          this.server.to(matchId).emit('matchOver', {
            winner: winner ? { id: winner.id, color: winner.color } : null,
            draw: !winner && mode !== 'RACING',
            efficiencyScores,
            playerStats: persistenceResult?.playerStats || {},
          });

          match.stop();
          this.state.matchPhases.set(matchId, 'FINISHED');
          this.state.cleanupMatch(matchId);
          continue;
        }

        // Training / Survival: Detect when a dummy is killed for the first time this death
        if (mode === 'TRAINING_SOLO' || mode === 'SURVIVAL') {
          const killedSet =
            this.state.dummyKilledThisTick.get(matchId) ?? new Set<string>();
          for (const robot of state.robots) {
            if (
              robot.id.startsWith('dummy-') &&
              (!robot.isAlive || robot.health <= 0)
            ) {
              if (!killedSet.has(robot.id)) {
                // Emit the kill event only once per death
                killedSet.add(robot.id);
                this.server
                  .to(matchId)
                  .emit('dummyKilled', { robotId: robot.id });
              }
            } else {
              // Dummy is alive again (manually respawned) — clear killed flag
              killedSet.delete(robot.id);
            }
          }
          this.state.dummyKilledThisTick.set(matchId, killedSet);
        }

        // 3. Emit Delta State
        const prevState = this.state.lastStateMap.get(matchId) as Parameters<
          typeof computeDeltaDiff
        >[1];
        const delta = computeDeltaDiff(state, prevState);

        const hasChanges =
          delta.type === 'full' ||
          delta.diff.robots.length > 0 ||
          delta.diff.projectiles.upsert.length > 0 ||
          delta.diff.projectiles.remove.length > 0;

        if (hasChanges) {
          const safeSnapshot = generateSafeSnapshot(state);
          this.state.lastStateMap.set(matchId, safeSnapshot);
          this.server.to(matchId).emit('gameState', delta);
        }
      }
    }, 50);
  }

  stopLoop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  submitReady(matchId: string, userId: string, script: string): void {
    const match = this.state.matches.get(matchId);
    if (!match || this.state.matchPhases.get(matchId) !== 'BREAK') return;

    const submissions =
      this.state.readySubmissions.get(matchId) ?? new Map();
    submissions.set(userId, { userId, script });
    this.state.readySubmissions.set(matchId, submissions);

    match.updateInitialPlayer(userId, script);
    this.server.to(matchId).emit('match:player-ready', { userId });

    const playerIds = match
      .getInitialPlayers()
      .map((player) => player.id)
      .filter((id) => !id.startsWith('bot-') && !id.startsWith('dummy-'));
    const allReady =
      playerIds.length > 0 && playerIds.every((id) => submissions.has(id));
    if (allReady) {
      this.startNextRound(matchId, match);
    }
  }

  private advanceMatchPhase(matchId: string, match: import('../match.engine').MatchEngine): void {
    if (this.state.arenaMatchModes.get(matchId) !== 'TACTICAL') return;

    const phase = this.state.matchPhases.get(matchId) ?? 'ROUND_ACTIVE';
    if (phase === 'FINISHED' || phase === 'WAITING') return;

    if (phase === 'BREAK') {
      const endsAt = this.state.phaseEndsAt.get(matchId) ?? 0;
      if (Date.now() >= endsAt) {
        this.startNextRound(matchId, match);
      }
      return;
    }

    const state = match.getState();
    const roundNumber = this.state.roundNumbers.get(matchId) ?? 1;
    const config = this.state.roundConfigs.get(matchId);
    if (!config) return;

    const roundTimeExpired = Date.now() >= (this.state.phaseEndsAt.get(matchId) ?? Infinity);
    const healthTriggered =
      roundNumber === 1 &&
      state.robots.some(
        (robot) =>
          !robot.id.startsWith('bot-') &&
          !robot.id.startsWith('dummy-') &&
          robot.health <= config.healthTrigger,
      );

    if (roundNumber < config.durations.length && (roundTimeExpired || healthTriggered)) {
      this.startBreak(matchId, match);
    }
  }

  private startBreak(matchId: string, match: import('../match.engine').MatchEngine): void {
    const config = this.state.roundConfigs.get(matchId);
    if (!config) return;

    match.stop();
    this.state.matchPhases.set(matchId, 'BREAK');
    this.state.phaseEndsAt.set(matchId, Date.now() + config.breakDuration * SECONDS_PER_MS);
    this.state.readySubmissions.set(matchId, new Map());

    const roundNumber = this.state.roundNumbers.get(matchId) ?? 1;
    const scripts = match.getInitialPlayers().map((player) => ({
      userId: player.id,
      script: player.script,
    }));
    this.server.to(matchId).emit('match:break-started', {
      scripts,
      timeLeft: config.breakDuration,
    });
    this.server.to(matchId).emit('match:phase-changed', {
      phase: 'BREAK',
      roundNumber,
      timeLeft: config.breakDuration,
    });
  }

  private startNextRound(matchId: string, match: import('../match.engine').MatchEngine): void {
    const config = this.state.roundConfigs.get(matchId);
    if (!config) return;

    const nextRound = (this.state.roundNumbers.get(matchId) ?? 1) + 1;
    this.state.roundNumbers.set(matchId, nextRound);
    this.state.matchPhases.set(matchId, 'ROUND_ACTIVE');
    this.state.phaseEndsAt.set(
      matchId,
      Date.now() + config.durations[nextRound - 1] * SECONDS_PER_MS,
    );
    this.state.readySubmissions.delete(matchId);

    this.server.to(matchId).emit('match:round-starting', {
      countdown: ROUND_START_COUNTDOWN_SECONDS,
    });
    this.server.to(matchId).emit('match:phase-changed', {
      phase: 'ROUND_ACTIVE',
      roundNumber: nextRound,
      timeLeft: config.durations[nextRound - 1],
    });
    match.start();
  }
}
