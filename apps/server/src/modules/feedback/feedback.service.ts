import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
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

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  async createBugReport(
    dto: CreateBugReportDto,
    userId: string | undefined,
  ): Promise<BugReportResponse> {
    return this.prisma.bugReport.create({
      data: {
        title: dto.title,
        description: dto.description,
        steps: dto.steps ?? null,
        severity: dto.severity,
        userId: userId ?? null,
      },
    });
  }

  async createFeatureRequest(
    dto: CreateFeatureRequestDto,
    userId: string | undefined,
  ): Promise<FeatureRequestResponse> {
    return this.prisma.featureRequest.create({
      data: {
        title: dto.title,
        description: dto.description,
        useCase: dto.useCase ?? null,
        priority: dto.priority,
        userId: userId ?? null,
      },
    });
  }

  async createContactMessage(
    dto: CreateContactMessageDto,
  ): Promise<ContactMessageResponse> {
    return this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
      },
    });
  }

  // ── List (paginated) ───────────────────────────────────────────────────────

  async listBugReports(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<BugReportResponse>> {
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

    return { items, total, page, pageSize };
  }

  async listFeatureRequests(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<FeatureRequestResponse>> {
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

    return { items, total, page, pageSize };
  }

  async listContactMessages(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ContactMessageResponse>> {
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

    return { items, total, page, pageSize };
  }

  // ── Update status ──────────────────────────────────────────────────────────

  async updateBugReportStatus(
    id: string,
    status: string,
  ): Promise<BugReportResponse> {
    await this.assertBugReportExists(id);
    return this.prisma.bugReport.update({ where: { id }, data: { status } });
  }

  async updateFeatureRequestStatus(
    id: string,
    status: string,
  ): Promise<FeatureRequestResponse> {
    await this.assertFeatureRequestExists(id);
    return this.prisma.featureRequest.update({ where: { id }, data: { status } });
  }

  async updateContactMessageStatus(
    id: string,
    status: string,
  ): Promise<ContactMessageResponse> {
    await this.assertContactMessageExists(id);
    return this.prisma.contactMessage.update({ where: { id }, data: { status } });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async deleteBugReport(id: string): Promise<void> {
    await this.assertBugReportExists(id);
    await this.prisma.bugReport.delete({ where: { id } });
  }

  async deleteFeatureRequest(id: string): Promise<void> {
    await this.assertFeatureRequestExists(id);
    await this.prisma.featureRequest.delete({ where: { id } });
  }

  async deleteContactMessage(id: string): Promise<void> {
    await this.assertContactMessageExists(id);
    await this.prisma.contactMessage.delete({ where: { id } });
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
