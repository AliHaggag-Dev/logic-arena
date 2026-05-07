import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { TournamentsQueryService } from './tournaments-query.service';

const LIST_CACHE_KEY = 'tournaments:list';
const tournamentKey = (id: string) => `tournament:${id}`;

@Injectable()
export class TournamentsCommandService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private queryService: TournamentsQueryService,
  ) { }

  async create(name: string, userId: string) {
    const tournament = await this.prisma.tournament.create({
      data: {
        name,
        creatorId: userId,
        participants: { connect: { id: userId } },
      },
      include: { participants: true, matches: true },
    });
    // Bust the list cache so new tournament appears immediately
    await this.redis.del(LIST_CACHE_KEY);
    return tournament;
  }

  async join(id: string, userId: string) {
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

    // Invalidate both caches
    await this.redis.del(tournamentKey(id), LIST_CACHE_KEY);
    return updated;
  }

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
      throw new BadRequestException('Need exactly 2, 4 or 8 participants to start');

    // Shuffle participants
    const shuffled = [...tournament.participants].sort(() => Math.random() - 0.5);
    const p = (i: number): string | null => shuffled[i]?.id ?? null;

    // Build all match rows up front, then insert in one batch
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
      // ── 8-player: 4 quarters → 2 semis → 1 final ──
      for (let i = 0; i < 4; i++) {
        matchData.push({
          tournamentId: id, round: 1, matchIndex: i,
          player1Id: p(i * 2), player2Id: p(i * 2 + 1), status: 'PENDING',
        });
      }
      for (let i = 0; i < 2; i++) {
        matchData.push({ tournamentId: id, round: 2, matchIndex: i, status: 'PENDING' });
      }
      matchData.push({ tournamentId: id, round: 3, matchIndex: 0, status: 'PENDING' });
    } else if (count >= 4) {
      // ── 4-player: 2 semis → 1 final ──
      for (let i = 0; i < 2; i++) {
        matchData.push({
          tournamentId: id, round: 1, matchIndex: i,
          player1Id: p(i * 2), player2Id: p(i * 2 + 1), status: 'PENDING',
        });
      }
      matchData.push({ tournamentId: id, round: 2, matchIndex: 0, status: 'PENDING' });
    } else {
      // ── 2-player: single final ──
      matchData.push({
        tournamentId: id, round: 1, matchIndex: 0,
        player1Id: p(0), player2Id: p(1), status: 'PENDING',
      });
    }

    // FIX 11: batch create instead of sequential awaits
    await this.prisma.tournamentMatch.createMany({ data: matchData });

    const updated = await this.prisma.tournament.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
      include: {
        participants: true,
        matches: { orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }] },
      },
    });

    // Invalidate both caches
    await this.redis.del(tournamentKey(id), LIST_CACHE_KEY);
    return updated;
  }

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
        throw new BadRequestException('Match does not belong to this tournament');
      if (match.status === 'COMPLETED')
        throw new BadRequestException('Match already completed');

      // FIX 1: requester must be a participant in this specific match
      if (match.player1Id !== requesterId && match.player2Id !== requesterId)
        throw new ForbiddenException('You are not a participant in this match');

      // FIX 1: winnerId must be one of the two match participants
      if (winnerId !== match.player1Id && winnerId !== match.player2Id)
        throw new BadRequestException('Winner must be a participant in this match');

      // Mark match complete with a status guard for concurrent requests.
      const completed = await tx.tournamentMatch.updateMany({
        where: { id: matchId, status: { not: 'COMPLETED' } },
        data: { winnerId, status: 'COMPLETED' },
      });
      if (completed.count === 0) throw new BadRequestException('Match already completed');

      // Determine total rounds for this tournament
      const tournament = await tx.tournament.findUnique({
        where: { id },
        select: { participants: { select: { id: true } } },
      });
      if (!tournament) throw new NotFoundException('Tournament not found');
      const count = tournament.participants.length;
      const totalRounds = count >= 8 ? 3 : count >= 4 ? 2 : 1;

      // Advance winner to next round
      if (match.round < totalRounds) {
        const nextRound = match.round + 1;
        const nextMatchIndex = Math.floor(match.matchIndex / 2);
        const slot = match.matchIndex % 2 === 0 ? 'player1Id' : 'player2Id';

        const nextMatch = await tx.tournamentMatch.findFirst({
          where: { tournamentId: id, round: nextRound, matchIndex: nextMatchIndex },
          select: { id: true },
        });

        if (nextMatch) {
          await tx.tournamentMatch.update({
            where: { id: nextMatch.id },
            data: { [slot]: winnerId },
          });
        }
      }

      // Check if tournament is complete (all final round matches done)
      const finalMatches = await tx.tournamentMatch.findMany({
        where: { tournamentId: id, round: totalRounds },
        select: { id: true, status: true },
      });

      const allFinalDone = finalMatches.every((m) => {
        if (m.id === matchId) return true; // we just completed this one
        return m.status === 'COMPLETED';
      });

      if (allFinalDone && match.round === totalRounds) {
        await tx.tournament.update({
          where: { id },
          data: { status: 'COMPLETED', winnerId },
        });
      }
    });

    // Invalidate both caches
    await this.redis.del(tournamentKey(id), LIST_CACHE_KEY);

    return this.queryService.findOne(id);
  }
}
