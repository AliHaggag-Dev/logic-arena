import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';
import { BCRYPT_ROUNDS, PRISMA_UNIQUE_VIOLATION } from './types';

@Injectable()
export class AuthRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async register(email: string, username: string, password: string) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verifyCode = randomInt(100000, 999999).toString();
    const verifyExpiry = new Date(Date.now() + 15 * 60 * 1000);

    try {
      const user = await this.prisma.user.create({
        data: { email, username, passwordHash, isVerified: false, verifyCode, verifyExpiry },
      });

      try {
        await this.emailService.sendVerificationCode(email, verifyCode);
      } catch (emailErr: any) {
        throw new InternalServerErrorException(
          `Account created but verification email failed: ${emailErr.message}`,
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
    if (!user || user.verifyCode !== code || !user.verifyExpiry || user.verifyExpiry < new Date()) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyCode: null, verifyExpiry: null },
    });
    return { success: true };
  }

  private stripPassword(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _removed, ...safe } = user;
    return safe;
  }
}
