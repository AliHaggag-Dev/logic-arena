import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "../../common/prisma.service";
import { EmailService } from "../../common/email.service";

@Module({
  providers: [AuthService, PrismaService, EmailService],
  controllers: [AuthController],
  exports: [AuthService], // Export AuthService if needed by other modules
})
export class AuthModule {}