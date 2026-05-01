import {
  Controller, Post, Get, Param, Req, Body,
  UseGuards, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CampaignService, CAMPAIGN_LEVEL_COUNT } from './campaign.service';
import { AuthGuard } from '../../common/auth.guard';
import { RedisService } from '../../common/redis.service';

interface RequestWithUser extends Request {
  user: { sub: string };
}

interface CompleteLevelDto {
  completionToken: string;
}

function completionTokenKey(userId: string, levelId: number): string {
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

  @Get('levels')
  getLevels(@Req() req: RequestWithUser) {
    return this.campaignService.getLevels(req.user.sub);
  }

  @Get('levels/:id')
  async getLevel(@Req() req: RequestWithUser, @Param('id') id: string) {
    const levelId = parseInt(id, 10);
    if (isNaN(levelId) || levelId < 1 || levelId > CAMPAIGN_LEVEL_COUNT) {
      throw new NotFoundException('Level not found');
    }
    try {
      return await this.campaignService.getLevel(req.user.sub, levelId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'LEVEL_LOCKED')    throw new ForbiddenException('Level is locked');
      if (msg === 'LEVEL_NOT_FOUND') throw new NotFoundException('Level not found');
      throw e;
    }
  }

  @Post('levels/:id/complete')
  async completeLevel(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: CompleteLevelDto,
  ) {
    const levelId = parseInt(id, 10);
    if (isNaN(levelId) || levelId < 1 || levelId > CAMPAIGN_LEVEL_COUNT) {
      throw new BadRequestException('Invalid level id');
    }

    const userId = req.user.sub;
    const { completionToken } = body;

    if (!completionToken) {
      throw new ForbiddenException('Missing completion token');
    }

    // Verify the single-use token stored by the fight endpoint
    const tokenKey   = completionTokenKey(userId, levelId);
    const storedToken = await this.redis.get<string>(tokenKey);

    if (!storedToken || storedToken !== completionToken) {
      throw new ForbiddenException('Invalid or expired completion token');
    }

    // Consume the token immediately (single-use)
    await this.redis.del(tokenKey);

    try {
      return await this.campaignService.completeLevel(userId, levelId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'INVALID_LEVEL')   throw new BadRequestException('Not your current level');
      if (msg === 'USER_NOT_FOUND')  throw new NotFoundException('User not found');
      throw e;
    }
  }
}
