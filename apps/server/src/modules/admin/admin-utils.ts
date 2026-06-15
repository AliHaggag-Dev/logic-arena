import { DailyCount, HistogramBucket } from './admin.types';

export const DAYS_30 = 30;
export const HISTOGRAM_CHUNK_RANK = 200;
export const HISTOGRAM_CHUNK_POINTS = 500;
export const HISTOGRAM_CHUNK_SCRIPT_LEN = 500;
export const TOP_PLAYERS_LIMIT = 10;
export const TOP_SCRIPTS_LIMIT = 10;
export const MOST_ACTIVE_USERS_LIMIT = 10;
export const TOP_TOURNAMENT_WINNERS_LIMIT = 5;
export const TOP_FAILED_LEVELS_LIMIT = 10;
export const DEFAULT_PAGE_SIZE = 20;
export const OVERVIEW_CACHE_KEY = 'admin:stats:overview';
export const OVERVIEW_CACHE_TTL = 120;
export const HEALTH_CACHE_KEY = 'admin:health';
export const HEALTH_CACHE_TTL = 60;

export function startOfToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function startOfThisWeek(): Date {
  return daysAgo(7);
}

export function startOfThisMonth(): Date {
  return daysAgo(30);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Build a contiguous 30-day timeline filled with zeroes for missing days. */
export function buildTimeline(
  raw: { date: Date | string; count: bigint | number }[],
): DailyCount[] {
  const map = new Map<string, number>();
  for (const row of raw) {
    const key = typeof row.date === 'string' ? row.date : toIsoDate(row.date);
    map.set(key, Number(row.count));
  }
  const result: DailyCount[] = [];
  for (let i = DAYS_30 - 1; i >= 0; i--) {
    const key = toIsoDate(daysAgo(i));
    result.push({ date: key, count: map.get(key) ?? 0 });
  }
  return result;
}

/** Generic numeric histogram bucketing. */
export function buildHistogram(
  values: number[],
  chunkSize: number,
): HistogramBucket[] {
  const map = new Map<number, number>();
  for (const v of values) {
    const bucket = Math.floor(v / chunkSize) * chunkSize;
    map.set(bucket, (map.get(bucket) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucket, count]) => ({
      bucket: `${bucket}–${bucket + chunkSize - 1}`,
      count,
    }));
}
