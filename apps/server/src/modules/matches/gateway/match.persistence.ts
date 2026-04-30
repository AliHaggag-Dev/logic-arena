import { PrismaService } from '../../../common/prisma.service';
import { MatchState } from './match.state';
import { MatchEngine } from '../match.engine';
import { CombatStats } from '../../users/types';
import { Prisma } from '@prisma/client';

// Maximum reference values used to normalize each raw metric to 0-100
const MAX_DAMAGE_PER_MATCH  = 200;  // theoretical max damage a robot deals
const MAX_ENERGY_RATE       = 3;    // max energy commands-per-second
const MAX_EFFICIENCY        = 25;   // efficiency score ceiling (damage/energy * 100)

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
  const damageDealt    = robot.totalDamageDealt    ?? 0;
  const finalHealth    = robot.health;

  // Efficiency: how much damage per energy unit (normalized)
  const efficiency = normalize(effScore, MAX_EFFICIENCY);

  // Aggression: raw damage output normalized to ceiling
  const aggression = normalize(damageDealt, MAX_DAMAGE_PER_MATCH);

  // Defense: survival score (final health %)
  const defense = clamp(Math.round(finalHealth)); // health is already 0-100

  // Precision: proxy — damage dealt / energy consumed × 100 reflects
  // how targeted/precise the robot's fire is (higher when each shot connects)
  const rawPrecision = energyConsumed > 0
    ? (damageDealt / energyConsumed) * 100
    : 0;
  const precision = normalize(rawPrecision, 80);

  // Speed: command rate per second (energy consumed is a proxy for total commands)
  const rawSpeed = durationSecs > 0
    ? energyConsumed / durationSecs
    : 0;
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
  const keys: (keyof CombatStats)[] = ['efficiency', 'aggression', 'defense', 'precision', 'speed'];
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
): Promise<void> {
  const playerIds = state.robots
    .map((r) => r.id)
    .filter((id) => id !== 'bot-2');
  const startTime = matchState.matchStartTime.get(matchId) || Date.now();

  if (playerIds.length === 0) return;

  const snapshots  = matchState.replaySnapshots.get(matchId) || [];
  const durationMs = Date.now() - startTime;
  const durationSecs = Math.max(1, Math.floor(durationMs / 1000));

  const aliveAtEnd = state.robots
    .filter((r) => r.id !== 'bot-2')
    .sort((a, b) => b.health - a.health);

  const playerScriptMap = new Map<string, string>();
  for (const p of matchRef.getInitialPlayers()) {
    if (p.id === 'bot-2') continue;
    const dbScript = await prisma.robotScript.findFirst({
      where: { userId: p.id },
      orderBy: { createdAt: 'desc' },
    });
    if (dbScript) playerScriptMap.set(p.id, dbScript.id);
  }

  const createdMatch = await prisma.match.upsert({
    where: { id: matchId },
    create: {
      id: matchId,
      type: 'Friendly',
      status: 'completed',
      winnerId: winner && winner.id !== 'bot-2' ? winner.id : null,
      duration: durationSecs,
      startedAt: new Date(startTime),
      endedAt: new Date(),
      replayData: snapshots,
      participants: { connect: playerIds.map((id) => ({ id })) },
    },
    update: {
      status: 'completed',
      winnerId: winner && winner.id !== 'bot-2' ? winner.id : null,
      duration: durationSecs,
      startedAt: new Date(startTime),
      endedAt: new Date(),
      replayData: snapshots,
      participants: { connect: playerIds.map((id) => ({ id })) },
    },
  });

  for (let i = 0; i < aliveAtEnd.length; i++) {
    const robot    = aliveAtEnd[i];
    const scriptId = playerScriptMap.get(robot.id);
    if (!scriptId) continue;

    await prisma.matchParticipant.upsert({
      where: { matchId_userId: { matchId: createdMatch.id, userId: robot.id } },
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

    // Compute and persist updated combatStats for this player
    const newStats = computeCombatStats(robot, efficiencyScores[robot.id] ?? 0, durationSecs);

    const existingUser = await prisma.user.findUnique({
      where: { id: robot.id },
      select: { combatStats: true },
    });
    const existingStats = existingUser?.combatStats as CombatStats | null;
    const mergedStats   = mergeStats(existingStats, newStats);

    await prisma.user.update({
      where: { id: robot.id },
      data: { combatStats: mergedStats as unknown as Prisma.InputJsonValue },
    });
  }

  if (winner && winner.id !== 'bot-2') {
    await prisma.user.update({
      where: { id: winner.id },
      data: { rank: { increment: 10 } },
    });
  }
}
