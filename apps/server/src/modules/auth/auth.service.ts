import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { PrismaService } from '../../common/prisma.service';

/** Number of bcrypt hashing rounds — OWASP recommends ≥ 10; 12 is a good balance. */
const BCRYPT_ROUNDS = 12;

/** Prisma unique-constraint field names for the User model. */
const PRISMA_UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async register(email: string, username: string, password: string) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: { email, username, passwordHash },
      });

      return this.stripPassword(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_VIOLATION
      ) {
        // Prisma surfaces the conflicting field(s) in `error.meta.target`
        const target = (error.meta?.target as string[]) ?? [];
        if (target.includes('username')) {
          throw new ConflictException('Username already taken');
        }
        if (target.includes('email')) {
          throw new ConflictException('Email already registered');
        }
        throw new ConflictException('Account already exists');
      }
      throw error;
    }
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });

    // Use a constant-time compare even when user doesn't exist to prevent
    // timing-based user enumeration attacks.
    const dummyHash =
      '$2b$12$invalidhashfortimingprotectionxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const hash = user?.passwordHash ?? dummyHash;
    const isValid = await bcrypt.compare(password, hash);

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('Server misconfiguration');
    }

    const payload = { username: user.username, sub: user.id };
    return {
      accessToken: jwt.sign(payload, secret, { expiresIn: '1h' }),
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Returns a copy of the user object without the passwordHash field. */
  private stripPassword(user: User): Omit<User, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _removed, ...safe } = user;
    return safe;
  }
}