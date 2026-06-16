import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
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
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import { AuthGuard } from '../../../common/auth.guard';
import { OptionalAuthGuard } from '../../../common/optional-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { ProfileQueryService } from '../queries/profile-query.service';
import { ProfileCommandService } from '../commands/profile-command.service';
import { PreferencesCommandService } from '../commands/preferences-command.service';
import { AchievementsService } from '../../achievements/achievements.service';
import {
  UpdateProfileDto,
  UpdateIdentityDto,
  UpdatePasswordDto,
  UpdateArenaPreferencesDto,
  UpdateNotificationSettingsDto,
} from '../users.dto';
import { ImageFileValidationPipe } from '../../../common/file-validation.pipe';

interface AuthenticatedRequest {
  user: { sub: string };
}

const replayKey = (matchId: string) => `replay:${matchId}`;
const REPLAY_TTL = 3_600;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

@SkipThrottle({ auth: true })
@Controller('users')
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly profileQuery: ProfileQueryService,
    private readonly profileCommand: ProfileCommandService,
    private readonly preferencesCommand: PreferencesCommandService,
    private readonly achievementsService: AchievementsService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId: string = req.user.sub;
    const profile = await this.profileQuery.getProfile(userId);

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

  @UseGuards(AuthGuard)
  @Get('achievements')
  async getAchievements(@Req() req: AuthenticatedRequest) {
    return this.achievementsService.getUserAchievements(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get(':userId/achievements')
  async getAchievementsByUserId(@Param('userId') userId: string) {
    return this.achievementsService.getUserAchievements(userId);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateProfileDto,
  ) {
    try {
      await this.profileCommand.updateLoadout(
        req.user.sub,
        body.robotId,
        body.color,
      );
      return { success: true };
    } catch (err: unknown) {
      this.logger.error('Failed to update loadout settings:', err);
      throw new BadRequestException('Failed to update loadout settings');
    }
  }

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
      const avatarUrl = await this.profileCommand.uploadAvatar(
        req.user.sub,
        file.buffer,
      );
      return { success: true, avatarUrl };
    } catch (err: unknown) {
      this.logger.error('Failed to upload avatar:', err);
      throw new BadRequestException('Failed to upload avatar');
    }
  }

  @UseGuards(OptionalAuthGuard)
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
      await this.profileCommand.updateIdentity(req.user.sub, body);
      return { success: true };
    } catch (err: unknown) {
      this.logger.error('Failed to update identity:', err);
      throw new BadRequestException('Failed to update identity');
    }
  }

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
      await this.profileCommand.updatePassword(
        req.user.sub,
        body.currentPassword,
        body.newPassword,
      );
      return { success: true };
    } catch (err: unknown) {
      this.logger.error('Failed to update password:', err);
      throw new BadRequestException('Failed to update password');
    }
  }

  @UseGuards(AuthGuard)
  @Put('preferences')
  async updateArenaPreferences(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateArenaPreferencesDto,
  ) {
    try {
      await this.preferencesCommand.updateArenaPreferences(req.user.sub, body);
      return { success: true };
    } catch (err: unknown) {
      this.logger.error('Failed to update arena preferences:', err);
      throw new BadRequestException('Failed to update arena preferences');
    }
  }

  @UseGuards(AuthGuard)
  @Put('notifications')
  async updateNotificationSettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateNotificationSettingsDto,
  ) {
    try {
      await this.preferencesCommand.updateNotificationSettings(
        req.user.sub,
        body,
      );
      return { success: true };
    } catch (err: unknown) {
      this.logger.error('Failed to update notification settings:', err);
      throw new BadRequestException('Failed to update notification settings');
    }
  }
}
