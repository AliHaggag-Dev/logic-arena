import { CombatStats } from '../../users/types';

const MAX_DAMAGE_PER_MATCH = 200;
const MAX_ENERGY_RATE = 3;
const MAX_EFFICIENCY = 25;

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

function normalize(value: number, max: number): number {
  return clamp(Math.round((value / max) * 100));
}

export function computeCombatStats(
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

  const efficiency = normalize(effScore, MAX_EFFICIENCY);
  const aggression = normalize(damageDealt, MAX_DAMAGE_PER_MATCH);
  const defense = clamp(Math.round(finalHealth));
  const rawPrecision =
    energyConsumed > 0 ? (damageDealt / energyConsumed) * 100 : 0;
  const precision = normalize(rawPrecision, 80);
  const rawSpeed = durationSecs > 0 ? energyConsumed / durationSecs : 0;
  const speed = normalize(rawSpeed, MAX_ENERGY_RATE);

  return { efficiency, aggression, defense, precision, speed };
}

export function mergeStats(
  existing: CombatStats | null,
  incoming: CombatStats,
): CombatStats {
  if (!existing) return incoming;

  const w = 0.35;
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
