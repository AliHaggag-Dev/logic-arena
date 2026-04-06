import { Module, Global } from "@nestjs/common";
import { GameGateway } from "./game.gateway";
import { GameService } from "./game.service";

@Global()
@Module({
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}