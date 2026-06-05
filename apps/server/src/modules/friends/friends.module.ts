import { Module } from '@nestjs/common';
import { FriendsController, UserSearchController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendsRepository } from './friends.repository';
import { SuggestionsService } from './suggestions.service';
import { FriendsGateway } from './friends.gateway';
import { MatchesModule } from '../matches/matches.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MatchesModule, NotificationsModule],
  controllers: [FriendsController, UserSearchController],
  providers: [
    FriendsService,
    FriendsRepository,
    SuggestionsService,
    FriendsGateway,
  ],
  exports: [FriendsService, FriendsGateway],
})
export class FriendsModule {}
