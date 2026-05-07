import { PrismaService } from '../../../common/prisma.service';
import { MatchState } from './match.state';
import { MatchEngine } from '../match.engine';
import { CombatStats, profileKey } from '../../users/types';
import { Prisma } from '@prisma/client';
import { RedisService } from '../../../common/redis.service';

const LEADERBOARD_CACHE_KEY = 'leaderboard:snapshot';
const LEADERBOARD_ZSET_KEY = 'leaderboard:rank';
const replayKey = (matchId: string) => `replay:${matchId}`;
const REPLAY_TTL = 3_600;

// Maximum reference values used to normalize each raw metric to 0-100
const MAX_DAMAGE_PER_MATCH = 200; // theoretical max damage a robot deals
const MAX_ENERGY_RATE = 3; // max energy commands-per-second
const MAX_EFFICIENCY = 25; // efficiency score ceiling (damage/energy * 100)

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

function normalize(value: number, max: number): number {
  return clamp(Math.round((value / max) * 100));
}

/**
 * Derive the 5 CombatStats dimensions from end-of-match robot data.
 *
 * @param robot         The robot's end-of-match state (health, energy consumed, damage dealt…)
 * @param effScore      Pre-computed efficiency score (damage / energy * 100)
 * @param durationSecs  Match duration in seconds
 */
function computeCombatStats(
  robot: {
    health: number;
    totalEnergyConsumed?: number;
    totalDamageDealt?: number;
  },
  effScore: number,
  durationSecs: number,
): CombatStats {
  const energyConsumed = robot.totalEnergyConsumed ?? 0;
  const damageDealt = robot.totalDamageDealt ?? 0;
  const finalHealth = robot.health;

  // Efficiency: how much damage per energy unit (normalized)
  const efficiency = normalize(effScore, MAX_EFFICIENCY);

  // Aggression: raw damage output normalized to ceiling
  const aggression = normalize(damageDealt, MAX_DAMAGE_PER_MATCH);

  // Defense: survival score (final health %)
  const defense = clamp(Math.round(finalHealth)); // health is already 0-100

  // Precision: proxy — damage dealt / energy consumed × 100 reflects
  // how targeted/precise the robot's fire is (higher when each shot connects)
  const rawPrecision =
    energyConsumed > 0 ? (damageDealt / energyConsumed) * 100 : 0;
  const precision = normalize(rawPrecision, 80);

  // Speed: command rate per second (energy consumed is a proxy for total commands)
  const rawSpeed = durationSecs > 0 ? energyConsumed / durationSecs : 0;
  const speed = normalize(rawSpeed, MAX_ENERGY_RATE);

  return { efficiency, aggression, defense, precision, speed };
}

/**
 * Merge new CombatStats into historical stats using an exponential
 * weighted average (35% new, 65% history) so stats evolve smoothly.
 */
function mergeStats(
  existing: CombatStats | null,
  incoming: CombatStats,
): CombatStats {
  if (!existing) return incoming;

  const w = 0.35; // weight for new match
  const keys: (keyof CombatStats)[] = [
    'efficiency',
    'aggression',
    'defense',
    'precision',
    'speed',
  ];
  const merged = {} as CombatStats;
  for (const k of keys) {
    merged[k] = clamp(Math.round(existing[k] * (1 - w) + incoming[k] * w));
  }
  return merged;
}

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
): Promise<void> {
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
      select: { id: true, combatStats: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const playerIds = users.map((u) => u.id);
    const playerIdSet = new Set(playerIds);

    if (playerIds.length === 0) return null;

    const aliveAtEnd = state.robots
      .filter((r) => playerIdSet.has(r.id))
      .sort((a, b) => b.health - a.health);

    const initialPlayerIds = matchRef
      .getInitialPlayers()
      .map((p) => p.id)
      .filter((id) => playerIdSet.has(id));

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
        replayData: snapshots,
        participants: { connect: playerIds.map((id) => ({ id })) },
      },
      update: {
        status: 'completed',
        winnerId: persistedWinnerId,
        duration: durationSecs,
        startedAt: new Date(startTime),
        endedAt: new Date(),
        replayData: snapshots,
        participants: { connect: playerIds.map((id) => ({ id })) },
      },
    });

    await Promise.all(
      aliveAtEnd.map(async (robot, index) => {
        const scriptId = playerScriptMap.get(robot.id);
        if (!scriptId) return;

        const existingStats = userMap.get(robot.id)
          ?.combatStats as CombatStats | null;
        const newStats = computeCombatStats(
          robot,
          efficiencyScores[robot.id] ?? 0,
          durationSecs,
        );
        const mergedStats = mergeStats(existingStats, newStats);

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

    return { createdMatch, playerIds, updatedWinner };
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
        replayData: snapshots,
        winnerId: persistenceResult.createdMatch.winnerId,
        duration: persistenceResult.createdMatch.duration,
        createdAt: persistenceResult.createdMatch.createdAt,
      },
      REPLAY_TTL,
    );
  }
}
