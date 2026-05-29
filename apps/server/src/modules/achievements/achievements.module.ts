import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';

@Module({
  providers: [AchievementsService, PrismaService, RedisService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
