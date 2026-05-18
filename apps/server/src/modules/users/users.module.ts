import { Module } from '@nestjs/common';
import { ProfileController } from './controllers/profile.controller';
import { SocialController } from './controllers/social.controller';
import { MarketController } from './controllers/market.controller';
import { ProfileQueryService } from './queries/profile-query.service';
import { SocialQueryService } from './queries/social-query.service';
import { MarketQueryService } from './queries/market-query.service';
import { ProfileCommandService } from './commands/profile-command.service';
import { PreferencesCommandService } from './commands/preferences-command.service';
import { MarketCommandService } from './commands/market-command.service';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryService } from '../../common/cloudinary.service';

@Module({
  controllers: [
    ProfileController,
    SocialController,
    MarketController,
  ],
  providers: [
    ProfileQueryService,
    SocialQueryService,
    MarketQueryService,
    ProfileCommandService,
    PreferencesCommandService,
    MarketCommandService,
    PrismaService,
    CloudinaryService,
  ],
  exports: [
    ProfileQueryService,
    SocialQueryService,
    MarketQueryService,
    ProfileCommandService,
    PreferencesCommandService,
    MarketCommandService,
  ],
})
export class UsersModule {}
