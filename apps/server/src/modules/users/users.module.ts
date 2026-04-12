import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { PrismaService } from "../../common/prisma.service";

@Module({
  providers: [UsersService, PrismaService],
  exports: [UsersService], // Export UsersService if needed by other modules
})
export class UsersModule {}
