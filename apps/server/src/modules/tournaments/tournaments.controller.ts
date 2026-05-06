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
import { TournamentsCommandService } from './tournaments-command.service';
import { TournamentsQueryService } from './tournaments-query.service';
import { CompleteTournamentMatchDto, CreateTournamentDto } from './tournaments.dto';

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
    private readonly commandService: TournamentsCommandService,
    private readonly queryService: TournamentsQueryService,
  ) { }

  /* ────────────────────── CREATE ────────────────────── */
  @Post('create')
  @UseGuards(AuthGuard)
  async create(@Body() body: CreateTournamentDto, @Req() req: RequestWithUser) {
    return this.commandService.create(body.name, req.user.sub);
  }

  /* ────────────────────── JOIN ──────────────────────── */
  @Post(':id/join')
  @UseGuards(AuthGuard)
  async join(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.commandService.join(id, req.user.sub);
  }

  /* ────────────────────── START ─────────────────────── */
  @Post(':id/start')
  @UseGuards(AuthGuard)
  async start(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.commandService.start(id, req.user.sub);
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
    return this.commandService.completeMatch(id, matchId, body.winnerId, req.user.sub);
  }
}
