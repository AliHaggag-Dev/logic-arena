import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

import { AuthGuard } from '../../common/auth.guard';
import { AdminGuard } from '../../common/admin.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { JwtPayload } from '../auth/types';
import { FeedbackService } from './feedback.service';
import {
  CreateBugReportDto,
  CreateBugReportSchema,
  CreateFeatureRequestDto,
  CreateFeatureRequestSchema,
  CreateContactMessageDto,
  CreateContactMessageSchema,
  UpdateStatusDto,
  UpdateStatusSchema,
  PaginationQueryDto,
  PaginationQuerySchema,
} from './feedback.dto';

// ── Typed request helper ──────────────────────────────────────────────────────

type AuthenticatedRequest = Request & { user?: JwtPayload };

// ── Public controller ─────────────────────────────────────────────────────────

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('bug-reports')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateBugReportSchema))
  async createBugReport(
    @Body() body: CreateBugReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub;
    return this.feedbackService.createBugReport(body, userId);
  }

  @Post('feature-requests')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateFeatureRequestSchema))
  async createFeatureRequest(
    @Body() body: CreateFeatureRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub;
    return this.feedbackService.createFeatureRequest(body, userId);
  }

  @Post('contact')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateContactMessageSchema))
  async createContactMessage(@Body() body: CreateContactMessageDto) {
    return this.feedbackService.createContactMessage(body);
  }
}

// ── Admin controller ──────────────────────────────────────────────────────────

@SkipThrottle({ global: true })
@Throttle({ admin: { ttl: 60000, limit: 300 } })
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/feedback')
export class AdminFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // ── Bug Reports ─────────────────────────────────────────────────────────────

  @Get('bug-reports')
  @HttpCode(HttpStatus.OK)
  async listBugReports(@Query() rawQuery: Record<string, string>) {
    const query = PaginationQuerySchema.parse(rawQuery) as PaginationQueryDto;
    return this.feedbackService.listBugReports(query);
  }

  @Patch('bug-reports/:id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(UpdateStatusSchema))
  async updateBugReportStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.feedbackService.updateBugReportStatus(id, body.status);
  }

  @Delete('bug-reports/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBugReport(@Param('id') id: string) {
    await this.feedbackService.deleteBugReport(id);
  }

  // ── Feature Requests ────────────────────────────────────────────────────────

  @Get('feature-requests')
  @HttpCode(HttpStatus.OK)
  async listFeatureRequests(@Query() rawQuery: Record<string, string>) {
    const query = PaginationQuerySchema.parse(rawQuery) as PaginationQueryDto;
    return this.feedbackService.listFeatureRequests(query);
  }

  @Patch('feature-requests/:id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(UpdateStatusSchema))
  async updateFeatureRequestStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.feedbackService.updateFeatureRequestStatus(id, body.status);
  }

  @Delete('feature-requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFeatureRequest(@Param('id') id: string) {
    await this.feedbackService.deleteFeatureRequest(id);
  }

  // ── Contact Messages ────────────────────────────────────────────────────────

  @Get('contact')
  @HttpCode(HttpStatus.OK)
  async listContactMessages(@Query() rawQuery: Record<string, string>) {
    const query = PaginationQuerySchema.parse(rawQuery) as PaginationQueryDto;
    return this.feedbackService.listContactMessages(query);
  }

  @Patch('contact/:id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(UpdateStatusSchema))
  async updateContactMessageStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.feedbackService.updateContactMessageStatus(id, body.status);
  }

  @Delete('contact/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContactMessage(@Param('id') id: string) {
    await this.feedbackService.deleteContactMessage(id);
  }
}
