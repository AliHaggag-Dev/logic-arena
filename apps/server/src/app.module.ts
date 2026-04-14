import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma.service';
import { AuthModule } from './modules/auth/auth.module'; // Import AuthModule
import { ScriptsModule } from './modules/scripts/scripts.module'; // Import ScriptsModule
import { UsersModule } from './modules/users/users.module'; // Import UsersModule
import { MatchGateway } from './modules/matches/match.gateway'; // Import MatchGateway
import { TournamentsModule } from './modules/tournaments/tournaments.module'; // Import TournamentsModule

@Module({
  imports: [AuthModule, ScriptsModule, UsersModule, TournamentsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, MatchGateway], // Keep MatchGateway
})
export class AppModule { }

