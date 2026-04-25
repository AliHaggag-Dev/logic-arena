import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AuthLoginService {
  constructor(private readonly prisma: PrismaService) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });

    // Use a constant-time compare even when user doesn't exist to prevent
    // timing-based user enumeration attacks.
    const dummyHash =
      '$2b$12$invalidhashfortimingprotectionxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const hash = user?.passwordHash ?? dummyHash;
    const isValid = await bcrypt.compare(password, hash);

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('Server misconfiguration');
    }

    const payload = { username: user.username, sub: user.id };
    return {
      accessToken: jwt.sign(payload, secret, { expiresIn: '1h' }),
    };
  }
}
