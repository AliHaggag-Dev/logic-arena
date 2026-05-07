import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis, { type RedisOptions } from 'ioredis';
import { Server, ServerOptions } from 'socket.io';
import type { ConnectionOptions as TlsConnectionOptions } from 'tls';

function redisTlsOptions(): { tls?: TlsConnectionOptions } {
  const enabled = ['1', 'true', 'yes'].includes(
    (process.env.REDIS_TLS ?? '').toLowerCase(),
  );
  return enabled ? { tls: {} } : {};
}

function createRedisClientOptions(): RedisOptions {
  return {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    family: 4,
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => {
      if (times > 5) return null;
      return Math.min(times * 300, 3_000);
    },
    ...redisTlsOptions(),
  };
}
/** Socket.io adapter backed by Redis pub/sub for cross-instance room broadcasts. */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private pubClient?: Redis;
  private subClient?: Redis;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    // Create two independent clients — never duplicate before connecting.
    // .duplicate() on a lazyConnect client that hasn't yet connected can copy
    // an inconsistent internal state and cause one client to silently skip TLS.
    const opts = createRedisClientOptions();
    this.pubClient = new Redis(opts);
    this.subClient = new Redis(opts);

    try {
      await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
      this.logger.log('✅ Socket.io Redis adapter connected');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Socket.io Redis adapter unavailable; falling back to local adapter: ${message}`,
      );
      this.pubClient?.disconnect();
      this.subClient?.disconnect();
      this.pubClient = undefined;
      this.subClient = undefined;
    }
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, options);

    if (this.pubClient && this.subClient) {
      server.adapter(createAdapter(this.pubClient, this.subClient));
    }

    return server;
  }
}
