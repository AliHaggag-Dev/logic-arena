import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { AdminService } from './admin.service';
import { AdminStatsService } from './admin.stats.service';
import { AdminSortBy, UpdateUserBody } from './admin.types';

const VALID_SORT_FIELDS: AdminSortBy[] = ['rank', 'points', 'createdAt'];
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

function parseSortBy(raw: string | undefined): AdminSortBy {
  if (!raw) return 'createdAt';
  if ((VALID_SORT_FIELDS as string[]).includes(raw)) {
    return raw as AdminSortBy;
  }
  throw new BadRequestException(
    `Invalid sortBy value. Allowed: ${VALID_SORT_FIELDS.join(', ')}`,
  );
}

@SkipThrottle()
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminStatsService: AdminStatsService,
  ) {}

  // ── Stats endpoints ──────────────────────────────────────────────────────────

  @Get('stats/overview')
  getOverviewStats() {
    return this.adminService.getOverviewStats();
  }

  @Get('stats/users')
  getUserStats() {
    return this.adminStatsService.getUserStats();
  }

  @Get('stats/matches')
  getMatchStats() {
    return this.adminStatsService.getMatchStats();
  }

  @Get('stats/campaign')
  getCampaignStats() {
    return this.adminStatsService.getCampaignStats();
  }

  @Get('stats/scripts')
  getScriptStats() {
    return this.adminStatsService.getScriptStats();
  }

  @Get('stats/market')
  getMarketStats() {
    return this.adminStatsService.getMarketStats();
  }

  @Get('stats/tournaments')
  getTournamentStats() {
    return this.adminStatsService.getTournamentStats();
  }

  @Get('stats/ai')
  getAIStats() {
    return this.adminStatsService.getAIStats();
  }

  @Get('stats/engagement')
  getEngagementStats() {
    return this.adminStatsService.getEngagementStats();
  }

  @Get('health')
  getHealthStats() {
    return this.adminService.getHealthStats();
  }

  // ── User management endpoints ────────────────────────────────────────────────

  @Get('users')
  getUserList(
    @Query('page', new DefaultValuePipe(DEFAULT_PAGE), ParseIntPipe)
    page: number,
    @Query('pageSize', new DefaultValuePipe(DEFAULT_PAGE_SIZE), ParseIntPipe)
    pageSize: number,
    @Query('search') search: string | undefined,
    @Query('sortBy') rawSortBy: string | undefined,
  ) {
    const sortBy = parseSortBy(rawSortBy);
    return this.adminService.getUserList(page, pageSize, search, sortBy);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateUserBody) {
    return this.adminService.updateUser(id, body);
  }
}
