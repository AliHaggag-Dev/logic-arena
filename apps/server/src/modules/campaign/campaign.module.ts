import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { MatchesController } from '../matches/matches.controller';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';

@Module({
  controllers: [CampaignController, MatchesController],
  providers: [CampaignService, PrismaService, RedisService],
  exports: [CampaignService],
})
export class CampaignModule {}
