import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma.service';
import { AuthModule } from './modules/auth/auth.module'; // Import AuthModule
import { ScriptsModule } from './modules/scripts/scripts.module'; // Import ScriptsModule
import { UsersModule } from './modules/users/users.module'; // Import UsersModule
import { MatchGateway } from './modules/matches/match.gateway'; // Import MatchGateway
import { GameModule } from './game/game.module';

@Module({
  imports: [AuthModule, ScriptsModule, UsersModule, GameModule], // Add new modules here
  controllers: [AppController],
  providers: [AppService, PrismaService, MatchGateway], // Add MatchGateway to providers
})
export class AppModule { }
