import {
  Controller, Post, Body, Req, UseGuards,
  NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '../../common/auth.guard';
import {
  CampaignService,
  ERR_LEVEL_LOCKED,
  ERR_LEVEL_NOT_FOUND,
} from '../campaign/campaign.service';
import { RedisService } from '../../common/redis.service';
import { MatchEngine } from './match.engine';
import { Robot } from '@logic-arena/engine';
import { PrismaService } from '../../common/prisma.service';
import { BLACK_MARKET_ITEMS } from '../users/black-market.constants';
import { CampaignFightDto } from './matches.dto';

interface RequestWithUser extends Request {
  user: { sub: string };
}

interface CampaignFightResult {
  won: boolean;
  draw: boolean;
  durationSeconds: number;
  completionToken: string | null;
}

/** Named constants for campaign fight configuration */
const ENGINE_TICK_MS = 100;
const WIN_POLL_MS = 150;
const MAX_TICKS = 300; // ~30 s cap
const COMPLETION_TOKEN_TTL_SEC = 60;

function completionTokenKey(userId: string, levelId: string): string {
  return `campaign:token:${userId}:${levelId}`;
}

@SkipThrottle({ auth: true })
@Controller('matches')
@UseGuards(AuthGuard)
export class MatchesController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) { }

  /** Synchronous campaign fight — no WebSocket, no DB persistence */
  @Post('campaign')
  async campaignFight(
    @Req() req: RequestWithUser,
    @Body() body: CampaignFightDto,
  ): Promise<CampaignFightResult> {
    const { levelId, userScript } = body;
    const userId = req.user.sub;

    // ── Input validation ─────────────────────────────────────────────────────
    if (!levelId?.trim()) {
      throw new BadRequestException('levelId is required');
    }
    if (!userScript?.trim()) {
      throw new BadRequestException('userScript is required');
    }

    // ── Level-lock enforcement (403 on locked / 404 on unknown) ─────────────
    let enemyScript: string;
    try {
      enemyScript = await this.campaignService.getEnemyScriptSecure(userId, levelId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === ERR_LEVEL_LOCKED) throw new ForbiddenException('Level is locked');
      if (msg === ERR_LEVEL_NOT_FOUND) throw new NotFoundException('Level not found');
      throw e;
    }

    // ── Load user loadout ────────────────────────────────────────────────────
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { equippedChassis: true, equippedPaint: true, equippedTracer: true },
    });

    let userColor = '#22d3ee';
    let userTracerColor = '#22d3ee';
    let userModel = 'unit-01';

    if (user) {
      userModel = user.equippedChassis || 'chassis-phantom';
      const paint = BLACK_MARKET_ITEMS.find((i) => i.id === user.equippedPaint);
      if (paint?.color) userColor = paint.color;
      const tracer = BLACK_MARKET_ITEMS.find((i) => i.id === user.equippedTracer);
      if (tracer?.color) userTracerColor = tracer.color;
    }

    // ── Run the match ────────────────────────────────────────────────────────
    const matchId = `campaign-${crypto.randomUUID()}`;

    const engine = new MatchEngine(matchId, [
      { id: userId, script: userScript, color: userColor, model: userModel, tracerColor: userTracerColor },
      { id: 'bot-2', script: enemyScript, color: '#ef4444', model: 'unit-02', tracerColor: '#ef4444' },
    ]);

    const startMs = Date.now();
    return new Promise<CampaignFightResult>((resolve) => {
      engine.start(ENGINE_TICK_MS);
      let tick = 0;

      const check = setInterval(() => {
        tick++;
        const state = engine.getState();
        const robots = state.robots as Robot[];
        const aliveRobots = robots.filter((r) => r.health > 0);

        const isOver = robots.length > 0 && aliveRobots.length <= 1;
        const timedOut = tick >= MAX_TICKS;

        if (isOver || timedOut) {
          clearInterval(check);
          engine.stop();

          const userBot = robots.find((r) => r.id === userId);
          const botAlive = (userBot?.health ?? 0) > 0;

          const draw = !botAlive && aliveRobots.length === 0;
          const won = botAlive && aliveRobots.length === 1;

          let completionToken: string | null = null;
          const storeToken = async () => {
            if (won) {
              completionToken = crypto.randomUUID();
              await this.redis.set(
                completionTokenKey(userId, levelId),
                completionToken,
                COMPLETION_TOKEN_TTL_SEC,
              );
            }
            resolve({
              won,
              draw,
              durationSeconds: Math.floor((Date.now() - startMs) / 1000),
              completionToken,
            });
          };
          storeToken().catch(() => {
            resolve({
              won, draw,
              durationSeconds: Math.floor((Date.now() - startMs) / 1000),
              completionToken: null,
            });
          });
        }
      }, WIN_POLL_MS);
    });
  }
}
