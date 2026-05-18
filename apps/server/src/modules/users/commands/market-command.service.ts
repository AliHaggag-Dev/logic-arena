import {
  Injectable,
  ConflictException,
  BadRequestException as BadReq,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import {
  profileKey,
  loadoutKey,
  blackMarketKey,
  combatLoadoutKey,
} from '../types';
import {
  BLACK_MARKET_ITEMS,
  DEFAULT_UNLOCKED_ITEMS,
  ItemCategory,
} from '../black-market.constants';

@Injectable()
export class MarketCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async purchaseItem(userId: string, itemId: string): Promise<void> {
    const catalogItem = BLACK_MARKET_ITEMS.find((i) => i.id === itemId);
    if (!catalogItem) throw new BadReq('Item does not exist in the catalog');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, unlockedItems: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const effectiveOwned = [...user.unlockedItems, ...DEFAULT_UNLOCKED_ITEMS];
    if (effectiveOwned.includes(itemId)) {
      throw new ConflictException('Item already owned');
    }
    if (user.points < catalogItem.price) {
      throw new BadReq('Insufficient points');
    }

    const updateResult = await this.prisma.user.updateMany({
      where: {
        id: userId,
        points: { gte: catalogItem.price },
        NOT: { unlockedItems: { has: itemId } },
      },
      data: {
        points: { decrement: catalogItem.price },
        unlockedItems: { push: itemId },
      },
    });

    if (updateResult.count === 0) {
      throw new ConflictException(
        'Item purchase could not be completed — retry with latest wallet state',
      );
    }

    await this.redis.del(
      profileKey(userId),
      blackMarketKey(userId),
      combatLoadoutKey(userId),
    );
  }

  async equipItem(
    userId: string,
    itemId: string,
    category: ItemCategory,
  ): Promise<void> {
    const catalogItem = BLACK_MARKET_ITEMS.find(
      (i) => i.id === itemId && i.category === category,
    );
    if (!catalogItem) throw new BadReq('Item does not exist for this category');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { unlockedItems: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const effectiveOwned = [...user.unlockedItems, ...DEFAULT_UNLOCKED_ITEMS];
    if (!effectiveOwned.includes(itemId)) {
      throw new BadReq('Item not owned — purchase it first');
    }

    const fieldMap: Record<
      ItemCategory,
      'equippedChassis' | 'equippedPaint' | 'equippedTracer'
    > = {
      chassis: 'equippedChassis',
      paint: 'equippedPaint',
      tracer: 'equippedTracer',
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { [fieldMap[category]]: itemId },
    });
    await this.redis.del(
      profileKey(userId),
      loadoutKey(userId),
      blackMarketKey(userId),
      combatLoadoutKey(userId),
    );
  }
}
