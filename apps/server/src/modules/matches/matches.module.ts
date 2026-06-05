import { Module, forwardRef } from '@nestjs/common';
import { MatchState } from './gateway/match.state';
import { MatchGateway } from './match.gateway';
import { CampaignModule } from '../campaign/campaign.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FriendsModule } from '../friends/friends.module';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';

@Module({
  imports: [
    CampaignModule,
    AchievementsModule,
    NotificationsModule,
    forwardRef(() => FriendsModule),
  ],
  providers: [MatchState, MatchGateway, PrismaService, RedisService],
  exports: [MatchState],
})
export class MatchesModule {}
