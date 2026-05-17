import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OnModuleDestroy } from '@nestjs/common';
import { Server } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { AUTH_COOKIE_NAME, JwtPayload } from '../auth/types';
import { CampaignService } from '../campaign/campaign.service';
import { MatchEngine } from './match.engine';
import type { Obstacle, ObstacleType } from '@logic-arena/engine';

import { AuthenticatedSocket } from './gateway/types';
import { MatchState } from './gateway/match.state';
import { LOBBY_ROOM, LEADERBOARD_ROOM, MatchLobbyManager } from './gateway/match.lobby';
import { MatchSocialManager } from './gateway/match.social';
import { MatchLoopManager } from './gateway/match.loop';
import { checkWinCondition } from './gateway/match.win-condition';

type CampaignObstaclePayload = {
  x: number;
  y: number;
  w: number;
  h: number;
  type?: ObstacleType;
};

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://logicarena.dev',
      'https://www.logicarena.dev',
    ],
    credentials: true,
  },
})
export class MatchGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  // Internal State
  private state = new MatchState();

  // Child Managers
  private lobbyManager!: MatchLobbyManager;
  private socialManager!: MatchSocialManager;
  private loopManager!: MatchLoopManager;
  private disconnectCleanupTimers = new Map<string, NodeJS.Timeout>();
  private campaignIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly campaignService: CampaignService,
  ) { }

  onModuleInit() {
    // Initialize the separated managers
    this.lobbyManager = new MatchLobbyManager(
      this.state,
      this.server,
      this.prisma,
      this.redisService,
    );
    this.socialManager = new MatchSocialManager(
      this.server,
      this.prisma,
      this.redisService,
    );
    this.loopManager = new MatchLoopManager(
      this.state,
      this.server,
      this.prisma,
      this.redisService,
    );

    // Boot up the global match tick loop
    this.loopManager.startLoop();
  }

  onModuleDestroy() {
    this.loopManager?.stopLoop();

    for (const timer of this.disconnectCleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectCleanupTimers.clear();

    for (const interval of this.campaignIntervals.values()) {
      clearInterval(interval);
    }
    this.campaignIntervals.clear();

    for (const [matchId, match] of this.state.matches.entries()) {
      match.stop();
      this.state.cleanupMatch(matchId);
    }
  }

  // ---------------------------------------------------------------------------
  // Connection / Auth
  // ---------------------------------------------------------------------------

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    const token = this.extractWsToken(client);

    if (!token) {
      client.userId = `guest_${client.id}`;
      client.isGuest = true;
      client.emit('authenticated', { userId: client.userId, isGuest: true });
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string,
      ) as JwtPayload;
      client.userId = decoded.sub;
      this.cancelDisconnectCleanup(client.userId);
      await this.redisService.set(`user:online:${client.userId}`, '1', 300);
      client.emit('authenticated', { userId: client.userId });
    } catch {
      client.userId = `guest_${client.id}`;
      client.isGuest = true;
      client.emit('authenticated', { userId: client.userId, isGuest: true });
    }
  }

  /**
   * Extracts the JWT from the WebSocket handshake.
   * Priority:
   *  1. Cookie header (browser sends HttpOnly cookies automatically on WS upgrade)
   *  2. socket.io auth object  { auth: { token } }  — used by the lobby/arena hooks
   *  3. Authorization header
   */
  private extractWsToken(client: AuthenticatedSocket): string | undefined {
    // 1. Cookie on the WS upgrade request
    const cookieHeader = client.handshake?.headers?.cookie ?? '';
    const cookieMatch = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    if (cookieMatch) return cookieMatch.slice(AUTH_COOKIE_NAME.length + 1);

    // 2. socket.io auth payload (lobby / arena sockets pass token here)
    const authToken = client.handshake?.auth?.token as string | undefined;
    if (authToken) return authToken.replace(/^Bearer\s+/i, '');

    // 3. Authorization header
    const authHeader = client.handshake?.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

    return undefined;
  }

  async handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    // Clear any active campaign fight interval for this user
    if (client.userId) {
      const campaignInterval = this.campaignIntervals.get(client.userId);
      if (campaignInterval) {
        clearInterval(campaignInterval);
        this.campaignIntervals.delete(client.userId);
      }
    }

    if (client.userId) {
      await this.redisService.del(`user:online:${client.userId}`);
    }

    // Clean up spectator tracking on disconnect
    if (client.matchId && client.isSpectator) {
      const spectators = this.state.spectatorSockets.get(client.matchId);
      if (spectators) {
        spectators.delete(client.id);
        this.server.to(client.matchId).emit('spectatorCount', spectators.size);
      }
    }

    // If the user was tracked as in-match, mark them idle and notify leaderboard
    if (client.userId && !client.isSpectator) {
      const status = this.state.userStatus.get(client.userId);
      if (status?.status === 'in-match') {
        this.state.userStatus.set(client.userId, { status: 'idle' });
        this.server.to(LEADERBOARD_ROOM).emit('userStatusUpdate', {
          userId: client.userId,
          status: 'idle',
        });
      }

      // Always broadcast that the user went offline so the leaderboard dot
      // goes dark immediately rather than waiting for the next REST poll TTL.
      this.server.to(LEADERBOARD_ROOM).emit('userStatusUpdate', {
        userId: client.userId,
        status: 'idle',
        isOnline: false,
      });
    }

    // Clean up lobby if they hosted one
    // We delay this by 2 seconds. If they navigated to the arena, they will reconnect
    // and `isOnline` will be true again, preventing the lobby match from disappearing.
    if (client.userId) {
      this.scheduleDisconnectCleanup(client.userId);
    }

    // Clean up match if no players are left
    if (client.matchId && this.state.matches.has(client.matchId)) {
      const matchId = client.matchId;
      const room = this.server.sockets.adapter.rooms.get(matchId);
      const numClients = room ? room.size : 0;

      if (numClients === 0) {
        const match = this.state.matches.get(matchId);
        if (match) {
          match.stop();
          this.state.cleanupMatch(matchId);

          if (this.state.lobbyMatches.has(matchId)) {
            this.state.lobbyMatches.delete(matchId);
            this.server
              .to(LOBBY_ROOM)
              .emit(
                'lobbyUpdated',
                Array.from(this.state.lobbyMatches.values()),
              );
          }
        }
      }
    }
  }

  private cancelDisconnectCleanup(userId: string): void {
    const existingTimer = this.disconnectCleanupTimers.get(userId);
    if (!existingTimer) return;

    clearTimeout(existingTimer);
    this.disconnectCleanupTimers.delete(userId);
  }

  private scheduleDisconnectCleanup(userId: string): void {
    this.cancelDisconnectCleanup(userId);

    const timer = setTimeout(async () => {
      this.disconnectCleanupTimers.delete(userId);

      const isOnline = await this.redisService.get(`user:online:${userId}`);
      if (!isOnline) {
        let lobbyChanged = false;
        for (const [id, lobby] of this.state.lobbyMatches.entries()) {
          if (lobby.hostId === userId) {
            this.state.lobbyMatches.delete(id);
            lobbyChanged = true;
          }
        }
        if (lobbyChanged) {
          this.server
            .to(LOBBY_ROOM)
            .emit('lobbyUpdated', Array.from(this.state.lobbyMatches.values()));
        }
      }
    }, 2000);

    this.disconnectCleanupTimers.set(userId, timer);
  }

  // ---------------------------------------------------------------------------
  // Match Lobby routing
  // ---------------------------------------------------------------------------

  @SubscribeMessage('joinMatch')
  async handleJoinMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      matchId: string;
      scriptId: string;
      mode?: 'COMBAT' | 'RACING' | 'TRAINING_SOLO';
    },
  ) {
    return this.lobbyManager.handleJoinMatch(client, data);
  }

  @SubscribeMessage('createMatch')
  async handleCreateMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { scriptId: string },
  ) {
    return this.lobbyManager.handleCreateMatch(client, data);
  }

  @SubscribeMessage('getLobby')
  async handleGetLobby(@ConnectedSocket() client: AuthenticatedSocket) {
    return this.lobbyManager.handleGetLobby(client);
  }

  @SubscribeMessage('leaveLobby')
  handleLeaveLobby(@ConnectedSocket() client: AuthenticatedSocket) {
    return this.lobbyManager.handleLeaveLobby(client);
  }

  @SubscribeMessage('joinLeaderboard')
  async handleJoinLeaderboard(@ConnectedSocket() client: AuthenticatedSocket) {
    client.join(LEADERBOARD_ROOM);

    // Build a snapshot of ALL currently-online authenticated users.
    // We iterate the live socket list so the snapshot is accurate for idle users too
    // (userStatus only tracks in-match users, not everyone who is connected).
    const allSockets = await this.server.fetchSockets();
    const seenUserIds = new Set<string>();
    const snapshot: Array<{
      userId: string;
      isOnline: boolean;
      matchId?: string;
    }> = [];

    for (const s of allSockets) {
      const sock = s as unknown as AuthenticatedSocket;
      if (!sock.userId || sock.isGuest || seenUserIds.has(sock.userId)) {
        continue;
      }
      seenUserIds.add(sock.userId);
      const status = this.state.userStatus.get(sock.userId);
      snapshot.push({
        userId: sock.userId,
        isOnline: true,
        matchId:
          status?.status === 'in-match' ? status.matchId : undefined,
      });
    }

    client.emit('userStatusSnapshot', snapshot);
  }

  @SubscribeMessage('leaveLeaderboard')
  handleLeaveLeaderboard(@ConnectedSocket() client: AuthenticatedSocket) {
    client.leave(LEADERBOARD_ROOM);
  }

  @SubscribeMessage('resetGame')
  handleResetGame(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    return this.lobbyManager.handleResetGame(client, data);
  }

  @SubscribeMessage('updateLogic')
  handleUpdateLogic(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { robotId: string; scriptContent: string },
  ) {
    return this.lobbyManager.handleUpdateLogic(client, data);
  }

  @SubscribeMessage('manualCommand')
  handleManualCommand(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { robotId?: string; command: string },
  ) {
    return this.lobbyManager.handleManualCommand(client, data);
  }

  @SubscribeMessage('toggleLockVision')
  handleToggleLockVision(@ConnectedSocket() client: AuthenticatedSocket) {
    return this.lobbyManager.handleToggleLockVision(client);
  }

  @SubscribeMessage('respawnDummies')
  handleRespawnDummies(@ConnectedSocket() client: AuthenticatedSocket) {
    return this.lobbyManager.handleRespawnDummies(client);
  }

  // ---------------------------------------------------------------------------
  // Spectator routing
  // ---------------------------------------------------------------------------

  @SubscribeMessage('spectate')
  handleSpectate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    if (!data?.matchId) {
      client.emit('error', { message: 'Invalid matchId.' });
      return;
    }

    const match = this.state.matches.get(data.matchId);
    if (!match) {
      client.emit('error', { message: 'Match not found or not active.' });
      return;
    }

    // Mark socket as spectator so game command handlers can guard against it
    (client as AuthenticatedSocket & { isSpectator?: boolean }).isSpectator = true;
    client.matchId = data.matchId;
    client.join(data.matchId);

    // Track spectator set
    if (!this.state.spectatorSockets.has(data.matchId)) {
      this.state.spectatorSockets.set(data.matchId, new Set<string>());
    }
    const spectators = this.state.spectatorSockets.get(data.matchId)!;
    spectators.add(client.id);

    // Send current game state snapshot to the new spectator
    client.emit('gameState', match.getState());

    // Broadcast updated spectator count to the entire match room
    this.server.to(data.matchId).emit('spectatorCount', spectators.size);

    client.emit('spectateJoined', { matchId: data.matchId });
  }

  @SubscribeMessage('leaveSpectate')
  handleLeaveSpectate(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.matchId) return;

    const spectators = this.state.spectatorSockets.get(client.matchId);
    if (spectators) {
      spectators.delete(client.id);
      this.server.to(client.matchId).emit('spectatorCount', spectators.size);
    }

    client.leave(client.matchId);
    (client as AuthenticatedSocket & { isSpectator?: boolean }).isSpectator = false;
    client.matchId = undefined;
  }

  // ---------------------------------------------------------------------------
  // Social Presence / Challenge routing
  // ---------------------------------------------------------------------------

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    return this.socialManager.handlePing(client);
  }

  @SubscribeMessage('send-challenge')
  async handleSendChallenge(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string },
  ) {
    return this.socialManager.handleSendChallenge(client, data);
  }

  @SubscribeMessage('accept-challenge')
  async handleAcceptChallenge(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { challengerId: string },
  ) {
    return this.socialManager.handleAcceptChallenge(client, data);
  }

  // ---------------------------------------------------------------------------
  // Campaign Fight — uses the exact same MatchEngine as the 3D Arena,
  // streams frames to the client at 20Hz, no replay buffering.
  // ---------------------------------------------------------------------------

  @SubscribeMessage('campaignFight')
  async handleCampaignFight(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      levelId: string;
      userScript: string;
      obstacles?: CampaignObstaclePayload[];
      playerSpawn?: { x: number; y: number; angle?: number };
      enemySpawn?: { x: number; y: number; angle?: number };
    },
  ) {
    if (client.isGuest || !client.userId) {
      client.emit('campaignFightError', { message: 'Authentication required.' });
      return;
    }

    const { levelId, userScript, obstacles = [], playerSpawn, enemySpawn } = data;

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
      client.emit('campaignFightError', { message: 'Level locked or not found.' });
      return;
    }

    const existing = this.campaignIntervals.get(client.userId);
    if (existing) clearInterval(existing);

    const CAMPAIGN_PLAYER_SPAWN = playerSpawn ?? { x: 275, y: 300, angle: 0 };
    const CAMPAIGN_ENEMY_SPAWN = enemySpawn ?? { x: 525, y: 300, angle: Math.PI };

    // Keep the live server simulation aligned with the 2D scene definition.
    // Some campaign levels (notably graph-theory rail missions) intentionally
    // start the enemy facing away from the player so its mission script can
    // move to the next node instead of firing forever at node 0.
    const playerFacing = typeof CAMPAIGN_PLAYER_SPAWN.angle === 'number'
      ? CAMPAIGN_PLAYER_SPAWN.angle
      : Math.atan2(
        CAMPAIGN_ENEMY_SPAWN.y - CAMPAIGN_PLAYER_SPAWN.y,
        CAMPAIGN_ENEMY_SPAWN.x - CAMPAIGN_PLAYER_SPAWN.x,
      );
    const enemyFacing = typeof CAMPAIGN_ENEMY_SPAWN.angle === 'number'
      ? CAMPAIGN_ENEMY_SPAWN.angle
      : Math.atan2(
        CAMPAIGN_PLAYER_SPAWN.y - CAMPAIGN_ENEMY_SPAWN.y,
        CAMPAIGN_PLAYER_SPAWN.x - CAMPAIGN_ENEMY_SPAWN.x,
      );

    const ARENA_W = 800;
    const ARENA_H = 600;
    const mappedObstacles: Obstacle[] = obstacles.map((o: CampaignObstaclePayload) => ({
      id: `scene-obs-${Math.random().toString(36).slice(2, 7)}`,
      type: o.type ?? 'SOLID',
      position: { x: o.x * ARENA_W, y: o.y * ARENA_H },
      width: o.w * ARENA_W,
      height: o.h * ARENA_H,
      rotation: 0,
    }));

    const FIXED_DT = 1 / 60;
    const MS_PER_STEP = FIXED_DT * 1000;
    const MAX_STEPS = 60 * 60;
    const LOGIC_EVERY = 6;

    let stepCount = 0;
    let logicCounter = 0;
    let simulationTimeMs = 0;
    let winner: string = 'draw';
    let matchOver = false;

    // Track SCAN commands per robot tick for client FOV cone rendering
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
        if (event === 'logicExecuted' && payload.action === 'SCAN') {
          lastScanTicks.set(payload.robotId, stepCount);
        }
      },
    );
    const campaignEnemy = engine.getGameLoop().getRobots().find((r) => r.id === 'enemy');
    if (campaignEnemy) {
      campaignEnemy.ignoreEnergyCost = true;
    }

    // Emit initial frame immediately so the client has something to render
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
          scanActive: (stepCount - (lastScanTicks.get(r.id) ?? -999)) < 3,
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
      const { matchIsOver, winner: matchWinner } = checkWinCondition(state, 'COMBAT');

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
