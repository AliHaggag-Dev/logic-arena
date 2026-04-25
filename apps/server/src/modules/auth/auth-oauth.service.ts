import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AuthOAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateOAuthUser(data: {
    provider: string;
    providerId: string;
    email: string;
    username: string;
    avatarUrl?: string;
  }) {
    const providerField = data.provider === 'google' ? 'googleId' : 'githubId';
    
    // Check if user exists with this provider ID
    let user = await this.prisma.user.findFirst({
      where: { [providerField]: data.providerId },
    });

    if (!user) {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        // Link OAuth to existing account
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            [providerField]: data.providerId,
            avatarUrl: data.avatarUrl,
            provider: data.provider,
            isVerified: true,
          },
        });
      } else {
        // Create new user
        let username = data.username;
        const existing = await this.prisma.user.findUnique({ where: { username } });
        if (existing) username = `${username}_${Date.now()}`;

        user = await this.prisma.user.create({
          data: {
            email: data.email,
            username,
            passwordHash: null,
            [providerField]: data.providerId,
            avatarUrl: data.avatarUrl,
            provider: data.provider,
            isVerified: true,
          },
        });
      }
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('Server misconfiguration');
    }

    // Return JWT
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: jwt.sign(payload, secret, { expiresIn: '1h' }),
      userId: user.id,
      username: user.username,
    };
  }
}
