import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { ScriptsModule } from './modules/scripts/scripts.module';
import { UsersModule } from './modules/users/users.module';
import { MatchGateway } from './modules/matches/match.gateway';
import { TournamentsModule } from './modules/tournaments/tournaments.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,  // 60-second window
        limit: 60,    // max 60 requests per minute (all routes)
      },
      {
        name: 'auth',
        ttl: 900_000, // 15-minute window
        limit: 5,     // max 5 requests per 15 min (auth routes only)
      },
    ]),
    AuthModule,
    ScriptsModule,
    UsersModule,
    TournamentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    MatchGateway,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // apply to all endpoints automatically
    },
  ],
})
export class AppModule { }