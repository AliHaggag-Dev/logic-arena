import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private isReady = false;

  onModuleInit() {
    this.client = new Redis({
      host:                    process.env.REDIS_HOST ?? '127.0.0.1',
      port:                    Number(process.env.REDIS_PORT) || 6379,
      password:                process.env.REDIS_PASSWORD,
      family:                  4, // Force IPv4 to prevent Node DNS timeouts
      tls:                     {}, // explicitly pass tls as requested
      // ── Resilience ────────────────────────────────────────────────────────
      lazyConnect:             true,        // don't block app startup
      enableReadyCheck:        true,
      connectTimeout:          5_000,
      maxRetriesPerRequest:    2,
      retryStrategy:           (times) => {
        if (times > 5) return null;         // stop retrying after 5 attempts
        return Math.min(times * 300, 3_000);
      },
      reconnectOnError: (err) => err.message.includes('READONLY'),
    });

    this.client.on('connect',      () => {
      console.log('Redis Connected Successfully');
      this.logger.log('✅ Redis connected');
    });
    this.client.on('ready',        () => { this.isReady = true;  this.logger.log('✅ Redis ready'); });
    this.client.on('reconnecting', () => { this.isReady = false; this.logger.warn('🔄 Redis reconnecting…'); });
    this.client.on('error',        (err) => { this.isReady = false; this.logger.error(`❌ Redis: ${err.message}`); });
    this.client.on('end',          () => { this.isReady = false; this.logger.warn('🔌 Redis disconnected'); });

    // Non-blocking connect — app boots regardless of Redis state
    this.client.connect().catch((err: any) => {
      console.error(`\n❌ [REDIS NETWORK/AUTH ERROR] Exact message: ${err.message}\n`, err);
      this.logger.error(`Redis initial connect failed (degraded mode): ${err.message}`);
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
    } catch { /* silent */ }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.isReady || !keys.length) return;
    try {
      await this.client.del(...keys);
    } catch { /* silent */ }
  }

  /** Scan + delete keys matching a glob pattern (cache invalidation). */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isReady) return;
    try {
      const keys: string[] = [];
      let cursor = '0';
      do {
        const [next, batch] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = next;
        keys.push(...batch);
      } while (cursor !== '0');
      if (keys.length) await this.client.del(...keys);
    } catch { /* silent */ }
  }

  get healthy(): boolean { return this.isReady; }

  getClient(): Redis { return this.client; }
}
