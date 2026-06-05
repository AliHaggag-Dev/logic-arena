import { PrismaService } from '../../../common/prisma.service';
import { MatchState } from './match.state';
import { MatchEngine } from '../match.engine';
import { CombatStats, profileKey } from '../../users/types';
import { Prisma } from '@prisma/client';
import { RedisService } from '../../../common/redis.service';
import { computeCombatStats, mergeStats } from './match.stats';
import { AchievementsService } from '../../achievements/achievements.service';

const LEADERBOARD_CACHE_KEY = 'leaderboard:snapshot';
const LEADERBOARD_ZSET_KEY = 'leaderboard:rank';
const replayKey = (matchId: string) => `replay:${matchId}`;
const REPLAY_TTL = 3_600;

export async function persistMatchResults(
  matchId: string,
  state: {
    robots: {
      id: string;
      health: number;
      totalEnergyConsumed?: number;
      totalDamageDealt?: number;
    }[];
  },
  winner: { id: string; color?: string } | null,
  efficiencyScores: Record<string, number>,
  matchState: MatchState,
  prisma: PrismaService,
  matchRef: MatchEngine,
  redis?: RedisService,
  achievementsService?: AchievementsService,
): Promise<any> {
  const candidatePlayerIds = state.robots
    .map((r) => r.id)
    .filter((id) => id !== 'bot-2');
  const startTime = matchState.matchStartTime.get(matchId) || Date.now();

  if (candidatePlayerIds.length === 0) return;

  const snapshots = matchState.replaySnapshots.get(matchId) || [];
  const durationMs = Date.now() - startTime;
  const durationSecs = Math.max(1, Math.floor(durationMs / 1000));

  const persistenceResult = await prisma.$transaction(async (tx) => {
    // Keep only real persisted users. This avoids trying to connect guest/dummy IDs.
    const users = await tx.user.findMany({
      where: { id: { in: candidatePlayerIds } },
      select: { id: true, combatStats: true, rank: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const playerIds = users.map((u) => u.id);
    const playerIdSet = new Set(playerIds);

    if (playerIds.length === 0) return null;

    const aliveAtEnd = state.robots
      .filter((r) => playerIdSet.has(r.id))
      .sort((a, b) => b.health - a.health);

    const initialPlayers = matchRef.getInitialPlayers();
    const initialPlayerIds = initialPlayers
      .map((p) => p.id)
      .filter((id) => playerIdSet.has(id));

    const finalScripts = initialPlayers.reduce(
      (acc, p) => {
        acc[p.id] = p.script;
        return acc;
      },
      {} as Record<string, string>,
    );

    const replayDataPayload = {
      snapshots,
      finalScripts,
    };

    const scripts = await tx.robotScript.findMany({
      where: { userId: { in: initialPlayerIds } },
      orderBy: [{ userId: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, userId: true },
    });

    const playerScriptMap = new Map<string, string>();
    for (const script of scripts) {
      if (!playerScriptMap.has(script.userId)) {
        playerScriptMap.set(script.userId, script.id);
      }
    }

    const persistedWinnerId =
      winner && playerIdSet.has(winner.id) ? winner.id : null;

    const createdMatch = await tx.match.upsert({
      where: { id: matchId },
      create: {
        id: matchId,
        type: 'Friendly',
        status: 'completed',
        winnerId: persistedWinnerId,
        duration: durationSecs,
        startedAt: new Date(startTime),
        endedAt: new Date(),
        replayData: replayDataPayload as Prisma.InputJsonValue,
        participants: { connect: playerIds.map((id) => ({ id })) },
      },
      update: {
        status: 'completed',
        winnerId: persistedWinnerId,
        duration: durationSecs,
        startedAt: new Date(startTime),
        endedAt: new Date(),
        replayData: replayDataPayload as Prisma.InputJsonValue,
        participants: { connect: playerIds.map((id) => ({ id })) },
      },
    });

    const playerStats: Record<string, any> = {};

    await Promise.all(
      aliveAtEnd.map(async (robot, index) => {
        const scriptId = playerScriptMap.get(robot.id);
        if (!scriptId) return;

        const existingStats = userMap.get(robot.id)
          ?.combatStats as CombatStats | null;
        const currentRank = userMap.get(robot.id)?.rank || 0;
        const newStats = computeCombatStats(
          robot,
          efficiencyScores[robot.id] ?? 0,
          durationSecs,
        );
        const mergedStats = mergeStats(existingStats, newStats);

        const eloDelta =
          persistedWinnerId === robot.id ? 10 : persistedWinnerId ? -10 : 0;
        playerStats[robot.id] = {
          eloDelta,
          newStats,
          durationSecs,
          rank: currentRank + eloDelta,
        };

        await tx.matchParticipant.upsert({
          where: {
            matchId_userId: { matchId: createdMatch.id, userId: robot.id },
          },
          create: {
            matchId: createdMatch.id,
            userId: robot.id,
            robotScriptId: scriptId,
            score: efficiencyScores[robot.id] ?? 0,
            placement: index + 1,
          },
          update: {
            robotScriptId: scriptId,
            score: efficiencyScores[robot.id] ?? 0,
            placement: index + 1,
          },
        });

        await tx.user.update({
          where: { id: robot.id },
          data: {
            combatStats: mergedStats as unknown as Prisma.InputJsonValue,
          },
        });
      }),
    );

    const updatedWinner = persistedWinnerId
      ? await tx.user.update({
          where: { id: persistedWinnerId },
          data: { rank: { increment: 10 } },
          select: { id: true, rank: true },
        })
      : null;

    if (achievementsService) {
      await Promise.all(
        playerIds.map((id) => achievementsService.checkAll(id, tx)),
      );
    }

    return {
      createdMatch,
      playerIds,
      updatedWinner,
      replayDataPayload,
      playerStats,
    };
  });

  if (!persistenceResult) return;

  if (persistenceResult.updatedWinner && redis?.healthy) {
    await redis
      .getClient()
      .zadd(
        LEADERBOARD_ZSET_KEY,
        String(persistenceResult.updatedWinner.rank),
        persistenceResult.updatedWinner.id,
      );
  }

  if (redis) {
    await redis.del(
      LEADERBOARD_CACHE_KEY,
      ...persistenceResult.playerIds.map((id) => profileKey(id)),
    );
    await redis.set(
      replayKey(matchId),
      {
        id: persistenceResult.createdMatch.id,
        replayData: persistenceResult.replayDataPayload,
        winnerId: persistenceResult.createdMatch.winnerId,
        duration: persistenceResult.createdMatch.duration,
        createdAt: persistenceResult.createdMatch.createdAt,
      },
      REPLAY_TTL,
    );
  }
  return persistenceResult;
}
