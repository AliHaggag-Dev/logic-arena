export const BCRYPT_ROUNDS = 12;
export const PRISMA_UNIQUE_VIOLATION = 'P2002';

// ── JWT / Cookie constants ──────────────────────────────────────────────────
/** Name of the HttpOnly cookie that carries the JWT. */
export const AUTH_COOKIE_NAME = 'la_session';

/** Cookie lifetime in seconds — 1 hour, matching token expiry. */
export const AUTH_COOKIE_MAX_AGE_SECONDS = 3_600;

/** JWT payload type returned after signing. */
export interface JwtPayload {
  sub: string;
  username: string;
  sessionVersion?: number;
  iat?: number;
  exp?: number;
}

export const sessionVersionKey = (userId: string) => `auth:session-version:${userId}`;
