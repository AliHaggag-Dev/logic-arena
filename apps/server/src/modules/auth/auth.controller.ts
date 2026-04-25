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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

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

/**
 * Auth endpoints are protected by a strict per-IP rate limit:
 *   5 requests per 15 minutes (defined as the "auth" throttler).
 */
@Throttle({ auth: { limit: 5, ttl: 900_000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authRegistrationService: AuthRegistrationService,
    private readonly authLoginService: AuthLoginService,
    private readonly authPasswordService: AuthPasswordService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() body: RegisterDto) {
    return this.authRegistrationService.register(body.email, body.username, body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() body: LoginDto) {
    return this.authLoginService.login(body.username, body.password);
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
    return this.authPasswordService.resetPassword(body.email, body.code, body.newPassword);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @SkipThrottle()
  googleAuth() { }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @SkipThrottle()
  googleCallback(@Req() req: any, @Res() res: Response) {
    const { access_token, userId, username } = req.user;
    const isDev = process.env.NODE_ENV === 'development';
    const clientUrl = isDev ? 'http://localhost:3000' : (process.env.CLIENT_URL || 'https://logicarena.dev');
    res.redirect(
      `${clientUrl}/callback?token=${access_token}&userId=${userId}&username=${username}`
    );
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @SkipThrottle()
  githubAuth() { }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @SkipThrottle()
  githubCallback(@Req() req: any, @Res() res: Response) {
    const { access_token, userId, username } = req.user;
    const isDev = process.env.NODE_ENV === 'development';
    const clientUrl = isDev ? 'http://localhost:3000' : (process.env.CLIENT_URL || 'https://logicarena.dev');
    res.redirect(
      `${clientUrl}/callback?token=${access_token}&userId=${userId}&username=${username}`
    );
  }
}
