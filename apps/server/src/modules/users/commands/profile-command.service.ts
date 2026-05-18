import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import { CloudinaryService } from '../../../common/cloudinary.service';
import {
  ALLOWED_ROBOT_IDS,
  COLOR_REGEX,
  profileKey,
  loadoutKey,
  leaderboardSnapshotKey,
  leaderboardRankKey,
  BCRYPT_ROUNDS,
  PRISMA_UNIQUE_VIOLATION,
} from '../types';
import { AUTH_COOKIE_MAX_AGE_SECONDS, sessionVersionKey } from '../../auth/types';
import { campaignVersionKey } from '../../campaign/campaign.service';

@Injectable()
export class ProfileCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private async invalidateLeaderboardCaches(): Promise<void> {
    await this.redis.del(leaderboardSnapshotKey, leaderboardRankKey);
  }

  async updateLoadout(
    userId: string,
    robotId: string,
    color: string,
  ): Promise<void> {
    if (!ALLOWED_ROBOT_IDS.includes(robotId)) {
      throw new Error(
        `Invalid robotId "${robotId}". Must be one of: ${ALLOWED_ROBOT_IDS.join(', ')}`,
      );
    }
    if (color !== 'DEFAULT' && !COLOR_REGEX.test(color)) {
      throw new Error(
        `Invalid color "${color}". Must match #rrggbb format or be "DEFAULT".`,
      );
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
      await this.invalidateLeaderboardCaches();
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_VIOLATION
      ) {
        const target = (err.meta?.target as string[]) ?? [];
        if (target.includes('username'))
          throw new ConflictException('Username already taken');
        if (target.includes('email'))
          throw new ConflictException('Email already registered');
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
      throw new UnauthorizedException(
        'Account uses OAuth — password cannot be changed here',
      );
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
    await this.redis.incr(
      sessionVersionKey(userId),
      AUTH_COOKIE_MAX_AGE_SECONDS,
    );
    await this.redis.del(profileKey(userId));
  }

  async uploadAvatar(userId: string, buffer: Buffer): Promise<string> {
    const url = await this.cloudinary.uploadAvatar(buffer, userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });
    await this.redis.del(profileKey(userId));
    await this.invalidateLeaderboardCaches();
    return url;
  }

  async deleteAccount(userId: string, confirmation: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.username !== confirmation) {
      throw new UnauthorizedException('Confirmation mismatch');
    }

    await this.prisma.user.delete({ where: { id: userId } });
    await this.redis.del(
      profileKey(userId),
      loadoutKey(userId),
    );
    await this.invalidateLeaderboardCaches();
    await this.redis.del(sessionVersionKey(userId));
    await this.redis.delPattern(`script:${userId}:*`);
    await this.redis.del(`scripts:list:${userId}`);
    await this.redis.del(campaignVersionKey(userId));
  }
}
