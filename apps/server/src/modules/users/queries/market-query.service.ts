import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import {
  BlackMarketData,
  blackMarketKey,
  combatLoadoutKey,
  PROFILE_TTL,
} from '../types';
import { DEFAULT_UNLOCKED_ITEMS } from '../black-market.constants';

@Injectable()
export class MarketQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getBlackMarket(userId: string): Promise<BlackMarketData> {
    const cached = await this.redis.get<BlackMarketData>(
      blackMarketKey(userId),
    );
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
        unlockedItems: true,
        equippedChassis: true,
        equippedPaint: true,
        equippedTracer: true,
      },
    });
    if (!user) throw new Error('USER_NOT_FOUND');

    let unlockedItems = user.unlockedItems;
    const missingDefaults = DEFAULT_UNLOCKED_ITEMS.filter(
      (item) => !unlockedItems.includes(item),
    );

    const needsPaintMigration =
      user.equippedPaint === 'paint-crimson' &&
      !user.unlockedItems.includes('paint-crimson');

    let equippedPaint = user.equippedPaint;

    if (missingDefaults.length > 0 || needsPaintMigration) {
      if (missingDefaults.length > 0) {
        unlockedItems = [...unlockedItems, ...missingDefaults];
      }
      if (needsPaintMigration) {
        equippedPaint = 'paint-default';
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(missingDefaults.length > 0
            ? { unlockedItems: { set: unlockedItems } }
            : {}),
          ...(needsPaintMigration ? { equippedPaint: 'paint-default' } : {}),
        },
      });
    }

    const data = {
      points: user.points,
      unlockedItems,
      equippedChassis: user.equippedChassis,
      equippedPaint,
      equippedTracer: user.equippedTracer,
    };
    await this.redis.set(blackMarketKey(userId), data, PROFILE_TTL);
    await this.redis.set(
      combatLoadoutKey(userId),
      {
        equippedChassis: data.equippedChassis,
        equippedPaint: data.equippedPaint,
        equippedTracer: data.equippedTracer,
      },
      PROFILE_TTL,
    );
    return data;
  }
}
