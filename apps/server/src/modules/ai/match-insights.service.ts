import { Injectable, Logger } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { PrismaService } from '../../common/prisma.service';
import { AiService } from './ai.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MatchInsightsService {
  private readonly logger = new Logger(MatchInsightsService.name);
  private generationLocks = new Set<string>();

  constructor(
    private insights: InsightsService,
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async generateForMatch(matchId: string, userId: string): Promise<number> {
    const lockKey = `${matchId}:${userId}`;
    if (this.generationLocks.has(lockKey)) {
      this.logger.log(
        `Generation already in progress for match ${matchId} and user ${userId}`,
      );
      return 0;
    }

    this.generationLocks.add(lockKey);

    try {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: {
          participantDetails: {
            where: { userId },
            include: { robotScript: true },
          },
          winner: true,
        },
      });

      if (!match) {
        this.logger.warn(`Match ${matchId} not found`);
        return 0;
      }

      // Check if insights were already generated for this match and user
      const existingInsightsCount = await this.prisma.ariaInsight.count({
        where: { matchId, userId },
      });

      if (existingInsightsCount > 0) {
        this.logger.log(
          `Insights already generated for match ${matchId} and user ${userId}`,
        );
        return 0;
      }

      const participant = match.participantDetails[0];
      const isWinner = match.winnerId === userId;

      // Extract final script from replayData if available (for live coding), fallback to DB script
      let scriptCode = participant?.robotScript?.content || '';
      if (
        match.replayData &&
        typeof match.replayData === 'object' &&
        !Array.isArray(match.replayData)
      ) {
        const replayPayload = match.replayData as any;
        if (replayPayload.finalScripts && replayPayload.finalScripts[userId]) {
          scriptCode = replayPayload.finalScripts[userId];
        }
      }

      const aiInsights = await this.aiService.generateMatchInsights(
        scriptCode,
        {
          isWinner,
          duration: match.duration,
          score: participant?.score ?? 0,
        },
      );

      if (!aiInsights || aiInsights.length === 0) {
        this.logger.warn(
          `Failed to generate dynamic AI insights for match ${matchId}. Using fallback.`,
        );
        // Minimal fallback just in case AI fails
        aiInsights.push({
          title: 'Match Analysis',
          content: isWinner
            ? 'Great job! Your script performed well.'
            : 'Keep trying! Adjust your logic and try again.',
          category: 'performance',
        });
      }

      // Save all insights
      for (const insight of aiInsights) {
        await this.insights.create(userId, {
          ...insight,
          matchId,
        });
      }

      this.logger.log(
        `Generated ${aiInsights.length} insights for match ${matchId}`,
      );
      return aiInsights.length;
    } finally {
      this.generationLocks.delete(lockKey);
    }
  }
}
