import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    title: string;
    content: string;
    category?: string;
    matchId?: string;
  }) {
    return this.prisma.ariaInsight.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        category: data.category ?? 'general',
        matchId: data.matchId,
      },
    });
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.ariaInsight.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ariaInsight.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, unreadCount: items.filter((i) => !i.isRead).length };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.ariaInsight.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.ariaInsight.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.ariaInsight.deleteMany({
      where: { id, userId },
    });
  }

  async deleteAll(userId: string) {
    return this.prisma.ariaInsight.deleteMany({
      where: { userId },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.ariaInsight.count({
      where: { userId, isRead: false },
    });
  }
}
