import * as crypto from 'crypto';
import { MatchEngine } from '../match.engine';
import { RedisService } from '../../../common/redis.service';
import { CampaignService } from '../../campaign/campaign.service';
import { checkWinCondition } from './match.win-condition';
import { AuthenticatedSocket } from './types';
import type { Obstacle, ObstacleType } from '@logic-arena/engine';

type CampaignObstaclePayload = {
  x: number;
  y: number;
  w: number;
  h: number;
  type?: ObstacleType;
};

export type CampaignFightData = {
  levelId: string;
  userScript: string;
  obstacles?: CampaignObstaclePayload[];
  playerSpawn?: { x: number; y: number; angle?: number };
  enemySpawn?: { x: number; y: number; angle?: number };
};

export class CampaignFightRunner {
  constructor(
    private campaignService: CampaignService,
    private redisService: RedisService,
    private campaignIntervals: Map<string, NodeJS.Timeout>,
  ) {}

  async handle(
    client: AuthenticatedSocket,
    data: CampaignFightData,
  ): Promise<void> {
    if (client.isGuest || !client.userId) {
      client.emit('campaignFightError', {
        message: 'Authentication required.',
      });
      return;
    }

    const {
      levelId,
      userScript,
      obstacles = [],
      playerSpawn,
      enemySpawn,
    } = data;

    if (!levelId || !userScript?.trim()) {
      client.emit('campaignFightError', { message: 'Invalid payload.' });
      return;
    }

    let enemyScript: string;
    try {
      enemyScript = await this.campaignService.getEnemyScriptSecure(
        client.userId,
        levelId,
      );
    } catch {
      client.emit('campaignFightError', {
        message: 'Level locked or not found.',
      });
      return;
    }

    const existing = this.campaignIntervals.get(client.userId);
    if (existing) clearInterval(existing);

    const CAMPAIGN_PLAYER_SPAWN = playerSpawn ?? { x: 275, y: 300, angle: 0 };
    const CAMPAIGN_ENEMY_SPAWN = enemySpawn ?? {
      x: 525,
      y: 300,
      angle: Math.PI,
    };

    const playerFacing =
      typeof CAMPAIGN_PLAYER_SPAWN.angle === 'number'
        ? CAMPAIGN_PLAYER_SPAWN.angle
        : Math.atan2(
            CAMPAIGN_ENEMY_SPAWN.y - CAMPAIGN_PLAYER_SPAWN.y,
            CAMPAIGN_ENEMY_SPAWN.x - CAMPAIGN_PLAYER_SPAWN.x,
          );
    const enemyFacing =
      typeof CAMPAIGN_ENEMY_SPAWN.angle === 'number'
        ? CAMPAIGN_ENEMY_SPAWN.angle
        : Math.atan2(
            CAMPAIGN_PLAYER_SPAWN.y - CAMPAIGN_ENEMY_SPAWN.y,
            CAMPAIGN_PLAYER_SPAWN.x - CAMPAIGN_ENEMY_SPAWN.x,
          );

    const ARENA_W = 800;
    const ARENA_H = 600;
    const mappedObstacles: Obstacle[] = obstacles.map(
      (o: CampaignObstaclePayload) => ({
        id: `scene-obs-${Math.random().toString(36).slice(2, 7)}`,
        type: o.type ?? 'SOLID',
        position: { x: o.x * ARENA_W, y: o.y * ARENA_H },
        width: o.w * ARENA_W,
        height: o.h * ARENA_H,
        rotation: 0,
      }),
    );

    const FIXED_DT = 1 / 60;
    const MS_PER_STEP = FIXED_DT * 1000;
    const MAX_STEPS = 60 * 60;
    const LOGIC_EVERY = 6;

    let stepCount = 0;
    let logicCounter = 0;
    let simulationTimeMs = 0;
    let winner: string = 'draw';
    let matchOver = false;

    const lastScanTicks = new Map<string, number>();

    const engine = new MatchEngine(
      `campaign-${crypto.randomUUID()}`,
      [
        {
          id: 'player',
          script: userScript,
          spawnPosition: CAMPAIGN_PLAYER_SPAWN,
          initialFovDirection: playerFacing,
        },
        {
          id: 'enemy',
          script: enemyScript,
          spawnPosition: CAMPAIGN_ENEMY_SPAWN,
          initialFovDirection: enemyFacing,
        },
      ],
      { obstacles: mappedObstacles },
      (event, payload) => {
        if (
          event === 'logicExecuted' &&
          payload.action === 'SCAN' &&
          typeof payload.robotId === 'string'
        ) {
          lastScanTicks.set(payload.robotId, stepCount);
        }
      },
    );
    const campaignEnemy = engine
      .getGameLoop()
      .getRobots()
      .find((r) => r.id === 'enemy');
    if (campaignEnemy) {
      campaignEnemy.ignoreEnergyCost = true;
    }

    const emitFrame = () => {
      const state = engine.getState();
      return {
        robots: state.robots.map((r) => ({
          id: r.id,
          position: { x: r.position.x, y: r.position.y },
          rotation: r.rotation,
          health: r.health,
          energy: r.energy,
          isAlive: r.isAlive,
          color: r.color,
          tracerColor: r.tracerColor,
          scanActive: stepCount - (lastScanTicks.get(r.id) ?? -999) < 3,
        })),
        projectiles: state.projectiles.map((p) => ({
          id: p.id,
          position: { x: p.position.x, y: p.position.y },
          ownerId: p.ownerId,
          color: p.color,
        })),
        tick: stepCount,
      };
    };

    client.emit('campaignFrame', emitFrame());

    const interval = setInterval(async () => {
      if (matchOver) return;

      for (let i = 0; i < 3; i++) {
        simulationTimeMs += MS_PER_STEP;
        engine.setVirtualTime(simulationTimeMs);
        engine.getGameLoop().update(FIXED_DT);

        logicCounter++;
        if (logicCounter >= LOGIC_EVERY) {
          logicCounter = 0;
          engine.tick();
        }

        stepCount++;
        if (stepCount >= MAX_STEPS) {
          matchOver = true;
          break;
        }
      }

      client.emit('campaignFrame', emitFrame());

      const state = engine.getState();
      const { matchIsOver, winner: matchWinner } = checkWinCondition(
        state,
        'COMBAT',
      );

      if (matchIsOver) {
        matchOver = true;
        if (matchWinner) {
          winner = matchWinner.id === 'player' ? 'player' : 'enemy';
        }
      }

      if (matchOver) {
        clearInterval(interval);
        this.campaignIntervals.delete(client.userId!);

        let completionToken: string | null = null;
        if (winner === 'player') {
          completionToken = crypto.randomUUID();
          await this.redisService.set(
            `campaign:token:${client.userId}:${levelId}`,
            completionToken,
            120,
          );
        }

        client.emit('campaignFightResult', { winner, completionToken });
      }
    }, 50);

    this.campaignIntervals.set(client.userId, interval);
  }
}
