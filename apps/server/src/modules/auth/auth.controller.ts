import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import * as jwt from 'jsonwebtoken';

import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import {
  LoginDto,
  LoginSchema,
  RegisterDto,
  RegisterSchema,
  VerifyEmailDto,
  VerifyEmailSchema,
  ForgotPasswordDto,
  ForgotPasswordSchema,
  ResetPasswordDto,
  ResetPasswordSchema,
} from './auth.dto';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthLoginService } from './auth-login.service';
import { AuthPasswordService } from './auth-password.service';
import { AuthOAuthService } from './auth-oauth.service';
import { RedisService } from '../../common/redis.service';
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  JwtPayload,
  sessionVersionKey,
} from './types';

/**
 * Auth endpoints are protected by a strict per-IP rate limit:
 *   50 requests per 15 minutes (defined as the "auth" throttler in AppModule).
 */
@Throttle({ auth: { limit: 50, ttl: 900_000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authRegistrationService: AuthRegistrationService,
    private readonly authLoginService: AuthLoginService,
    private readonly authPasswordService: AuthPasswordService,
    private readonly authOAuthService: AuthOAuthService,
    private readonly redis: RedisService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() body: RegisterDto) {
    return this.authRegistrationService.register(
      body.email,
      body.username,
      body.password,
    );
  }

  /**
   * Sets an HttpOnly JWT cookie on success.
   * Returns only { userId, username } — the raw token never reaches the client JS.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authLoginService.login(body.username, body.password, res);
  }

  /**
   * Clears the session cookie. The browser can call this from a regular
   * fetch — no JS ever needs to touch the token.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
    const secret = process.env.JWT_SECRET;
    if (token && secret) {
      try {
        const payload = jwt.verify(token, secret) as JwtPayload;
        await this.redis.incr(
          sessionVersionKey(payload.sub),
          AUTH_COOKIE_MAX_AGE_SECONDS,
        );
      } catch {
        /* ignore invalid/expired token during logout */
      }
    }
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return { message: 'Logged out' };
  }

  /**
   * Validates the cookie and returns safe identity data.
   * Used by the client on page load to check if a session is active.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async me(@Req() req: Request) {
    const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
    if (!token) throw new UnauthorizedException('No session');

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('Server misconfiguration');

    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      const currentSessionVersion = await this.redis.get<number>(
        sessionVersionKey(payload.sub),
      );
      if ((currentSessionVersion ?? 0) !== (payload.sessionVersion ?? 0)) {
        throw new UnauthorizedException('Session expired');
      }
      return { userId: payload.sub, username: payload.username };
    } catch {
      throw new UnauthorizedException('Session expired');
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(VerifyEmailSchema))
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authRegistrationService.verifyEmail(body.email, body.code);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authPasswordService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authPasswordService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────
  // These initiating endpoints skip throttle — they redirect to the provider
  // and the callback rate is implicitly limited by the provider itself.

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @SkipThrottle()
  googleAuth() {
    /* Passport redirects */
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @SkipThrottle()
  googleCallback(
    @Req()
    req: Request & {
      user: { token: string; userId: string; username: string };
    },
    @Res() res: Response,
  ) {
    const { token, userId, username } = req.user;
    this.authOAuthService.setSessionCookieAndRedirect(
      res,
      token,
      userId,
      username,
    );
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @SkipThrottle()
  githubAuth() {
    /* Passport redirects */
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @SkipThrottle()
  githubCallback(
    @Req()
    req: Request & {
      user: { token: string; userId: string; username: string };
    },
    @Res() res: Response,
  ) {
    const { token, userId, username } = req.user;
    this.authOAuthService.setSessionCookieAndRedirect(
      res,
      token,
      userId,
      username,
    );
  }
}
