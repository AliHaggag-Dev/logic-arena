import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import {
  BugReportResponse,
  FeatureRequestResponse,
  ContactMessageResponse,
  PaginatedResponse,
} from './feedback.types';
import {
  CreateBugReportDto,
  CreateFeatureRequestDto,
  CreateContactMessageDto,
  PaginationQueryDto,
} from './feedback.dto';

const FEEDBACK_CACHE_TTL = 60;

function listCacheKey(entity: string, query: PaginationQueryDto): string {
  const { page, pageSize, status, sortBy, sortOrder } = query;
  return `feedback:${entity}:list:${page}:${pageSize}:${status || ''}:${sortBy}:${sortOrder}`;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  async createBugReport(
    dto: CreateBugReportDto,
    userId: string | undefined,
  ): Promise<BugReportResponse> {
    const result = await this.prisma.bugReport.create({
      data: {
        title: dto.title,
        description: dto.description,
        steps: dto.steps ?? null,
        severity: dto.severity,
        userId: userId ?? null,
      },
    });
    await this.redis.delPattern('feedback:bugReport:*');
    return result;
  }

  async createFeatureRequest(
    dto: CreateFeatureRequestDto,
    userId: string | undefined,
  ): Promise<FeatureRequestResponse> {
    const result = await this.prisma.featureRequest.create({
      data: {
        title: dto.title,
        description: dto.description,
        useCase: dto.useCase ?? null,
        priority: dto.priority,
        userId: userId ?? null,
      },
    });
    await this.redis.delPattern('feedback:featureRequest:*');
    return result;
  }

  async createContactMessage(
    dto: CreateContactMessageDto,
  ): Promise<ContactMessageResponse> {
    const result = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
      },
    });
    await this.redis.delPattern('feedback:contactMessage:*');
    return result;
  }

  // ── List (paginated, cached) ───────────────────────────────────────────────

  async listBugReports(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<BugReportResponse>> {
    const cacheKey = listCacheKey('bugReport', query);
    const cached =
      await this.redis.get<PaginatedResponse<BugReportResponse>>(cacheKey);
    if (cached) return cached;

    const { page, pageSize, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * pageSize;

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.bugReport.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      this.prisma.bugReport.count({ where }),
    ]);

    const result = { items, total, page, pageSize };
    if (total > 0) {
      await this.redis.set(cacheKey, result, FEEDBACK_CACHE_TTL);
    }
    return result;
  }

  async listFeatureRequests(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<FeatureRequestResponse>> {
    const cacheKey = listCacheKey('featureRequest', query);
    const cached =
      await this.redis.get<PaginatedResponse<FeatureRequestResponse>>(cacheKey);
    if (cached) return cached;

    const { page, pageSize, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * pageSize;

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.featureRequest.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      this.prisma.featureRequest.count({ where }),
    ]);

    const result = { items, total, page, pageSize };
    if (total > 0) {
      await this.redis.set(cacheKey, result, FEEDBACK_CACHE_TTL);
    }
    return result;
  }

  async listContactMessages(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ContactMessageResponse>> {
    const cacheKey = listCacheKey('contactMessage', query);
    const cached =
      await this.redis.get<PaginatedResponse<ContactMessageResponse>>(cacheKey);
    if (cached) return cached;

    const { page, pageSize, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * pageSize;

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    const result = { items, total, page, pageSize };
    if (total > 0) {
      await this.redis.set(cacheKey, result, FEEDBACK_CACHE_TTL);
    }
    return result;
  }

  // ── Update status ──────────────────────────────────────────────────────────

  async updateBugReportStatus(
    id: string,
    status: string,
  ): Promise<BugReportResponse> {
    await this.assertBugReportExists(id);
    const result = await this.prisma.bugReport.update({
      where: { id },
      data: { status },
    });
    await this.redis.delPattern('feedback:bugReport:*');
    return result;
  }

  async updateFeatureRequestStatus(
    id: string,
    status: string,
  ): Promise<FeatureRequestResponse> {
    await this.assertFeatureRequestExists(id);
    const result = await this.prisma.featureRequest.update({
      where: { id },
      data: { status },
    });
    await this.redis.delPattern('feedback:featureRequest:*');
    return result;
  }

  async updateContactMessageStatus(
    id: string,
    status: string,
  ): Promise<ContactMessageResponse> {
    await this.assertContactMessageExists(id);
    const result = await this.prisma.contactMessage.update({
      where: { id },
      data: { status },
    });
    await this.redis.delPattern('feedback:contactMessage:*');
    return result;
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async deleteBugReport(id: string): Promise<void> {
    await this.assertBugReportExists(id);
    await this.prisma.bugReport.delete({ where: { id } });
    await this.redis.delPattern('feedback:bugReport:*');
  }

  async deleteFeatureRequest(id: string): Promise<void> {
    await this.assertFeatureRequestExists(id);
    await this.prisma.featureRequest.delete({ where: { id } });
    await this.redis.delPattern('feedback:featureRequest:*');
  }

  async deleteContactMessage(id: string): Promise<void> {
    await this.assertContactMessageExists(id);
    await this.prisma.contactMessage.delete({ where: { id } });
    await this.redis.delPattern('feedback:contactMessage:*');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async assertBugReportExists(id: string): Promise<void> {
    const record = await this.prisma.bugReport.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!record) {
      throw new NotFoundException(`Bug report ${id} not found`);
    }
  }

  private async assertFeatureRequestExists(id: string): Promise<void> {
    const record = await this.prisma.featureRequest.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!record) {
      throw new NotFoundException(`Feature request ${id} not found`);
    }
  }

  private async assertContactMessageExists(id: string): Promise<void> {
    const record = await this.prisma.contactMessage.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!record) {
      throw new NotFoundException(`Contact message ${id} not found`);
    }
  }
}
