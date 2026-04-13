import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { PrismaService } from "../../common/prisma.service";
import { UsersController } from "./users.controller";

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
