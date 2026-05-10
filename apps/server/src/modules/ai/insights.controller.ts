import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { InsightsService } from './insights.service';
import { MatchInsightsService } from './match-insights.service';
import { AuthGuard } from '../../common/auth.guard';

@SkipThrottle({ auth: true })
@Throttle({ global: { limit: 30, ttl: 60_000 } })
@UseGuards(AuthGuard)
@Controller('ai/insights')
export class InsightsController {
  constructor(
    private insights: InsightsService,
    private matchInsights: MatchInsightsService,
  ) {}

  @Get()
  async findAll(
    @Req() req: { user: { sub: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.insights.findAll(req.user.sub, Number(page) || 1, Number(limit) || 20);
  }

  @Get('unread-count')
  async unreadCount(@Req() req: { user: { sub: string } }) {
    const count = await this.insights.getUnreadCount(req.user.sub);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(204)
  async markRead(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
  ) {
    await this.insights.markRead(id, req.user.sub);
  }

  @Patch('read-all')
  @HttpCode(204)
  async markAllRead(@Req() req: { user: { sub: string } }) {
    await this.insights.markAllRead(req.user.sub);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
  ) {
    await this.insights.delete(id, req.user.sub);
  }

  @Delete()
  @HttpCode(204)
  async deleteAll(@Req() req: { user: { sub: string } }) {
    await this.insights.deleteAll(req.user.sub);
  }

  @Post('generate/:matchId')
  @HttpCode(201)
  async generate(
    @Param('matchId') matchId: string,
    @Req() req: { user: { sub: string } },
  ) {
    const count = await this.matchInsights.generateForMatch(matchId, req.user.sub);
    return { generated: count };
  }
}
