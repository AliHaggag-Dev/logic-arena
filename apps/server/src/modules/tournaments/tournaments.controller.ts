import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '../../common/auth.guard';
import { TournamentsCreateService } from './commands/tournaments-create.service';
import { TournamentsJoinService } from './commands/tournaments-join.service';
import { TournamentsStartService } from './commands/tournaments-start.service';
import { TournamentsCompleteService } from './commands/tournaments-complete.service';
import { TournamentsQueryService } from './tournaments-query.service';
import {
  CompleteTournamentMatchDto,
  CreateTournamentDto,
} from './tournaments.dto';

interface JwtPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}

interface RequestWithUser {
  user: JwtPayload;
}

@SkipThrottle({ auth: true })
@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly createService: TournamentsCreateService,
    private readonly joinService: TournamentsJoinService,
    private readonly startService: TournamentsStartService,
    private readonly completeMatchService: TournamentsCompleteService,
    private readonly queryService: TournamentsQueryService,
  ) {}

  /* ────────────────────── CREATE ────────────────────── */
  @Post('create')
  @UseGuards(AuthGuard)
  async create(@Body() body: CreateTournamentDto, @Req() req: RequestWithUser) {
    return this.createService.create(body.name, req.user.sub);
  }

  /* ────────────────────── JOIN ──────────────────────── */
  @Post(':id/join')
  @UseGuards(AuthGuard)
  async join(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.joinService.join(id, req.user.sub);
  }

  /* ────────────────────── START ─────────────────────── */
  @Post(':id/start')
  @UseGuards(AuthGuard)
  async start(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.startService.start(id, req.user.sub);
  }

  /* ────────────────────── LIST ALL ──────────────────── */
  @Get()
  async findAll() {
    return this.queryService.findAll();
  }

  /* ────────────────────── GET ONE ───────────────────── */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.queryService.findOne(id);
  }

  /* ────────────── COMPLETE MATCH ────────────────────── */
  @Post(':id/matches/:matchId/complete')
  @UseGuards(AuthGuard)
  async completeMatch(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() body: CompleteTournamentMatchDto,
    @Req() req: RequestWithUser,
  ) {
    return this.completeMatchService.completeMatch(
      id,
      matchId,
      body.winnerId,
      req.user.sub,
    );
  }
}
