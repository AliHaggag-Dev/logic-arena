import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';
import { BCRYPT_ROUNDS } from './types';

@Injectable()
export class AuthPasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true }; // don't leak user existence
    
    const resetCode = randomInt(100000, 999999).toString();
    const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetCode, resetExpiry },
    });

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
    if (!user || user.resetCode !== code || !user.resetExpiry || user.resetExpiry < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetCode: null, resetExpiry: null },
    });
    return { success: true };
  }
}
