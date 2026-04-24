import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { ALLOWED_ROBOT_IDS, COLOR_REGEX, profileKey, loadoutKey, BCRYPT_ROUNDS, PRISMA_UNIQUE_VIOLATION } from './types';

@Injectable()
export class UsersCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async updateLoadout(userId: string, robotId: string, color: string): Promise<void> {
    if (!ALLOWED_ROBOT_IDS.includes(robotId)) {
      throw new Error(`Invalid robotId "${robotId}". Must be one of: ${ALLOWED_ROBOT_IDS.join(', ')}`);
    }
    if (color !== 'DEFAULT' && !COLOR_REGEX.test(color)) {
      throw new Error(`Invalid color "${color}". Must match #rrggbb format or be "DEFAULT".`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data:  { selectedRobotId: robotId, selectedColor: color },
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
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_VIOLATION
      ) {
        const target = (err.meta?.target as string[]) ?? [];
        if (target.includes('username')) throw new ConflictException('Username already taken');
        if (target.includes('email'))    throw new ConflictException('Email already registered');
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
      where:  { id: userId },
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
      data:  { passwordHash: newHash },
    });
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
    await this.redis.del(profileKey(userId), loadoutKey(userId));
  }
}
