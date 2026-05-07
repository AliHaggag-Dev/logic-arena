import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { PrismaService } from '../../common/prisma.service';

import { TournamentsQueryService } from './tournaments-query.service';
import { TournamentsCommandService } from './tournaments-command.service';

@Module({
  providers: [
    PrismaService,
    TournamentsQueryService,
    TournamentsCommandService,
  ],
  controllers: [TournamentsController],
})
export class TournamentsModule {}
