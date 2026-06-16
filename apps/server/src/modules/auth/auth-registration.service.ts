import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';
import { RedisService } from '../../common/redis.service';
import { BCRYPT_ROUNDS, PRISMA_UNIQUE_VIOLATION } from './types';

const AUTH_CODE_TTL_SECONDS = 15 * 60;
const verifyCodeKey = (email: string) => `auth:verify:${email.toLowerCase()}`;

@Injectable()
export class AuthRegistrationService {
  private readonly logger = new Logger(AuthRegistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly redis: RedisService,
  ) {}

  async register(email: string, username: string, password: string) {
    username = username.trim();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verifyCode = randomInt(100000, 999999).toString();

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          isVerified: false,
          RobotScript: {
            create: {
              title: 'Default Logic',
              content: `// Write your robot logic here\n`,
            },
          },
        },
      });

      await this.redis.set(
        verifyCodeKey(email),
        verifyCode,
        AUTH_CODE_TTL_SECONDS,
      );

      try {
        await this.emailService.sendVerificationCode(email, verifyCode);
      } catch (emailErr: any) {
        const msg = emailErr?.message ?? String(emailErr);
        if (msg.toLowerCase().includes('invalid')) {
          throw new BadRequestException(
            "This email address doesn't exist. Please check and try again.",
          );
        }
        this.logger.error('Email delivery failed:', emailErr);
        throw new InternalServerErrorException(
          'Account created but verification email could not be sent. Please try again later.',
        );
      }
      return this.stripPassword(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_VIOLATION
      ) {
        const target = (error.meta?.target as string[]) ?? [];
        if (target.includes('username')) {
          throw new ConflictException('Username already taken');
        }
        if (target.includes('email')) {
          throw new ConflictException('Email already registered');
        }
        throw new ConflictException('Account already exists');
      }
      throw error;
    }
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const redisCode = await this.redis.get<string>(verifyCodeKey(email));
    const legacyDbCodeIsValid =
      user?.verifyCode === code &&
      !!user.verifyExpiry &&
      user.verifyExpiry >= new Date();

    if (!user || (redisCode !== code && !legacyDbCodeIsValid)) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyCode: null, verifyExpiry: null },
    });
    await this.redis.del(verifyCodeKey(email));
    return { success: true };
  }

  private stripPassword(user: User): Omit<User, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _removed, ...safe } = user;
    return safe;
  }
}
