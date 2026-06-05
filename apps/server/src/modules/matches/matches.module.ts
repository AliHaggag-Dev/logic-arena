import { Module } from '@nestjs/common';
import { MatchState } from './gateway/match.state';
import { MatchGateway } from './match.gateway';
import { CampaignModule } from '../campaign/campaign.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [CampaignModule, AchievementsModule],
  providers: [MatchState, MatchGateway],
  exports: [MatchState],
})
export class MatchesModule {}
