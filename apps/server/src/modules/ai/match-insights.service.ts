import { Injectable, Logger } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class MatchInsightsService {
  private readonly logger = new Logger(MatchInsightsService.name);

  constructor(
    private insights: InsightsService,
    private prisma: PrismaService,
  ) {}

  async generateForMatch(matchId: string, userId: string): Promise<number> {
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

    const participant = match.participantDetails[0];
    const isWinner = match.winnerId === userId;
    const insights: { title: string; content: string; category: string }[] = [];

    // 1. Result analysis
    if (isWinner) {
      insights.push({
        title: 'Victory Analysis',
        content: `Your script **"${participant?.robotScript?.title || 'Untitled'}"** secured the win in **${match.duration}s**.\n\nKey takeaway: Your strategy outperformed the opponent's. Review the replay to identify which decisions gave you the edge.`,
        category: 'performance',
      });
    } else {
      insights.push({
        title: 'Defeat Analysis',
        content: `Your script **"${participant?.robotScript?.title || 'Untitled'}"** was defeated in **${match.duration}s**.\n\nDon't worry — every loss is a lesson. Check the tips below to improve your AliScript strategy.`,
        category: 'performance',
      });
    }

    // 2. Efficiency score tip
    const score = participant?.score ?? 0;
    if (score < 30) {
      insights.push({
        title: 'Energy Efficiency',
        content: `Your efficiency score was **${score}/100** — that's below optimal.\n\n**Tip:** Avoid spamming energy-heavy commands like BURST_FIRE (18 energy) or MOVE_FAST (4/tick). Use regular MOVE (2/tick) for positioning and save energy for precise FIRE shots (8/shot).`,
        category: 'energy',
      });
    } else if (score < 60) {
      insights.push({
        title: 'Energy Efficiency',
        content: `Your efficiency score was **${score}/100** — decent, but room for improvement.\n\n**Tip:** Balance movement and attacks. If you often run out of energy mid-fight, try adding a "WAIT 3" between attack bursts to let energy regenerate (3/tick).`,
        category: 'energy',
      });
    } else {
      insights.push({
        title: 'Energy Efficiency',
        content: `Your efficiency score was **${score}/100** — excellent energy management! Your robot maintained optimal energy levels throughout the match.\n\nKeep refining this balance — it's the mark of an advanced AliScript engineer.`,
        category: 'energy',
      });
    }

    // 3. Generic tactics tip
    const tacticsTips = [
      '**Tip:** Use `SCAN` to rotate your FOV cone (+15°) before attacking. This ensures CAN_SEE_ENEMY is true before you waste energy on FIRE.',
      '**Tip:** The initialization pattern is your friend: `IF NOT initialized THEN SET pos_x = POSITION_X; SET initialized = TRUE END`. Without it, all your SETs reset every tick!',
      '**Tip:** Combine PATHFIND with conditional attacks: `IF CAN_SEE_ENEMY THEN FIRE END`. This prevents wasting energy when nobody is in your 120° FOV.',
      '**Tip:** For predictive aiming, use `target_vx` and `target_vy` with `bullet_speed (400)` to calculate where the enemy will be when your bullet arrives.',
      '**Tip:** In longer matches, use `WAIT 5` between attack cycles. This gives your energy time to regenerate (3/tick) without wasting it on idle MOVE commands.',
    ];
    insights.push({
      title: 'Tactics Tip',
      content: tacticsTips[Math.floor(Math.random() * tacticsTips.length)],
      category: 'tactics',
    });

    // Save all insights
    for (const insight of insights) {
      await this.insights.create(userId, {
        ...insight,
        matchId,
      });
    }

    this.logger.log(`Generated ${insights.length} insights for match ${matchId}`);
    return insights.length;
  }
}
