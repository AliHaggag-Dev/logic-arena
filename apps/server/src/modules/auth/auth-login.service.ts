import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../common/prisma.service';
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  JwtPayload,
} from './types';

@Injectable()
export class AuthLoginService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates credentials and sets an HttpOnly, Secure, SameSite=Strict cookie.
   * Returns only non-sensitive session metadata (userId, username) as JSON —
   * the actual JWT is never exposed to JavaScript running in the browser.
   */
  async login(username: string, password: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { username } });

    // Constant-time compare even when user doesn't exist to prevent
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

    const payload: JwtPayload = { sub: user.id, username: user.username };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    // ── Set HttpOnly cookie — JS cannot read this ─────────────────────────
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,                   // Not accessible via document.cookie
      secure:   isProd,                 // HTTPS-only in production
      sameSite: isProd ? 'strict' : 'lax', // 'strict' in prod; 'lax' for local dev
      maxAge:   AUTH_COOKIE_MAX_AGE_SECONDS * 1_000, // ms
      path:     '/',
    });

    // Return only safe identity data — never the raw token
    return { userId: user.id, username: user.username };
  }
}
