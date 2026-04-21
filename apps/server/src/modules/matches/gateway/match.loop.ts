import { Server } from 'socket.io';
import { PrismaService } from '../../../common/prisma.service';
import { MatchState } from './match.state';
import { TRACKED_ROBOT_PROPS } from './types';

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

        // --- Replay snapshot (every 10th tick) ---
        const tick = (this.state.tickCount.get(matchId) || 0) + 1;
        this.state.tickCount.set(matchId, tick);
        if (tick % 10 === 0) {
          const snapshots = this.state.replaySnapshots.get(matchId) || [];
          snapshots.push({
            t: tick,
            robots: state.robots.map((r: any) => ({
              id: r.id,
              position: { x: r.position.x, y: r.position.y },
              health: r.health,
              energy: r.energy,
              inStasis: r.inStasis,
              color: r.color,
              rotation: r.rotation,
              isAlive: r.isAlive,
            })),
            projectiles: state.projectiles.map((p: any) => ({
              id: p.id,
              position: { x: p.position.x, y: p.position.y },
              velocity: p.velocity,
              ownerId: p.ownerId,
            })),
          });
          this.state.replaySnapshots.set(matchId, snapshots);
        }

        // --- Win condition ---
        const aliveRobots = state.robots.filter((r: any) => r.health > 0);
        const mode = this.state.matchModes.get(matchId) || 'COMBAT';
        let matchIsOver = false;
        let winner: any = null;

        if (mode === 'RACING') {
          const TARGET_X = 700, TARGET_Y = 300;
          winner = state.robots.find(
            (r: any) => Math.hypot(r.position.x - TARGET_X, r.position.y - TARGET_Y) < 50,
          );
          if (winner) matchIsOver = true;
        } else if (mode === 'TRAINING_SOLO') {
          matchIsOver = false;
        } else if (state.robots.length > 0 && aliveRobots.length <= 1) {
          matchIsOver = true;
          winner = aliveRobots.length === 1 ? aliveRobots[0] : null;
        }

        if (matchIsOver) {
          // Guard must be checked AND set synchronously before any await
          if (this.state.savingMatches.has(matchId)) continue;
          this.state.savingMatches.add(matchId);

          const efficiencyScores = match.getEfficiencyScores();

          this.server.to(matchId).emit('matchOver', {
            winner: winner ? { id: winner.id, color: winner.color } : null,
            draw: !winner && mode !== 'RACING',
            efficiencyScores,
          });

          // Persist match to DB
          const playerIds = state.robots
            .map((r: any) => r.id)
            .filter((id: string) => id !== 'bot-2');
          const startTime = this.state.matchStartTime.get(matchId) || Date.now();

          if (playerIds.length > 0) {
            const snapshots = this.state.replaySnapshots.get(matchId) || [];

            const aliveAtEnd = state.robots
              .filter((r: any) => r.id !== 'bot-2')
              .sort((a: any, b: any) => b.health - a.health);

            const playerScriptMap = new Map<string, string>();
            for (const p of match['initialPlayers'] as { id: string; script: string }[]) {
              if (p.id === 'bot-2') continue;
              const dbScript = await this.prisma.robotScript.findFirst({
                where: { userId: p.id },
                orderBy: { createdAt: 'desc' },
              });
              if (dbScript) playerScriptMap.set(p.id, dbScript.id);
            }

            const createdMatch = await this.prisma.match.upsert({
              where: { id: matchId },
              create: {
                id: matchId,
                type: 'Friendly',
                status: 'completed',
                winnerId: winner && winner.id !== 'bot-2' ? winner.id : null,
                duration: Math.floor((Date.now() - startTime) / 1000),
                startedAt: new Date(startTime),
                endedAt: new Date(),
                replayData: snapshots,
                participants: { connect: playerIds.map((id: string) => ({ id })) },
              },
              update: {
                status: 'completed',
                winnerId: winner && winner.id !== 'bot-2' ? winner.id : null,
                duration: Math.floor((Date.now() - startTime) / 1000),
                startedAt: new Date(startTime),
                endedAt: new Date(),
                replayData: snapshots,
                participants: { connect: playerIds.map((id: string) => ({ id })) },
              },
            });

            for (let i = 0; i < aliveAtEnd.length; i++) {
              const robot = aliveAtEnd[i];
              const scriptId = playerScriptMap.get(robot.id);
              if (!scriptId) continue;

              await this.prisma.matchParticipant.upsert({
                where: {
                  matchId_userId: {
                    matchId: createdMatch.id,
                    userId: robot.id,
                  },
                },
                create: {
                  matchId: createdMatch.id,
                  userId: robot.id,
                  robotScriptId: scriptId,
                  score: efficiencyScores[robot.id] ?? 0,
                  placement: i + 1,
                },
                update: {
                  robotScriptId: scriptId,
                  score: efficiencyScores[robot.id] ?? 0,
                  placement: i + 1,
                },
              });
            }

            if (winner && winner.id !== 'bot-2') {
              await this.prisma.user.update({
                where: { id: winner.id },
                data: { rank: { increment: 10 } },
              });
            }
          }

          match.stop();
          this.state.cleanupMatch(matchId);
          continue;
        }

        // --- Delta-state diff ---
        const prevState = this.state.lastStateMap.get(matchId);
        let delta: any = { type: 'full', state };

        if (prevState) {
          const robotsDiff = state.robots.map((r: any) => {
            const prevR = prevState.robots.find((pr: any) => pr.id === r.id);
            if (!prevR) return r;

            let rd: any = { id: r.id };
            let changed = false;

            for (const prop of TRACKED_ROBOT_PROPS) {
              const curVal = JSON.stringify(r[prop]);
              const prevVal = JSON.stringify((prevR as any)[prop]);
              if (curVal !== prevVal) {
                rd[prop] = r[prop];
                changed = true;
              }
            }

            if (r.isAlive) {
              const vMag = Math.hypot(r.velocity?.x ?? 0, r.velocity?.y ?? 0);
              if (vMag > 0.01) {
                rd.position = r.position;
                rd.velocity = r.velocity;
                rd.rotation = r.rotation;
                changed = true;
              }
            }

            const curIds = (r.visibleEntities?.robots ?? []).map((vr: any) => vr.id).sort().join(',');
            const prevIds = ((prevR as any).visibleRobotIds ?? []).slice().sort().join(',');
            if (curIds !== prevIds) {
              rd.visibleRobotIds = (r.visibleEntities?.robots ?? []).map((vr: any) => vr.id);
              changed = true;
            }

            return changed ? rd : null;
          }).filter(Boolean);

          delta = {
            type: 'delta',
            diff: { robots: robotsDiff, projectiles: state.projectiles },
          };
        }

        const hasChanges =
          delta.type === 'full' ||
          (delta.diff && (delta.diff.robots.length > 0 || delta.diff.projectiles.length > 0));

        if (hasChanges) {
          const safeSnapshot = {
            robots: state.robots.map((r: any) => {
              const snap: any = { id: r.id };
              for (const prop of TRACKED_ROBOT_PROPS) {
                const val = r[prop];
                snap[prop] = val !== null && typeof val === 'object' && !Array.isArray(val)
                  ? { ...val }
                  : val;
              }
              snap.visibleRobotIds = (r.visibleEntities?.robots ?? []).map((vr: any) => vr.id);
              return snap;
            }),
            projectiles: state.projectiles.map((p: any) => ({
              id: p.id, position: { ...p.position }, velocity: { ...p.velocity },
            })),
            obstacles: undefined,
          };
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
