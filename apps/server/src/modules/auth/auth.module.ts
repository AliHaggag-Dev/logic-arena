import { Module } from '@nestjs/common';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthLoginService } from './auth-login.service';
import { AuthPasswordService } from './auth-password.service';
import { AuthOAuthService } from './auth-oauth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../common/prisma.service';
import { EmailService } from '../../common/email.service';


import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [PassportModule],
  providers: [
    AuthRegistrationService,
    AuthLoginService,
    AuthPasswordService,
    AuthOAuthService,
    PrismaService,
    EmailService,
    GoogleStrategy,
    GithubStrategy,
  ],
  controllers: [AuthController],
  exports: [
    AuthRegistrationService,
    AuthLoginService,
    AuthPasswordService,
    AuthOAuthService,
  ],
})
export class AuthModule {}
