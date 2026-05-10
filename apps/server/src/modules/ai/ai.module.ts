import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { RagService } from './rag.service';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { MatchInsightsService } from './match-insights.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [AiController, InsightsController],
  providers: [AiService, RagService, InsightsService, MatchInsightsService, PrismaService],
  exports: [RagService, InsightsService, MatchInsightsService],
})
export class AiModule {}
