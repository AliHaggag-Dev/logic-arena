import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../common/prisma.service';
import { RedisService }  from '../../common/redis.service';
import { AuthGuard }     from '../../common/auth.guard';
import { UsersQueryService }  from './users-query.service';
import { UsersCommandService }  from './users-command.service';
import {
  LeaderboardEntry,
  LEADERBOARD_LIMIT,
  LEADERBOARD_TTL,
} from './types';

/** Typed request shape produced by AuthGuard JWT strategy */
interface AuthenticatedRequest {
  user: { sub: string };
}

const LEADERBOARD_CACHE_KEY = 'leaderboard:snapshot';

@SkipThrottle({ auth: true })
@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma:        PrismaService,
    private readonly queryService:  UsersQueryService,
    private readonly commandService: UsersCommandService,
    private readonly redis:         RedisService,
  ) {}

  // ── Leaderboard (public, short-lived Redis cache) ─────────────────────────
  @Get('leaderboard')
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    // 1. Serve from cache if available
    const cached = await this.redis.get<LeaderboardEntry[]>(LEADERBOARD_CACHE_KEY);
    if (cached) return cached;

    // 2. Fetch top-N users ordered by rank desc, then by won matches desc as tiebreaker
    const users = await this.prisma.user.findMany({
      orderBy: [{ rank: 'desc' }, { wonMatches: { _count: 'desc' } }],
      take:    LEADERBOARD_LIMIT,
      select:  {
        id:       true,
        username: true,
        rank:     true,
        _count:   { select: { wonMatches: true } },
      },
    });

    // 3. Batch all online-presence checks into a single MGET round-trip
    const presenceKeys = users.map((u) => `user:online:${u.id}`);
    const presenceValues: (string | null)[] = presenceKeys.length > 0
      ? await this.redis.getClient().mget(...presenceKeys)
      : [];

    const result: LeaderboardEntry[] = users.map((user, i) => ({
      ...user,
      isOnline: presenceValues[i] !== null && presenceValues[i] !== undefined,
    }));

    // 4. Cache the assembled result for LEADERBOARD_TTL seconds
    await this.redis.set(LEADERBOARD_CACHE_KEY, result, LEADERBOARD_TTL);

    return result;
  }


  // ── My Profile (auth-gated, Redis-first via service) ─────────────────────
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId: string = req.user.sub;
    const profile = await this.queryService.getProfile(userId);

    if (!profile) {
      return { username: 'UNKNOWN', totalMatches: 0, wins: 0, losses: 0, winRate: 0, rank: 0, matchHistory: [] };
    }

    return profile;
  }

  // ── Update Loadout (auth-gated, invalidates profile cache) ───────────────
  @UseGuards(AuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: { robotId: string; color: string },
  ) {
    try {
      await this.commandService.updateLoadout(req.user.sub, body.robotId, body.color);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      throw new BadRequestException(message);
    }
  }

  // ── Match Replay (auth-gated) ─────────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Get('matches/:matchId/replay')
  async getReplay(@Param('matchId') matchId: string) {
    const match = await this.prisma.match.findUnique({
      where:  { id: matchId },
      select: { id: true, replayData: true, winnerId: true, duration: true, createdAt: true },
    });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  // ── Update Identity (auth-gated) ─────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Put('identity')
  async updateIdentity(
    @Req() req: AuthenticatedRequest,
    @Body() body: { username?: string; email?: string },
  ) {
    try {
      await this.commandService.updateIdentity(req.user.sub, body);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      throw new BadRequestException(message);
    }
  }

  // ── Change Password (auth-gated) ────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Put('password')
  async updatePassword(
    @Req() req: AuthenticatedRequest,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    try {
      await this.commandService.updatePassword(
        req.user.sub,
        body.currentPassword,
        body.newPassword,
      );
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      throw new BadRequestException(message);
    }
  }

  // ── Delete Account (auth-gated) ─────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Delete('account')
  async deleteAccount(@Req() req: AuthenticatedRequest) {
    try {
      await this.commandService.deleteAccount(req.user.sub);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      throw new BadRequestException(message);
    }
  }
}
