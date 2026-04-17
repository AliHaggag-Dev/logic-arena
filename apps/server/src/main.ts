import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security headers ──────────────────────────────────────────────────────
  // Helmet sets X-Frame-Options, X-Content-Type-Options, HSTS, XSS filter,
  // Referrer-Policy, and more in a single call.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow CDN assets
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
        },
      },
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // ── WebSocket ─────────────────────────────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT ?? 3001;
  console.log(`🚀 Logic Arena Server is LIVE on port ${port}`);
  await app.listen(port);
}

bootstrap();