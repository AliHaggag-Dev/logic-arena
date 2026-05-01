import {
  Controller, Post, Body, Req, UseGuards,
  NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '../../common/auth.guard';
import { CampaignService, CAMPAIGN_LEVEL_COUNT } from '../campaign/campaign.service';
import { RedisService } from '../../common/redis.service';
import { MatchEngine } from './match.engine';
import { Robot } from '@logic-arena/engine';

interface CampaignFightDto {
  levelId: number;
  userScript: string;
}

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
const WIN_POLL_MS    = 150;
const MAX_TICKS      = 300; // ~30s cap

/** Redis TTL for single-use completion tokens (60 seconds) */
const COMPLETION_TOKEN_TTL_SEC = 60;

function completionTokenKey(userId: string, levelId: number): string {
  return `campaign:token:${userId}:${levelId}`;
}

@SkipThrottle({ auth: true })
@Controller('matches')
@UseGuards(AuthGuard)
export class MatchesController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly redis: RedisService,
  ) {}

  /** Synchronous campaign fight — no WebSocket, no DB persistence */
  @Post('campaign')
  async campaignFight(
    @Req() req: RequestWithUser,
    @Body() body: CampaignFightDto,
  ): Promise<CampaignFightResult> {
    const { levelId, userScript } = body;
    const userId = req.user.sub;

    // ── Input validation ───────────────────────────────────────────────
    const parsedLevelId = Number(levelId);
    if (
      !Number.isInteger(parsedLevelId) ||
      parsedLevelId < 1 ||
      parsedLevelId > CAMPAIGN_LEVEL_COUNT
    ) {
      throw new BadRequestException('levelId must be an integer between 1 and 10');
    }
    if (!userScript?.trim()) {
      throw new BadRequestException('userScript is required');
    }

    // ── Level-lock enforcement ─────────────────────────────────────────
    let enemyScript: string;
    try {
      enemyScript = await this.campaignService.getEnemyScriptSecure(userId, parsedLevelId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'LEVEL_LOCKED')    throw new ForbiddenException('Level is locked');
      if (msg === 'LEVEL_NOT_FOUND') throw new NotFoundException('Level not found');
      throw e;
    }

    // ── Run the match ──────────────────────────────────────────────────
    const matchId = `campaign-${crypto.randomUUID()}`;

    const engine = new MatchEngine(matchId, [
      { id: userId,  script: userScript,  color: '#22d3ee' },
      { id: 'bot-2', script: enemyScript, color: '#ef4444' },
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

        const isOver   = robots.length > 0 && aliveRobots.length <= 1;
        const timedOut = tick >= MAX_TICKS;

        if (isOver || timedOut) {
          clearInterval(check);
          engine.stop();

          const userBot  = robots.find((r) => r.id === userId);
          const botAlive = (userBot?.health ?? 0) > 0;

          // Draw: both bots dead simultaneously
          const draw = !botAlive && aliveRobots.length === 0;
          const won  = botAlive && aliveRobots.length === 1;

          // Generate a single-use completion token on win
          let completionToken: string | null = null;
          const storeToken = async () => {
            if (won) {
              completionToken = crypto.randomUUID();
              await this.redis.set(
                completionTokenKey(userId, parsedLevelId),
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
            // Redis unavailable — resolve without token (completeLevel will reject)
            resolve({ won, draw, durationSeconds: Math.floor((Date.now() - startMs) / 1000), completionToken: null });
          });
        }
      }, WIN_POLL_MS);
    });
  }
}
