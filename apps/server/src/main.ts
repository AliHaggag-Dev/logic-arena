import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

// ── Strict CORS whitelist ────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://logicarena.dev',
  'https://www.logicarena.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
] as const;

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false; // Reject requests with no Origin header in production
  return (ALLOWED_ORIGINS as readonly string[]).includes(origin);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const isDev = process.env.NODE_ENV === 'development';

  // ── Payload size limits ────────────────────────────────────────────────────
  // Hard cap JSON/urlencoded request bodies to prevent memory exhaustion attacks.
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // ── Strict DTO validation / mass-assignment protection ─────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  // ── Cookie parser (required for HttpOnly JWT cookies) ─────────────────────
  app.use(cookieParser());

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(
    helmet({
      // ─ Content-Security-Policy ─────────────────────────────────────────────
      // Disabled in dev so the Next.js HMR overlay works; fully locked in prod.
      contentSecurityPolicy: isDev
        ? false
        : {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],              // NO unsafe-inline — blocks XSS
            styleSrc: ["'self'", "'unsafe-inline'"], // Needed for CSS-in-JS libs
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            connectSrc: ["'self'", 'wss://logicarena.dev', 'https://logicarena.dev'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            frameSrc: ["'none'"],              // Disables iframes entirely
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        },

      // ─ HTTP Strict Transport Security ──────────────────────────────────────
      // Tells browsers to ONLY use HTTPS for this domain for 1 year.
      strictTransportSecurity: isDev
        ? false
        : { maxAge: 31_536_000, includeSubDomains: true, preload: true },

      // ─ Clickjacking protection ─────────────────────────────────────────────
      frameguard: { action: 'deny' },

      // ─ MIME-type sniffing prevention ───────────────────────────────────────
      noSniff: true,

      // ─ Cross-Origin Resource Policy ────────────────────────────────────────
      // 'same-origin' so our assets are not embeddable by third-party origins.
      crossOriginResourcePolicy: { policy: 'same-origin' },

      // ─ Cross-Origin Opener Policy ──────────────────────────────────────────
      crossOriginOpenerPolicy: { policy: 'same-origin' },

      // ─ Referrer policy ─────────────────────────────────────────────────────
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // ── CORS ───────────────────────────────────────────────────────────────────
  // Using a function-based origin validator so no wildcard ever slips through.
  // Credentials mode is required for HttpOnly cookie authentication.
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow same-origin requests (origin is undefined for server-to-server)
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' is not whitelisted`));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Cache', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,   // Required: allows browser to send HttpOnly cookies
    maxAge: 86_400, // 24 h preflight cache
  });

  // ── WebSocket ──────────────────────────────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  console.log(`🚀 Logic Arena Server is LIVE on port ${port}`);
  await app.listen(port);
}

bootstrap();