import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthOAuthService } from '../auth-oauth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authOAuthService: AuthOAuthService) {
    const isDev = process.env.NODE_ENV === 'development';
    const callbackURL = isDev 
      ? 'http://localhost:3001/api/auth/github/callback' 
      : (process.env.GITHUB_CALLBACK_URL || 'https://logicarena.dev/api/auth/github/callback');

    super({
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const email = profile.emails?.[0]?.value ?? `${profile.username}@github.com`;
    const user = await this.authOAuthService.findOrCreateOAuthUser({
      provider: 'github',
      providerId: profile.id,
      email,
      username: profile.username,
      avatarUrl: profile.photos?.[0]?.value,
    });
    done(null, user);
  }
}
