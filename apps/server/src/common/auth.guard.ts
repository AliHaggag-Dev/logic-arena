import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { AUTH_COOKIE_NAME, JwtPayload } from '../modules/auth/types';

/**
 * HTTP guard that authenticates requests via:
 *  1. HttpOnly cookie `la_session`  ← primary path (XSS-proof)
 *  2. Authorization: Bearer <token> ← fallback for server-to-server / Swagger
 *
 * WebSocket authentication (match.gateway.ts) uses the WS handshake auth
 * object which carries the token from the client's socket.io connection.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('No valid session');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Server misconfiguration');
    }

    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Session expired or invalid');
    }
  }

  private extractToken(request: Request): string | undefined {
    // ── 1. HttpOnly cookie (preferred) ──────────────────────────────────────
    const cookieToken = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
    if (cookieToken) return cookieToken;

    // ── 2. Authorization header fallback (server-to-server / WS upgrade) ───
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return undefined;
  }
}