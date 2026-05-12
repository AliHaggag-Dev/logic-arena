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

import { AuthenticatedSocket } from './gateway/types';
import { MatchState } from './gateway/match.state';
import { LOBBY_ROOM, LEADERBOARD_ROOM, MatchLobbyManager } from './gateway/match.lobby';
import { MatchSocialManager } from './gateway/match.social';
import { MatchLoopManager } from './gateway/match.loop';

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
  // Campaign Fight — headless simulation, no match state created
  // ---------------------------------------------------------------------------

  @SubscribeMessage('campaignFight')
  async handleCampaignFight(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { levelId: string; userScript: string; obstacles?: any[] },
  ) {
    // Guard: guests cannot play campaign
    if (client.isGuest || !client.userId) {
      client.emit('campaignFightError', { message: 'Authentication required.' });
      return;
    }

    const { levelId, userScript, obstacles = [] } = data;

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

    let winner: string = 'draw';

    const replayFrames: any[] = [];

    // Campaign-specific spawn layout:
    // Robots face each other from 250 units apart (well within the 300-unit FOV range).
    // Player spawns on the left, enemy on the right, both horizontally centred vertically.
    const CAMPAIGN_PLAYER_SPAWN = { x: 275, y: 300 };
    const CAMPAIGN_ENEMY_SPAWN = { x: 525, y: 300 };
    // Pre-aim each robot's FOV cone directly at the opponent on tick 0.
    const playerFacing = Math.atan2(
      CAMPAIGN_ENEMY_SPAWN.y - CAMPAIGN_PLAYER_SPAWN.y,
      CAMPAIGN_ENEMY_SPAWN.x - CAMPAIGN_PLAYER_SPAWN.x,
    );
    const enemyFacing = Math.atan2(
      CAMPAIGN_PLAYER_SPAWN.y - CAMPAIGN_ENEMY_SPAWN.y,
      CAMPAIGN_PLAYER_SPAWN.x - CAMPAIGN_ENEMY_SPAWN.x,
    );

    const ARENA_W = 800;
    const ARENA_H = 600;
    const mappedObstacles = obstacles.map((o: any) => ({
      id: `scene-obs-${Math.random().toString(36).slice(2, 7)}`,
      type: o.type ?? 'SOLID',
      position: { x: o.x * ARENA_W, y: o.y * ARENA_H },
      width: o.w * ARENA_W,
      height: o.h * ARENA_H,
      rotation: 0,
    }));

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
      mappedObstacles.length > 0 ? { obstacles: mappedObstacles } : undefined,
    );

    // Run synchronous fixed-step simulation
    // 60 physics steps/sec × 60 seconds max = 3600 steps
    const FIXED_DT = 1 / 60;
    const MS_PER_STEP = FIXED_DT * 1000; // ~16.67ms per step
    const MAX_STEPS = 60 * 60; // 60 seconds
    const LOGIC_EVERY = 3; // run logic every 3 physics steps ≈ 20Hz

    let logicCounter = 0;
    let totalProjectilesSpawned = 0;
    let simulationTimeMs = 0;
    let firstToDie: string | null = null;

    for (let step = 0; step < MAX_STEPS; step++) {
      simulationTimeMs += MS_PER_STEP;

      // Advance virtual time in cooldown manager so FIRE_COOLDOWN_MS expires correctly
      const cooldownManager = (engine as any).deps.actionExecutor.cooldowns;
      cooldownManager.setVirtualTime(simulationTimeMs);

      // 1. Physics tick
      (engine as any).gameLoop.update(FIXED_DT);

      // Track projectiles spawned (measured after physics, before logic)
      const projectilesAfterPhysics: number = (engine as any).gameLoop.getProjectiles().length;

      // 2. Logic tick (scripts)
      logicCounter++;
      if (logicCounter >= LOGIC_EVERY) {
        logicCounter = 0;
        (engine as any).tick();
      }

      // Count newly spawned projectiles this step
      const projectilesAfterLogic: number = (engine as any).gameLoop.getProjectiles().length;
      if (projectilesAfterLogic > projectilesAfterPhysics) {
        totalProjectilesSpawned += projectilesAfterLogic - projectilesAfterPhysics;
      }

      // 3. Capture frame every 6 steps ≈ 10fps replay
      if (step % 6 === 0) {
        const state = engine.getState();
        replayFrames.push({
          robots: state.robots.map((r: any) => ({
            id: r.id,
            position: { x: r.position.x, y: r.position.y },
            rotation: r.rotation,
            health: r.health,
            energy: r.energy,
            isAlive: r.isAlive,
            color: r.color,
            tracerColor: r.tracerColor,
          })),
          projectiles: state.projectiles.map((p: any) => ({
            id: p.id,
            position: { x: p.position.x, y: p.position.y },
            ownerId: p.ownerId,
            color: p.color ?? p.tracerColor,
          })),
        });
      }

      // 4. Check win condition
      const state = engine.getState();

      // Track which robot died first (to break simultaneous-death draws)
      for (const r of state.robots) {
        if ((!r.isAlive || r.health <= 0) && !firstToDie) {
          firstToDie = (r as any).id;
        }
      }

      const deadRobots = state.robots.filter((r: any) => !r.isAlive || r.health <= 0);
      if (deadRobots.length >= 1) {
        const alive = state.robots.filter((r: any) => r.isAlive && r.health > 0);
        if (alive.length === 1) {
          winner = alive[0].id === 'player' ? 'player' : 'enemy';
        } else if (alive.length === 0 && firstToDie) {
          // Both dead — loser is who died first, winner is the other
          winner = firstToDie === 'player' ? 'enemy' : 'player';
        }
        break;
      }
    }

    // If no winner after max steps — determine by health
    if (winner === 'draw') {
      const finalState = engine.getState();
      const robots = finalState.robots;
      if (robots.length >= 2) {
        const sorted = [...robots].sort((a: any, b: any) => b.health - a.health);
        if (sorted[0].health - sorted[1].health > 2) {
          winner = sorted[0].id === 'player' ? 'player' : 'enemy';
        } else {
          winner = 'enemy'; // tie goes to enemy — player must do better
        }
      }
    }

    // Debug: simulation summary for diagnosing damage pipeline
    const finalRobots = engine.getState().robots;
    const totalDamageDealt = finalRobots.reduce(
      (sum: number, r: any) => sum + (100 - r.health),
      0,
    );
    console.log('[Campaign] Simulation summary —', {
      winner,
      totalProjectilesSpawned,
      totalDamageDealt,
      robots: finalRobots.map((r: any) => ({
        id: r.id,
        health: r.health,
        alive: r.isAlive,
        damageReceived: 100 - r.health,
      })),
    });
    console.log('[Campaign] Replay frames:', replayFrames.length);
    console.log('[Campaign] Obstacles received:', JSON.stringify(obstacles));

    let completionToken: string | null = null;
    if (winner === 'player') {
      completionToken = crypto.randomUUID();
      await this.redisService.set(
        `campaign:token:${client.userId}:${levelId}`,
        completionToken,
        120,
      );
    }

    client.emit('campaignFightResult', {
      winner,
      replayFrames,
      completionToken,
    });
  }
}
