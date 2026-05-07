import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';
import { RedisService } from '../../common/redis.service';
import { BCRYPT_ROUNDS } from './types';

const AUTH_CODE_TTL_SECONDS = 15 * 60;
const resetCodeKey = (email: string) => `auth:reset:${email.toLowerCase()}`;

@Injectable()
export class AuthPasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly redis: RedisService,
  ) {}

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true }; // don't leak user existence

    const resetCode = randomInt(100000, 999999).toString();
    await this.redis.set(resetCodeKey(email), resetCode, AUTH_CODE_TTL_SECONDS);

    try {
      await this.emailService.sendResetCode(email, resetCode);
    } catch (emailErr: any) {
      throw new InternalServerErrorException(
        `Reset code saved but email delivery failed: ${emailErr.message}`,
      );
    }
    return { success: true };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const redisCode = await this.redis.get<string>(resetCodeKey(email));
    const legacyDbCodeIsValid =
      user?.resetCode === code &&
      !!user.resetExpiry &&
      user.resetExpiry >= new Date();

    if (!user || (redisCode !== code && !legacyDbCodeIsValid)) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetCode: null, resetExpiry: null },
    });
    await this.redis.del(resetCodeKey(email));
    return { success: true };
  }
}
