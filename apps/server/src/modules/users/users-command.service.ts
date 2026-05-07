import { Injectable, UnauthorizedException, ConflictException, BadRequestException as BadReq, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { CloudinaryService } from '../../common/cloudinary.service';
import { ALLOWED_ROBOT_IDS, COLOR_REGEX, profileKey, loadoutKey, preferencesKey, blackMarketKey, combatLoadoutKey, BCRYPT_ROUNDS, PRISMA_UNIQUE_VIOLATION, ArenaPreferences, NotificationSettings } from './types';
import { AUTH_COOKIE_MAX_AGE_SECONDS, sessionVersionKey } from '../auth/types';
import { BLACK_MARKET_ITEMS, DEFAULT_UNLOCKED_ITEMS, ItemCategory } from './black-market.constants';

@Injectable()
export class UsersCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly cloudinary: CloudinaryService,
  ) { }

  async updateLoadout(userId: string, robotId: string, color: string): Promise<void> {
    if (!ALLOWED_ROBOT_IDS.includes(robotId)) {
      throw new Error(`Invalid robotId "${robotId}". Must be one of: ${ALLOWED_ROBOT_IDS.join(', ')}`);
    }
    if (color !== 'DEFAULT' && !COLOR_REGEX.test(color)) {
      throw new Error(`Invalid color "${color}". Must match #rrggbb format or be "DEFAULT".`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { selectedRobotId: robotId, selectedColor: color },
    });

    await this.redis.del(profileKey(userId), loadoutKey(userId));
  }

  async updateIdentity(
    userId: string,
    data: { username?: string; email?: string },
  ): Promise<void> {
    if (!data.username && !data.email) return;
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data,
      });
      await this.redis.del(profileKey(userId), loadoutKey(userId));
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_VIOLATION
      ) {
        const target = (err.meta?.target as string[]) ?? [];
        if (target.includes('username')) throw new ConflictException('Username already taken');
        if (target.includes('email')) throw new ConflictException('Email already registered');
      }
      throw err;
    }
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Account uses OAuth — password cannot be changed here');
    }
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    await this.redis.incr(sessionVersionKey(userId), AUTH_COOKIE_MAX_AGE_SECONDS);
  }

  async updateArenaPreferences(
    userId: string,
    prefs: Partial<ArenaPreferences>,
  ): Promise<void> {
    if (prefs.defaultRobot !== undefined && !ALLOWED_ROBOT_IDS.includes(prefs.defaultRobot)) {
      throw new Error(`Invalid defaultRobot "${prefs.defaultRobot}". Must be one of: ${ALLOWED_ROBOT_IDS.join(', ')}`);
    }
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { arenaPreferences: true },
    });
    const merged = { ...(current?.arenaPreferences as unknown as ArenaPreferences ?? {}), ...prefs };
    await this.prisma.user.update({
      where: { id: userId },
      data: { arenaPreferences: merged },
    });
    await this.redis.del(profileKey(userId), preferencesKey(userId));
  }

  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>,
  ): Promise<void> {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true },
    });
    const merged = { ...(current?.notificationSettings as unknown as NotificationSettings ?? {}), ...settings };
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationSettings: merged },
    });
    await this.redis.del(profileKey(userId), preferencesKey(userId));
  }

  async deleteAccount(userId: string, confirmation: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.username !== confirmation) {
      throw new UnauthorizedException('Confirmation mismatch');
    }

    await this.prisma.user.delete({ where: { id: userId } });
    await this.redis.del(profileKey(userId), loadoutKey(userId));
  }

  // ── Avatar Upload ──────────────────────────────────────────────────────────

  async uploadAvatar(userId: string, buffer: Buffer): Promise<string> {
    const url = await this.cloudinary.uploadAvatar(buffer, userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });
    await this.redis.del(profileKey(userId));
    return url;
  }

  // ── Black Market ────────────────────────────────────────────────────────────

  async purchaseItem(userId: string, itemId: string): Promise<void> {
    const catalogItem = BLACK_MARKET_ITEMS.find((i) => i.id === itemId);
    if (!catalogItem) throw new BadReq('Item does not exist in the catalog');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, unlockedItems: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const effectiveOwned = [
      ...user.unlockedItems,
      ...DEFAULT_UNLOCKED_ITEMS,
    ];
    if (effectiveOwned.includes(itemId)) {
      throw new ConflictException('Item already owned');
    }
    if (user.points < catalogItem.price) {
      throw new BadReq('Insufficient points');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        points: { decrement: catalogItem.price },
        unlockedItems: { push: itemId },
      },
    });
    await this.redis.del(profileKey(userId), blackMarketKey(userId));
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

    const effectiveOwned = [
      ...user.unlockedItems,
      ...DEFAULT_UNLOCKED_ITEMS,
    ];
    if (!effectiveOwned.includes(itemId)) {
      throw new BadReq('Item not owned — purchase it first');
    }

    const fieldMap: Record<ItemCategory, 'equippedChassis' | 'equippedPaint' | 'equippedTracer'> = {
      chassis: 'equippedChassis',
      paint: 'equippedPaint',
      tracer: 'equippedTracer',
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { [fieldMap[category]]: itemId },
    });
    await this.redis.del(profileKey(userId), loadoutKey(userId), blackMarketKey(userId), combatLoadoutKey(userId));
  }
}
