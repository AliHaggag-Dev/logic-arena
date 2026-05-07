import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

function isRedisTlsEnabled(): boolean {
  return ['1', 'true', 'yes'].includes(
    (process.env.REDIS_TLS ?? '').toLowerCase(),
  );
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private isReady = false;

  onModuleInit() {
    const useTls = isRedisTlsEnabled();

    this.client = new Redis({
      host: process.env.REDIS_HOST ?? '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      family: 4, // Force IPv4 to prevent Node DNS timeouts
      ...(useTls ? { tls: {} } : {}),
      // ── Resilience ────────────────────────────────────────────────────────
      lazyConnect: true, // don't block app startup
      enableReadyCheck: true,
      connectTimeout: 5_000,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 300, 3_000);
      },
      reconnectOnError: (err) => err.message.includes('READONLY'),
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected');
    });
    this.client.on('ready', () => {
      this.isReady = true;
      this.logger.log('✅ Redis ready');
    });
    this.client.on('reconnecting', () => {
      this.isReady = false;
      this.logger.warn('🔄 Redis reconnecting…');
    });
    this.client.on('error', (err) => {
      this.isReady = false;
      this.logger.error(`❌ Redis: ${err.message}`);
    });
    this.client.on('end', () => {
      this.isReady = false;
      this.logger.warn('🔌 Redis disconnected');
    });

    // Non-blocking connect — app boots regardless of Redis state
    this.client.connect().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Redis initial connect failed (degraded mode): ${message}`,
      );
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  // ── Core helpers (all ops are no-ops when Redis is unavailable) ───────────

  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady) return null;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.isReady) return;
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      /* silent */
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.isReady || !keys.length) return;
    try {
      await this.client.del(...keys);
    } catch {
      /* silent */
    }
  }

  /** Scan + delete keys matching a glob pattern (cache invalidation). */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isReady) return;
    try {
      const keys: string[] = [];
      let cursor = '0';
      do {
        const [next, batch] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = next;
        keys.push(...batch);
      } while (cursor !== '0');
      if (keys.length) await this.client.del(...keys);
    } catch {
      /* silent */
    }
  }

  /** Atomic increment with TTL — returns the new count (0 if Redis is down). */
  async incr(key: string, ttlSeconds: number): Promise<number> {
    if (!this.isReady) return 0;
    try {
      const count = await this.client.incr(key);
      if (count === 1) await this.client.expire(key, ttlSeconds);
      return count;
    } catch {
      return 0;
    }
  }

  get healthy(): boolean {
    return this.isReady;
  }

  getClient(): Redis {
    return this.client;
  }
}
