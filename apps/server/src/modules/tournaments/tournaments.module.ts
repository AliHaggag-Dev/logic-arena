import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  providers: [PrismaService],
  controllers: [TournamentsController],
})
export class TournamentsModule {}
