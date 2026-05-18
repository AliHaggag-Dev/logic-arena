import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import { TournamentsQueryService } from '../tournaments-query.service';

const LIST_CACHE_KEY = 'tournaments:list';
const tournamentKey = (id: string) => `tournament:${id}`;

@Injectable()
export class TournamentsCompleteService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private queryService: TournamentsQueryService,
  ) {}

  async completeMatch(
    id: string,
    matchId: string,
    winnerId: string,
    requesterId: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const match = await tx.tournamentMatch.findUnique({
        where: { id: matchId },
      });
      if (!match) throw new NotFoundException('Match not found');
      if (match.tournamentId !== id)
        throw new BadRequestException(
          'Match does not belong to this tournament',
        );
      if (match.status === 'COMPLETED')
        throw new BadRequestException('Match already completed');

      if (match.player1Id !== requesterId && match.player2Id !== requesterId)
        throw new ForbiddenException('You are not a participant in this match');

      if (winnerId !== match.player1Id && winnerId !== match.player2Id)
        throw new BadRequestException(
          'Winner must be a participant in this match',
        );

      const completed = await tx.tournamentMatch.updateMany({
        where: { id: matchId, status: { not: 'COMPLETED' } },
        data: { winnerId, status: 'COMPLETED' },
      });
      if (completed.count === 0)
        throw new BadRequestException('Match already completed');

      const tournament = await tx.tournament.findUnique({
        where: { id },
        select: { participants: { select: { id: true } } },
      });
      if (!tournament) throw new NotFoundException('Tournament not found');
      const count = tournament.participants.length;
      const totalRounds = count >= 8 ? 3 : count >= 4 ? 2 : 1;

      if (match.round < totalRounds) {
        const nextRound = match.round + 1;
        const nextMatchIndex = Math.floor(match.matchIndex / 2);
        const slot = match.matchIndex % 2 === 0 ? 'player1Id' : 'player2Id';

        const nextMatch = await tx.tournamentMatch.findFirst({
          where: {
            tournamentId: id,
            round: nextRound,
            matchIndex: nextMatchIndex,
          },
          select: { id: true },
        });

        if (nextMatch) {
          await tx.tournamentMatch.update({
            where: { id: nextMatch.id },
            data: { [slot]: winnerId },
          });
        }
      }

      const finalMatches = await tx.tournamentMatch.findMany({
        where: { tournamentId: id, round: totalRounds },
        select: { id: true, status: true },
      });

      const allFinalDone = finalMatches.every((m) => {
        if (m.id === matchId) return true;
        return m.status === 'COMPLETED';
      });

      if (allFinalDone && match.round === totalRounds) {
        await tx.tournament.update({
          where: { id },
          data: { status: 'COMPLETED', winnerId },
        });
      }
    });

    await this.redis.del(tournamentKey(id), LIST_CACHE_KEY);

    return this.queryService.findOne(id);
  }
}
