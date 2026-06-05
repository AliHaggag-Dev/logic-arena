import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Notification } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  NotificationEntry,
  NotificationPayload,
  NotificationType,
} from './types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    payload: NotificationPayload,
  ): Promise<NotificationEntry> {
    const row = await this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: this.toJsonInput(payload.data),
      },
    });
    return this.mapToEntry(row);
  }

  async createMany(
    userIds: string[],
    payload: NotificationPayload,
  ): Promise<NotificationEntry[]> {
    if (userIds.length === 0) return [];
    const data = this.toJsonInput(payload.data);
    const result = await this.prisma.notification.createManyAndReturn({
      data: userIds.map((userId) => ({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data,
      })),
    });
    return result.map((row) => this.mapToEntry(row));
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async list(
    userId: string,
    skip: number,
    take: number,
  ): Promise<{
    items: NotificationEntry[];
    total: number;
    unreadCount: number;
  }> {
    const safeTake = Math.min(take, 100);
    const [rows, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeTake,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.countUnread(userId),
    ]);
    return {
      items: rows.map((r) => this.mapToEntry(r)),
      total,
      unreadCount,
    };
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationEntry | null> {
    try {
      const row = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });
      if (row.userId !== userId) return null;
      return this.mapToEntry(row);
    } catch {
      return null;
    }
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { count: result.count };
  }

  private toJsonInput(
    data: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue | undefined {
    if (data === undefined) return undefined;
    return data as Prisma.InputJsonValue;
  }

  private mapToEntry(row: Notification): NotificationEntry {
    return {
      id: row.id,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      data: (row.data as Record<string, unknown> | null) ?? null,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
