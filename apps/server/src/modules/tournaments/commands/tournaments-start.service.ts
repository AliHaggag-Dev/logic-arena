import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';

const LIST_CACHE_KEY = 'tournaments:list';
const tournamentKey = (id: string) => `tournament:${id}`;

@Injectable()
export class TournamentsStartService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async start(id: string, userId: string) {
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
        'Need exactly 2, 4 or 8 participants to start',
      );

    const shuffled = [...tournament.participants].sort(
      () => Math.random() - 0.5,
    );
    const p = (i: number): string | null => shuffled[i]?.id ?? null;

    type MatchCreateInput = {
      tournamentId: string;
      round: number;
      matchIndex: number;
      player1Id?: string | null;
      player2Id?: string | null;
      status: string;
    };
    const matchData: MatchCreateInput[] = [];

    if (count >= 8) {
      for (let i = 0; i < 4; i++) {
        matchData.push({
          tournamentId: id,
          round: 1,
          matchIndex: i,
          player1Id: p(i * 2),
          player2Id: p(i * 2 + 1),
          status: 'PENDING',
        });
      }
      for (let i = 0; i < 2; i++) {
        matchData.push({
          tournamentId: id,
          round: 2,
          matchIndex: i,
          status: 'PENDING',
        });
      }
      matchData.push({
        tournamentId: id,
        round: 3,
        matchIndex: 0,
        status: 'PENDING',
      });
    } else if (count >= 4) {
      for (let i = 0; i < 2; i++) {
        matchData.push({
          tournamentId: id,
          round: 1,
          matchIndex: i,
          player1Id: p(i * 2),
          player2Id: p(i * 2 + 1),
          status: 'PENDING',
        });
      }
      matchData.push({
        tournamentId: id,
        round: 2,
        matchIndex: 0,
        status: 'PENDING',
      });
    } else {
      matchData.push({
        tournamentId: id,
        round: 1,
        matchIndex: 0,
        player1Id: p(0),
        player2Id: p(1),
        status: 'PENDING',
      });
    }

    await this.prisma.tournamentMatch.createMany({ data: matchData });

    const updated = await this.prisma.tournament.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
      include: {
        participants: true,
        matches: { orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }] },
      },
    });

    await this.redis.del(tournamentKey(id), LIST_CACHE_KEY);
    return updated;
  }
}
