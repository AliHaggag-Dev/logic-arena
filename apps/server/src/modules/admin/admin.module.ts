import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminStatsService } from './admin.stats.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminStatsService, PrismaService],
})
export class AdminModule {}
