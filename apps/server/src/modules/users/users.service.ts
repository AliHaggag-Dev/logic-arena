import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';

const ALLOWED_ROBOT_IDS = ['unit-01', 'unit-02'];
const COLOR_REGEX        = /^#[0-9a-fA-F]{6}$/;
const PROFILE_TTL        = 600; // 10 minutes

// ── Cache key helpers ────────────────────────────────────────────────────────
const profileKey  = (id: string) => `user:profile:${id}`;
const loadoutKey  = (id: string) => `user:loadout:${id}`;

const BCRYPT_ROUNDS = 12;
const PRISMA_UNIQUE_VIOLATION = 'P2002';

// ── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  username:        string;
  email:           string;
  rank:            number;
  memberSince:     Date;
  selectedRobotId: string | null;
  selectedColor:   string | null;
  totalMatches:    number;
  wins:            number;
  losses:          number;
  winRate:         number;
  matchHistory:    MatchSummary[];
  hasGoogle:       boolean;
  hasGithub:       boolean;
  provider:        string | null;
}

export interface MatchSummary {
  id:       string;
  date:     Date;
  type:     string;
  opponent: string;
  result:   'WIN' | 'LOSS';
  duration: number | null;
}

export interface UserLoadout {
  selectedRobotId: string | null;
  selectedColor:   string | null;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── Profile ─────────────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<UserProfile | null> {
    // 1. Cache-first
    const cached = await this.redis.get<UserProfile>(profileKey(userId));
    if (cached) return cached;

    // 2. Prisma
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: {
        username:        true,
        email:           true,
        rank:            true,
        createdAt:       true,
        selectedRobotId: true,
        selectedColor:   true,
        googleId:        true,
        githubId:        true,
        provider:        true,
        Match: {
          orderBy: { createdAt: 'desc' },
          select:  {
            id:           true,
            type:         true,
            winnerId:     true,
            duration:     true,
            createdAt:    true,
            participants: { select: { id: true, username: true } },
          },
        },
      },
    });

    if (!user) return null;

    const totalMatches = user.Match.length;
    const wins         = user.Match.filter((m) => m.winnerId === userId).length;
    const losses       = totalMatches - wins;
    const winRate      = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    const matchHistory: MatchSummary[] = user.Match.map((m) => {
      const opponent = m.participants.find((p) => p.id !== userId);
      return {
        id:       m.id,
        date:     m.createdAt,
        type:     m.type,
        opponent: opponent?.username ?? 'N/A',
        result:   m.winnerId === userId ? 'WIN' : 'LOSS',
        duration: m.duration,
      };
    });

    const profile: UserProfile = {
      username:        user.username,
      email:           user.email,
      rank:            user.rank,
      memberSince:     user.createdAt,
      selectedRobotId: user.selectedRobotId,
      selectedColor:   user.selectedColor,
      totalMatches,
      wins,
      losses,
      winRate,
      matchHistory,
      hasGoogle:       !!user.googleId,
      hasGithub:       !!user.githubId,
      provider:        user.provider,
    };

    // 3. Populate cache with 10-minute TTL
    await this.redis.set(profileKey(userId), profile, PROFILE_TTL);
    return profile;
  }

  // ── Loadout ──────────────────────────────────────────────────────────────────

  async getLoadout(userId: string): Promise<UserLoadout | null> {
    const cached = await this.redis.get<UserLoadout>(loadoutKey(userId));
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { selectedRobotId: true, selectedColor: true },
    });

    if (!user) return null;

    await this.redis.set(loadoutKey(userId), user, PROFILE_TTL);
    return user;
  }

  async updateLoadout(userId: string, robotId: string, color: string): Promise<void> {
    if (!ALLOWED_ROBOT_IDS.includes(robotId)) {
      throw new Error(`Invalid robotId "${robotId}". Must be one of: ${ALLOWED_ROBOT_IDS.join(', ')}`);
    }
    if (color !== 'DEFAULT' && !COLOR_REGEX.test(color)) {
      throw new Error(`Invalid color "${color}". Must match #rrggbb format or be "DEFAULT".`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data:  { selectedRobotId: robotId, selectedColor: color },
    });

    // Invalidate both caches on write-through
    await this.redis.del(profileKey(userId), loadoutKey(userId));
  }

  // ── Identity update ───────────────────────────────────────────────────────────

  async updateIdentity(
    userId: string,
    data: { username?: string; email?: string },
  ): Promise<void> {
    if (!data.username && !data.email) return;
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data,
      });
      await this.redis.del(profileKey(userId), loadoutKey(userId));
    } catch (err: any) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === PRISMA_UNIQUE_VIOLATION
      ) {
        const target = (err.meta?.target as string[]) ?? [];
        if (target.includes('username')) throw new ConflictException('Username already taken');
        if (target.includes('email'))    throw new ConflictException('Email already registered');
      }
      throw err;
    }
  }

  // ── Password change ───────────────────────────────────────────────────────────

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Account uses OAuth — password cannot be changed here');
    }
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data:  { passwordHash: newHash },
    });
  }

  // ── Account deletion ──────────────────────────────────────────────────────────

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
    await this.redis.del(profileKey(userId), loadoutKey(userId));
  }

  // ── Public lookups ───────────────────────────────────────────────────────────

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where:  { id },
      select: { id: true, email: true, username: true, rank: true, createdAt: true },
    });
  }

  async findOneByUsername(username: string) {
    return this.prisma.user.findUnique({
      where:  { username },
      select: { id: true, email: true, username: true, rank: true, createdAt: true },
    });
  }
}