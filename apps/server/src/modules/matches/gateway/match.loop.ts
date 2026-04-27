import { Server } from 'socket.io';
import { PrismaService } from '../../../common/prisma.service';
import { MatchState } from './match.state';
import { captureReplaySnapshot } from './match.snapshot';
import { checkWinCondition } from './match.win-condition';
import { persistMatchResults } from './match.persistence';
import { computeDeltaDiff, generateSafeSnapshot } from './match.delta-diff';

export class MatchLoopManager {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private state: MatchState,
    private server: Server,
    private prisma: PrismaService,
  ) {}

  startLoop() {
    if (this.timer) return;

    this.timer = setInterval(async () => {
      for (const [matchId, match] of this.state.matches.entries()) {
        const state = match.getState();

        // 1. Snapshot capture
        const tick = (this.state.tickCount.get(matchId) || 0) + 1;
        this.state.tickCount.set(matchId, tick);
        captureReplaySnapshot(matchId, state, this.state, tick);

        // 2. Win condition checks
        const mode = this.state.matchModes.get(matchId) || 'COMBAT';
        const { matchIsOver, winner } = checkWinCondition(state, mode);

        if (matchIsOver) {
          if (this.state.savingMatches.has(matchId)) continue;
          this.state.savingMatches.add(matchId);

          const efficiencyScores = match.getEfficiencyScores();

          this.server.to(matchId).emit('matchOver', {
            winner: winner ? { id: winner.id, color: winner.color } : null,
            draw: !winner && mode !== 'RACING',
            efficiencyScores,
          });

          await persistMatchResults(
            matchId,
            state,
            winner,
            efficiencyScores,
            this.state,
            this.prisma,
            match,
          );

          match.stop();
          this.state.cleanupMatch(matchId);
          continue;
        }

        // Training mode: Detect when a dummy is killed for the first time this death
        if (mode === 'TRAINING_SOLO') {
          const killedSet = this.state.dummyKilledThisTick.get(matchId) ?? new Set<string>();
          for (const robot of state.robots) {
            if (robot.id.startsWith('dummy-') && (!robot.isAlive || robot.health <= 0)) {
              if (!killedSet.has(robot.id)) {
                // Emit the kill event only once per death
                killedSet.add(robot.id);
                this.server.to(matchId).emit('dummyKilled', { robotId: robot.id });
              }
            } else {
              // Dummy is alive again (manually respawned) — clear killed flag
              killedSet.delete(robot.id);
            }
          }
          this.state.dummyKilledThisTick.set(matchId, killedSet);
        }

        // 3. Emit Delta State
        const prevState = this.state.lastStateMap.get(matchId);
        const delta = computeDeltaDiff(state, prevState);

        const hasChanges =
          delta.type === 'full' ||
          (delta.diff && (delta.diff.robots.length > 0 || delta.diff.projectiles.length > 0));

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
}
