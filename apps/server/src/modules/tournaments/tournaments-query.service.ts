import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';

const LIST_CACHE_KEY = 'tournaments:list';
const LIST_TTL = 10;       // seconds — matches client poll interval
const DETAIL_TTL = 10;     // seconds — matches client poll interval
const tournamentKey = (id: string) => `tournament:${id}`;

@Injectable()
export class TournamentsQueryService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll() {
    // FIX 3: cache the list regardless of auth — tournament data is public
    const cached = await this.redis.get<unknown>(LIST_CACHE_KEY);
    if (cached !== null) return cached;

    const tournaments = await this.prisma.tournament.findMany({
      include: {
        participants: { select: { id: true, username: true } },
        creator: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(LIST_CACHE_KEY, tournaments, LIST_TTL);
    return tournaments;
  }

  async findOne(id: string) {
    // FIX 3: cache-aside — serve from Redis when available
    const cached = await this.redis.get<unknown>(tournamentKey(id));
    if (cached !== null) return cached;

    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: { select: { id: true, username: true } },
        creator: { select: { id: true, username: true } },
        matches: { orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }] },
      },
    });
    if (!tournament) throw new NotFoundException('Tournament not found');

    // FIX 2: Collect all unique player IDs — one batch fetch instead of N+1
    const playerIds = new Set<string>();
    for (const m of tournament.matches) {
      if (m.player1Id) playerIds.add(m.player1Id);
      if (m.player2Id) playerIds.add(m.player2Id);
      if (m.winnerId)  playerIds.add(m.winnerId);
    }

    const users =
      playerIds.size > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: [...playerIds] } },
            select: { id: true, username: true },
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedMatches = tournament.matches.map((m) => ({
      ...m,
      player1: m.player1Id ? (userMap.get(m.player1Id) ?? null) : null,
      player2: m.player2Id ? (userMap.get(m.player2Id) ?? null) : null,
      winner:  m.winnerId  ? (userMap.get(m.winnerId)  ?? null) : null,
    }));

    const result = { ...tournament, matches: enrichedMatches };
    await this.redis.set(tournamentKey(id), result, DETAIL_TTL);
    return result;
  }
}
