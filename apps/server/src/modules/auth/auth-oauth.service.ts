import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../common/prisma.service';
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  JwtPayload,
} from './types';

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
      // Check if email already exists — if so, link the OAuth provider to it
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
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
        // Create new user — ensure username is unique
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

    // Build a signed token — but we do NOT return it; the controller sets it as
    // an HttpOnly cookie so it is never exposed to JavaScript.
    const payload: JwtPayload = { sub: user.id, username: user.username };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    return { token, userId: user.id, username: user.username };
  }

  /**
   * Writes the JWT into an HttpOnly cookie and redirects the user to the
   * dashboard without ever embedding the token in the redirect URL.
   */
  setSessionCookieAndRedirect(
    res: Response,
    token: string,
    userId: string,
    username: string,
  ): void {
    const isProd = process.env.NODE_ENV === 'production';
    const clientUrl = isProd
      ? (process.env.CLIENT_URL ?? 'https://logicarena.dev')
      : 'http://localhost:3000';

    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure:   isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge:   AUTH_COOKIE_MAX_AGE_SECONDS * 1_000,
      path:     '/',
    });

    // Pass only non-sensitive identity info in the URL so the client can
    // hydrate its UI state (username display etc.) without touching the token.
    res.redirect(
      `${clientUrl}/callback?userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}`,
    );
  }
}
