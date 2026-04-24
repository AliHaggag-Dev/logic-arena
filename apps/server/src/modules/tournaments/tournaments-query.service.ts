import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class TournamentsQueryService {
  constructor(private prisma: PrismaService) {}

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

  async findOne(id: string) {
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
}
