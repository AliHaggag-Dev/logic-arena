import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { PrismaService } from '../../common/prisma.service';

import { TournamentsQueryService } from './tournaments-query.service';
import { TournamentsCreateService } from './commands/tournaments-create.service';
import { TournamentsJoinService } from './commands/tournaments-join.service';
import { TournamentsStartService } from './commands/tournaments-start.service';
import { TournamentsCompleteService } from './commands/tournaments-complete.service';

@Module({
  providers: [
    PrismaService,
    TournamentsQueryService,
    TournamentsCreateService,
    TournamentsJoinService,
    TournamentsStartService,
    TournamentsCompleteService,
  ],
  controllers: [TournamentsController],
})
export class TournamentsModule {}
