import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';

const LIST_CACHE_KEY = 'tournaments:list';
const tournamentKey = (id: string) => `tournament:${id}`;

@Injectable()
export class TournamentsJoinService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

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

    await this.redis.del(tournamentKey(id), LIST_CACHE_KEY);
    return updated;
  }
}
