import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import {
  FeedbackController,
  AdminFeedbackController,
} from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  controllers: [FeedbackController, AdminFeedbackController],
  providers: [FeedbackService, PrismaService, RedisService],
})
export class FeedbackModule {}
