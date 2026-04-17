import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { LoginDto, LoginSchema, RegisterDto, RegisterSchema } from './auth.dto';
import { AuthService } from './auth.service';

/**
 * Auth endpoints are protected by a strict per-IP rate limit:
 *   5 requests per 15 minutes (defined as the "auth" throttler).
 */
@Throttle({ auth: { limit: 5, ttl: 900_000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.username, body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }
}