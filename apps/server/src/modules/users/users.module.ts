import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersQueryService }   from './users-query.service';
import { UsersCommandService } from './users-command.service';
import { PrismaService }   from '../../common/prisma.service';

// RedisService is provided globally via RedisModule (imported in AppModule)

@Module({
  controllers: [UsersController],
  providers:   [UsersQueryService, UsersCommandService, PrismaService],
  exports:     [UsersQueryService, UsersCommandService],
})
export class UsersModule {}
