import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthOAuthService } from '../auth-oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authOAuthService: AuthOAuthService) {
    const isDev = process.env.NODE_ENV === 'development';
    const callbackURL = isDev
      ? 'http://localhost:3001/api/auth/google/callback'
      : process.env.GOOGLE_CALLBACK_URL ||
        'https://logicarena.dev/api/auth/google/callback';

    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const user = await this.authOAuthService.findOrCreateOAuthUser({
      provider: 'google',
      providerId: profile.id,
      email: profile.emails[0].value,
      username: profile.displayName.replace(/\s+/g, '_').toLowerCase(),
      avatarUrl: profile.photos[0]?.value,
    });
    done(null, user);
  }
}
