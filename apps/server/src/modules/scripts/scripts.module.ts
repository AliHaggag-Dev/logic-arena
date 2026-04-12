import { Module } from "@nestjs/common";
import { ScriptsService } from "./scripts.service";
import { ScriptsController } from "./scripts.controller";
import { PrismaService } from "../../common/prisma.service";

@Module({
  providers: [ScriptsService, PrismaService],
  controllers: [ScriptsController],
  exports: [ScriptsService],
})
export class ScriptsModule {}
