import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma.service';
import { RedisModule } from './common/redis.module';
import { HttpCacheInterceptor } from './common/interceptors/http-cache.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { ScriptsModule } from './modules/scripts/scripts.module';
import { UsersModule } from './modules/users/users.module';
import { MatchGateway } from './modules/matches/match.gateway';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    // ── Global Redis (singleton) ─────────────────────────────────────────────
    RedisModule,

    // ── Rate-limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 60 }, // 60 req / min
      { name: 'auth', ttl: 900_000, limit: 5 }, // 5 req / 15 min (auth only)
    ]),

    // ── Feature modules ──────────────────────────────────────────────────────
    AuthModule,
    ScriptsModule,
    UsersModule,
    TournamentsModule,
    CampaignModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    MatchGateway,
    // ── Global throttle guard ────────────────────────────────────────────────
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ── Global HTTP cache interceptor (X-Cache header + Redis caching) ───────
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
})
export class AppModule {}
