import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';

const LIST_CACHE_KEY = 'tournaments:list';

@Injectable()
export class TournamentsCreateService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(name: string, userId: string) {
    const tournament = await this.prisma.tournament.create({
      data: {
        name,
        creatorId: userId,
        participants: { connect: { id: userId } },
      },
      include: { participants: true, matches: true },
    });
    await this.redis.del(LIST_CACHE_KEY);
    return tournament;
  }
}
