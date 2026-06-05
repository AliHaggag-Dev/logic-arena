import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Body,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  CampaignService,
  ERR_LEVEL_LOCKED,
  ERR_LEVEL_NOT_FOUND,
  ERR_USER_NOT_FOUND,
  ERR_INSUFFICIENT_POINTS,
  ERR_INVALID_HINT_INDEX,
} from './campaign.service';
import { AuthGuard } from '../../common/auth.guard';
import { RedisService } from '../../common/redis.service';
import { CompleteLevelDto, RevealHintDto } from './campaign.dto';

interface RequestWithUser extends Request {
  user: { sub: string };
}

function completionTokenKey(userId: string, levelId: string): string {
  return `campaign:token:${userId}:${levelId}`;
}

@SkipThrottle({ auth: true })
@Controller('campaign')
@UseGuards(AuthGuard)
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly redis: RedisService,
  ) {}

  /** Returns all tabs with per-level unlock/completion state for the authenticated user. */
  @Get('tabs')
  getTabsWithLevels(@Req() req: RequestWithUser) {
    return this.campaignService.getTabsWithLevels(req.user.sub);
  }

  /** Legacy flat list — preserved for backward compatibility with the old campaign page. */
  @Get('levels')
  async getLevels(@Req() req: RequestWithUser) {
    const tabs = await this.campaignService.getTabsWithLevels(req.user.sub);
    return tabs.flatMap((t) => t.levels);
  }

  /** Get a single level's details (no enemy script). Returns 403 if locked. */
  @Get('levels/:id')
  async getLevel(@Req() req: RequestWithUser, @Param('id') id: string) {
    if (!id?.trim()) throw new NotFoundException('Level not found');
    try {
      return await this.campaignService.getLevel(req.user.sub, id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === ERR_LEVEL_LOCKED)
        throw new ForbiddenException('Level is locked');
      if (msg === ERR_LEVEL_NOT_FOUND)
        throw new NotFoundException('Level not found');
      throw e;
    }
  }

  /**
   * Reveals a progressive hint for the authenticated user.
   * hintIndex 1 costs 10 points, hintIndex 2 costs 25 points.
   * Returns { hint, pointsDeducted, remainingPoints }.
   */
  @Post('levels/:id/hint')
  async revealHint(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: RevealHintDto,
  ) {
    if (!id?.trim()) throw new BadRequestException('Invalid level id');
    try {
      return await this.campaignService.revealHint(
        req.user.sub,
        id,
        body.hintIndex,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === ERR_LEVEL_LOCKED)
        throw new ForbiddenException('Level is locked');
      if (msg === ERR_LEVEL_NOT_FOUND)
        throw new NotFoundException('Level not found');
      if (msg === ERR_USER_NOT_FOUND)
        throw new NotFoundException('User not found');
      if (msg === ERR_INSUFFICIENT_POINTS)
        throw new HttpException(
          'Insufficient points to reveal hint',
          HttpStatus.PAYMENT_REQUIRED,
        );
      if (msg === ERR_INVALID_HINT_INDEX)
        throw new BadRequestException('hintIndex must be 1 or 2');
      throw e;
    }
  }

  /**
   * Called by the client after a verified win to record completion and award points.
   * Requires a single-use completionToken issued by the campaign fight endpoint.
   */
  @Post('levels/:id/complete')
  async completeLevel(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: CompleteLevelDto,
  ) {
    if (!id?.trim()) throw new BadRequestException('Invalid level id');

    const userId = req.user.sub;
    const { completionToken, fightDurationTicks } = body;

    if (!completionToken) {
      throw new ForbiddenException('Missing completion token');
    }

    if (this.redis.healthy) {
      // ── Verify single-use Redis token issued by the fight endpoint ──
      const tokenKey = completionTokenKey(userId, id);
      const storedToken = await this.redis.get<string>(tokenKey);

      if (!storedToken || storedToken !== completionToken) {
        throw new ForbiddenException('Invalid or expired completion token');
      }

      // Consume the token immediately (single-use)
      await this.redis.del(tokenKey);
    }

    try {
      return await this.campaignService.completeLevel(
        userId,
        id,
        fightDurationTicks,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === ERR_LEVEL_LOCKED)
        throw new ForbiddenException('Level is locked — cannot claim reward');
      if (msg === ERR_LEVEL_NOT_FOUND)
        throw new NotFoundException('Level not found');
      if (msg === ERR_USER_NOT_FOUND)
        throw new NotFoundException('User not found');
      throw e;
    }
  }
}
