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

@SkipThrottle({ auth: true })
@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma:        PrismaService,
    private readonly queryService:  UsersQueryService,
    private readonly commandService: UsersCommandService,
    private readonly redis:         RedisService,
  ) {}

  // ── Leaderboard (public, live online status — no cache) ──────────────────
  @Get('leaderboard')
  async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      orderBy: { rank: 'desc' },
      take:    10,
      select:  {
        id:       true,
        username: true,
        rank:     true,
        _count:   { select: { wonMatches: true } },
      },
    });

    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const online = await this.redis.get(`user:online:${user.id}`);
        return { ...user, isOnline: !!online };
      }),
    );

    return usersWithStatus;
  }

  // ── My Profile (auth-gated, Redis-first via service) ─────────────────────
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
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
    @Req() req: any,
    @Body() body: { robotId: string; color: string },
  ) {
    try {
      await this.commandService.updateLoadout(req.user.sub, body.robotId, body.color);
      return { success: true };
    } catch (err: any) {
      throw new BadRequestException(err.message);
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
    @Req() req: any,
    @Body() body: { username?: string; email?: string },
  ) {
    try {
      await this.commandService.updateIdentity(req.user.sub, body);
      return { success: true };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  // ── Change Password (auth-gated) ────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Put('password')
  async updatePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    try {
      await this.commandService.updatePassword(
        req.user.sub,
        body.currentPassword,
        body.newPassword,
      );
      return { success: true };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  // ── Delete Account (auth-gated) ─────────────────────────────────────────
  @UseGuards(AuthGuard)
  @Delete('account')
  async deleteAccount(@Req() req: any) {
    try {
      await this.commandService.deleteAccount(req.user.sub);
      return { success: true };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
