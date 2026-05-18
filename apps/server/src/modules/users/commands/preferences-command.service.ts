import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import {
  ALLOWED_ROBOT_IDS,
  ArenaPreferences,
  NotificationSettings,
  profileKey,
  preferencesKey,
} from '../types';

@Injectable()
export class PreferencesCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async updateArenaPreferences(
    userId: string,
    prefs: Partial<ArenaPreferences>,
  ): Promise<void> {
    if (
      prefs.defaultRobot !== undefined &&
      !ALLOWED_ROBOT_IDS.includes(prefs.defaultRobot)
    ) {
      throw new Error(
        `Invalid defaultRobot "${prefs.defaultRobot}". Must be one of: ${ALLOWED_ROBOT_IDS.join(', ')}`,
      );
    }
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { arenaPreferences: true },
    });
    const merged = {
      ...((current?.arenaPreferences as unknown as ArenaPreferences) ?? {}),
      ...prefs,
    };
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
    const merged = {
      ...((current?.notificationSettings as unknown as NotificationSettings) ??
        {}),
      ...settings,
    };
    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationSettings: merged },
    });
    await this.redis.del(profileKey(userId), preferencesKey(userId));
  }
}
