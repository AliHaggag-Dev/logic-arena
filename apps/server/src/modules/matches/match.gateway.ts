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

import { AuthenticatedSocket } from './gateway/types';
import { MatchState } from './gateway/match.state';
import { LOBBY_ROOM, MatchLobbyManager } from './gateway/match.lobby';
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
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
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
  ) {}

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
}
