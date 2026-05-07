import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { AuthGuard } from '../../common/auth.guard';
import { UsersQueryService } from './users-query.service';
import { UsersCommandService } from './users-command.service';
import {
  LeaderboardEntry,
  LEADERBOARD_LIMIT,
  LEADERBOARD_TTL,
  leaderboardRankKey,
  leaderboardSnapshotKey,
} from './types';
import {
  EquipItemDto,
  PurchaseItemDto,
  UpdateArenaPreferencesDto,
  UpdateIdentityDto,
  UpdateNotificationSettingsDto,
  UpdatePasswordDto,
  UpdateProfileDto,
} from './users.dto';
import { ItemCategory } from './black-market.constants';
import { ImageFileValidationPipe } from '../../common/file-validation.pipe';

/** Typed request shape produced by AuthGuard JWT strategy */
interface AuthenticatedRequest {
  user: { sub: string };
}

const replayKey = (matchId: string) => `replay:${matchId}`;
const REPLAY_TTL = 3_600;

/** Multer file size hard cap — 2 MB */
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

@SkipThrottle({ auth: true })
@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryService: UsersQueryService,
    private readonly commandService: UsersCommandService,
    private readonly redis: RedisService,
  ) {}

  // ── Leaderboard (public, short-lived Redis cache) ─────────────────────────
  @Get('leaderboard')
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    // 1. Serve from cache if available
    const cached = await this.redis.get<LeaderboardEntry[]>(
      leaderboardSnapshotKey,
    );
    if (cached) return cached;

    // 1b. Prefer Redis sorted-set ranking when already warm
    if (this.redis.healthy) {
      const ranked = await this.redis
        .getClient()
        .zrevrange(leaderboardRankKey, 0, LEADERBOARD_LIMIT - 1, 'WITHSCORES');
      const ids = ranked.filter((_, i) => i % 2 === 0);
      if (ids.length > 0) {
        const users = await this.prisma.user.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            username: true,
            rank: true,
            _count: { select: { wonMatches: true } },
          },
        });
        const byId = new Map(users.map((u) => [u.id, u]));
        const presenceKeys = ids.map((id) => `user:online:${id}`);
        const presenceValues = await this.redis
          .getClient()
          .mget(...presenceKeys);
        const result = ids
          .map((id, i) => {
            const user = byId.get(id);
            return user
              ? {
                  ...user,
                  isOnline:
                    presenceValues[i] !== null &&
                    presenceValues[i] !== undefined,
                }
              : null;
          })
          .filter((entry): entry is LeaderboardEntry => entry !== null);

        if (result.length > 0) {
          await this.redis.set(leaderboardSnapshotKey, result, LEADERBOARD_TTL);
          return result;
        }
      }
    }

    // 2. Fetch top-N users ordered by rank desc, then by won matches desc as tiebreaker
    const users = await this.prisma.user.findMany({
      orderBy: [{ rank: 'desc' }, { wonMatches: { _count: 'desc' } }],
      take: LEADERBOARD_LIMIT,
      select: {
        id: true,
        username: true,
        rank: true,
        _count: { select: { wonMatches: true } },
      },
    });

    // 3. Batch all online-presence checks into a single MGET round-trip
    const presenceKeys = users.map((u) => `user:online:${u.id}`);
    const presenceValues: (string | null)[] =
      presenceKeys.length > 0
        ? await this.redis.getClient().mget(...presenceKeys)
        : [];

    const result: LeaderboardEntry[] = users.map((user, i) => ({
      ...user,
      isOnline: presenceValues[i] !== null && presenceValues[i] !== undefined,
    }));

    // 4. Cache the assembled result for LEADERBOARD_TTL seconds
    await this.redis.set(leaderboardSnapshotKey, result, LEADERBOARD_TTL);
    if (this.redis.healthy && users.length > 0) {
      await this.redis
        .getClient()
        .zadd(
          leaderboardRankKey,
          ...users.flatMap((user) => [String(user.rank), user.id]),
        );
    }

    return result;
  }

  // ── My Profile (auth-gated, Redis-first via service) ─────────────────────
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId: string = req.user.sub;
    const profile = await this.queryService.getProfile(userId);

    if (!profile) {
      return {
        username: 'UNKNOWN',
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        rank: 0,
        matchHistory: [],
      };
    }

    return profile;
  }

  // ── Update Loadout (auth-gated, invalidates profile cache) ───────────────
  @UseGuards(AuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateProfileDto,
  ) {
    try {
      await this.commandService.updateLoadout(
        req.user.sub,
        body.robotId,
        body.color,
      );
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      throw new BadRequestException(message);
    }
  }

  // ── Avatar Upload (auth-gated, secure) ────────────────────────────────────
  @UseGuards(AuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: AVATAR_MAX_BYTES },
    }),
  )
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile(new ImageFileValidationPipe()) file: Express.Multer.File,
  ) {
    try {
      const avatarUrl = await this.commandService.uploadAvatar(
        req.user.sub,
        file.buffer,
      );
      return { success: true, avatarUrl };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Avatar upload failed';
      throw new BadRequestException(message);
    }
  }

  // ── Match Replay (auth-gated) ─────────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Get('matches/:matchId/replay')
  async getReplay(@Param('matchId') matchId: string) {
    const cached = await this.redis.get<unknown>(replayKey(matchId));
    if (cached) return cached;

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        replayData: true,
        winnerId: true,
        duration: true,
        createdAt: true,
      },
    });
    if (!match) throw new NotFoundException('Match not found');
    await this.redis.set(replayKey(matchId), match, REPLAY_TTL);
    return match;
  }

  // ── Update Identity (auth-gated) ─────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Put('identity')
  async updateIdentity(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateIdentityDto,
  ) {
    if (body.username !== undefined && body.username.trim().length < 3) {
      throw new BadRequestException('Username must be at least 3 characters');
    }
    if (
      body.email !== undefined &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
    ) {
      throw new BadRequestException('Invalid email format');
    }
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
    @Body() body: UpdatePasswordDto,
  ) {
    if (!body.newPassword || body.newPassword.length < 8) {
      throw new BadRequestException(
        'New password must be at least 8 characters',
      );
    }
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

  // ── Update Arena Preferences (auth-gated) ───────────────────────────────
  @UseGuards(AuthGuard)
  @Put('preferences')
  async updateArenaPreferences(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateArenaPreferencesDto,
  ) {
    try {
      await this.commandService.updateArenaPreferences(req.user.sub, body);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      throw new BadRequestException(message);
    }
  }

  // ── Update Notification Settings (auth-gated) ───────────────────────────
  @UseGuards(AuthGuard)
  @Put('notifications')
  async updateNotificationSettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateNotificationSettingsDto,
  ) {
    try {
      await this.commandService.updateNotificationSettings(req.user.sub, body);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      throw new BadRequestException(message);
    }
  }

  // ── Black Market (auth-gated) ─────────────────────────────────────────────

  @UseGuards(AuthGuard)
  @Get('black-market')
  async getBlackMarket(@Req() req: AuthenticatedRequest) {
    try {
      return await this.queryService.getBlackMarket(req.user.sub);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load Black Market data';
      throw new NotFoundException(message);
    }
  }

  @UseGuards(AuthGuard)
  @Post('black-market/purchase')
  async purchaseItem(
    @Req() req: AuthenticatedRequest,
    @Body() body: PurchaseItemDto,
  ) {
    if (!body?.itemId) throw new BadRequestException('itemId is required');
    try {
      await this.commandService.purchaseItem(req.user.sub, body.itemId);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Purchase failed';
      throw new BadRequestException(message);
    }
  }

  @UseGuards(AuthGuard)
  @Post('black-market/equip')
  async equipItem(
    @Req() req: AuthenticatedRequest,
    @Body() body: EquipItemDto,
  ) {
    if (!body?.itemId) throw new BadRequestException('itemId is required');
    if (!body?.category) throw new BadRequestException('category is required');
    const validCategories: ItemCategory[] = ['chassis', 'paint', 'tracer'];
    if (!validCategories.includes(body.category)) {
      throw new BadRequestException(
        'category must be chassis, paint, or tracer',
      );
    }
    try {
      await this.commandService.equipItem(
        req.user.sub,
        body.itemId,
        body.category,
      );
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Equip failed';
      throw new BadRequestException(message);
    }
  }
}
