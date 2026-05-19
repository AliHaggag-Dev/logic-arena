import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../modules/auth/types';

const ADMIN_ROLE = 'ADMIN' as const;

/**
 * Role guard that must be applied **after** AuthGuard.
 * AuthGuard verifies the JWT and attaches the decoded payload to
 * `request.user`; AdminGuard then checks that the payload carries
 * `role === 'ADMIN'`, rejecting all other authenticated users with 403.
 *
 * Usage:
 *   @UseGuards(AuthGuard, AdminGuard)
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload | undefined;

    if (user?.role !== ADMIN_ROLE) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
