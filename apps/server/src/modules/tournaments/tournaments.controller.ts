import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AuthGuard } from '../../common/auth.guard';

@Controller('tournaments')
export class TournamentsController {
  constructor(private prisma: PrismaService) { }

  /* ────────────────────── CREATE ────────────────────── */
  @Post('create')
  @UseGuards(AuthGuard)
  async create(@Body() body: { name: string }, @Req() req: any) {
    const userId = req.user.sub;
    const tournament = await this.prisma.tournament.create({
      data: {
        name: body.name,
        creatorId: userId,
        participants: { connect: { id: userId } },
      },
      include: { participants: true, matches: true },
    });
    return tournament;
  }

  /* ────────────────────── JOIN ──────────────────────── */
  @Post(':id/join')
  @UseGuards(AuthGuard)
  async join(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.status !== 'WAITING')
      throw new BadRequestException('Tournament already started');
    if (tournament.participants.length >= 8)
      throw new BadRequestException('Tournament is full');
    if (tournament.participants.some((p) => p.id === userId))
      throw new BadRequestException('Already joined');

    const updated = await this.prisma.tournament.update({
      where: { id },
      data: { participants: { connect: { id: userId } } },
      include: { participants: true, matches: true },
    });
    return updated;
  }

  /* ────────────────────── START ─────────────────────── */
  @Post(':id/start')
  @UseGuards(AuthGuard)
  async start(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.creatorId !== userId)
      throw new ForbiddenException('Only the creator can start the tournament');
    if (tournament.status !== 'WAITING')
      throw new BadRequestException('Tournament already started');

    const count = tournament.participants.length;
    if (count !== 4 && count !== 8 && count !== 2)
      throw new BadRequestException(
        'Need exactly 4 or 8 participants to start',
      );

    // Shuffle participants — use null-safe access for every slot
    const shuffled = [...tournament.participants].sort(
      () => Math.random() - 0.5,
    );

    const p = (i: number): string | null => shuffled[i]?.id ?? null;

    if (count >= 8) {
      // ── 8-player bracket: 4 quarters → 2 semis → 1 final ──
      for (let i = 0; i < 4; i++) {
        await this.prisma.tournamentMatch.create({
          data: {
            tournamentId: id,
            round: 1,
            matchIndex: i,
            player1Id: p(i * 2),
            player2Id: p(i * 2 + 1),
            status: 'PENDING',
          },
        });
      }
      for (let i = 0; i < 2; i++) {
        await this.prisma.tournamentMatch.create({
          data: { tournamentId: id, round: 2, matchIndex: i, status: 'PENDING' },
        });
      }
      await this.prisma.tournamentMatch.create({
        data: { tournamentId: id, round: 3, matchIndex: 0, status: 'PENDING' },
      });
    } else if (count >= 4) {
      // ── 4-player bracket: 2 semis → 1 final ──
      for (let i = 0; i < 2; i++) {
        await this.prisma.tournamentMatch.create({
          data: {
            tournamentId: id,
            round: 1,
            matchIndex: i,
            player1Id: p(i * 2),
            player2Id: p(i * 2 + 1),
            status: 'PENDING',
          },
        });
      }
      await this.prisma.tournamentMatch.create({
        data: { tournamentId: id, round: 2, matchIndex: 0, status: 'PENDING' },
      });
    } else {
      // ── 2-player bracket: single final match ──
      await this.prisma.tournamentMatch.create({
        data: {
          tournamentId: id,
          round: 1,
          matchIndex: 0,
          player1Id: p(0),
          player2Id: p(1),
          status: 'PENDING',
        },
      });
    }

    const updated = await this.prisma.tournament.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
      include: {
        participants: true,
        matches: { orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }] },
      },
    });

    return updated;
  }

  /* ────────────────────── LIST ALL ──────────────────── */
  @Get()
  async findAll() {
    const tournaments = await this.prisma.tournament.findMany({
      include: {
        participants: { select: { id: true, username: true } },
        creator: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return tournaments;
  }

  /* ────────────────────── GET ONE ───────────────────── */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: { select: { id: true, username: true } },
        creator: { select: { id: true, username: true } },
        matches: { orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }] },
      },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');

    // Enrich matches with player info
    const enrichedMatches = await Promise.all(
      tournament.matches.map(async (m) => {
        const [player1, player2, winner] = await Promise.all([
          m.player1Id
            ? this.prisma.user.findUnique({
              where: { id: m.player1Id },
              select: { id: true, username: true },
            })
            : null,
          m.player2Id
            ? this.prisma.user.findUnique({
              where: { id: m.player2Id },
              select: { id: true, username: true },
            })
            : null,
          m.winnerId
            ? this.prisma.user.findUnique({
              where: { id: m.winnerId },
              select: { id: true, username: true },
            })
            : null,
        ]);
        return { ...m, player1, player2, winner };
      }),
    );

    return { ...tournament, matches: enrichedMatches };
  }

  /* ────────────── COMPLETE MATCH ────────────────────── */
  @Post(':id/matches/:matchId/complete')
  @UseGuards(AuthGuard)
  async completeMatch(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() body: { winnerId: string },
  ) {
    const match = await this.prisma.tournamentMatch.findUnique({
      where: { id: matchId },
    });
    if (!match) throw new NotFoundException('Match not found');
    if (match.tournamentId !== id)
      throw new BadRequestException('Match does not belong to this tournament');
    if (match.status === 'COMPLETED')
      throw new BadRequestException('Match already completed');

    // Mark match complete
    await this.prisma.tournamentMatch.update({
      where: { id: matchId },
      data: { winnerId: body.winnerId, status: 'COMPLETED' },
    });

    // Determine total rounds for this tournament
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');
    const count = tournament.participants.length;
    const totalRounds = count >= 8 ? 3 : count >= 4 ? 2 : 1;

    // Advance winner to next round
    if (match.round < totalRounds) {
      const nextRound = match.round + 1;
      const nextMatchIndex = Math.floor(match.matchIndex / 2);
      const slot = match.matchIndex % 2 === 0 ? 'player1Id' : 'player2Id';

      const nextMatch = await this.prisma.tournamentMatch.findFirst({
        where: {
          tournamentId: id,
          round: nextRound,
          matchIndex: nextMatchIndex,
        },
      });

      if (nextMatch) {
        await this.prisma.tournamentMatch.update({
          where: { id: nextMatch.id },
          data: { [slot]: body.winnerId },
        });
      }
    }

    // Check if tournament is complete (all final round matches done)
    const finalMatches = await this.prisma.tournamentMatch.findMany({
      where: { tournamentId: id, round: totalRounds },
    });

    const allFinalDone = finalMatches.every((m) => {
      if (m.id === matchId) return true; // we just completed this one
      return m.status === 'COMPLETED';
    });

    if (allFinalDone && match.round === totalRounds) {
      await this.prisma.tournament.update({
        where: { id },
        data: { status: 'COMPLETED', winnerId: body.winnerId },
      });
    }

    // Return updated tournament
    return this.findOne(id);
  }
}
