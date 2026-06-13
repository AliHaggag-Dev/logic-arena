import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import { RedisService } from '../redis.service';
import { AUTH_COOKIE_NAME } from '../../modules/auth/types';

const CACHE_TTL = 60; // seconds — public non-user-specific GET responses
// Note: /users/leaderboard is NOT listed here because all leaderboard requests
// carry an HttpOnly auth cookie, which causes this interceptor to BYPASS them.
// Leaderboard caching is handled in the controller via Redis per-page snapshots
// and the Cache-Control response header on the endpoint itself.
const PUBLIC_CACHEABLE_PATHS = new Set<string>([]);

type HeaderValue = string | string[] | undefined;

function headerIncludesAuthCookie(cookieHeader: HeaderValue): boolean {
  const rawCookie = Array.isArray(cookieHeader)
    ? cookieHeader.join(';')
    : cookieHeader;
  if (!rawCookie) return false;

  return rawCookie
    .split(';')
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`));
}

function getPathname(url: string): string {
  return url.split('?')[0] || '/';
}

/**
 * Global HTTP cache interceptor.
 *
 * Rules:
 *  - Only caches GET requests.
 *  - Skips routes with Authorization or auth-cookie credentials (user-specific data).
 *  - Adds `X-Cache: HIT | MISS | BYPASS | DEGRADED` to every response.
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private readonly redis: RedisService) {}

  async intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = ctx.switchToHttp().getRequest<{
      url: string;
      method: string;
      headers: Record<string, HeaderValue>;
    }>();
    const res = ctx.switchToHttp().getResponse<{
      setHeader: (k: string, v: string) => void;
    }>();

    const hasAuthorizationHeader = Boolean(req.headers['authorization']);
    const hasAuthCookie = headerIncludesAuthCookie(req.headers['cookie']);
    const isExplicitlyCacheable = PUBLIC_CACHEABLE_PATHS.has(
      getPathname(req.url),
    );

    // Only cache public GET — skip auth-gated, cookie-authenticated, and mutating requests
    if (
      req.method !== 'GET' ||
      hasAuthorizationHeader ||
      hasAuthCookie ||
      !isExplicitlyCacheable
    ) {
      res.setHeader('X-Cache', 'BYPASS');
      return next.handle();
    }

    // Redis unavailable → degrade gracefully
    if (!this.redis.healthy) {
      res.setHeader('X-Cache', 'DEGRADED');
      return next.handle();
    }

    const cacheKey = `http:${req.url}`;
    const cached = await this.redis.get<unknown>(cacheKey);

    if (cached !== null) {
      res.setHeader('X-Cache', 'HIT');
      return of(cached);
    }

    res.setHeader('X-Cache', 'MISS');

    return next.handle().pipe(
      tap(async (response) => {
        await this.redis.set(cacheKey, response, CACHE_TTL);
      }),
    );
  }
}
