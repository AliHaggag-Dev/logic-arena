import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';

import { AuthenticatedSocket } from './gateway/types';
import { MatchState } from './gateway/match.state';
import { MatchLobbyManager } from './gateway/match.lobby';
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
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Internal State
  private state = new MatchState();

  // Child Managers
  private lobbyManager!: MatchLobbyManager;
  private socialManager!: MatchSocialManager;
  private loopManager!: MatchLoopManager;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    // Initialize the separated managers
    this.lobbyManager = new MatchLobbyManager(this.state, this.server, this.prisma);
    this.socialManager = new MatchSocialManager(this.server, this.prisma, this.redisService);
    this.loopManager = new MatchLoopManager(this.state, this.server, this.prisma);

    // Boot up the global match tick loop
    this.loopManager.startLoop();
  }

  // ---------------------------------------------------------------------------
  // Connection / Auth
  // ---------------------------------------------------------------------------

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    const token =
      client.handshake?.auth?.token ||
      client.handshake?.headers?.authorization;

    if (!token) {
      client.emit('error', { message: 'Unauthorized: No token provided' });
      client.disconnect(true);
      return;
    }

    try {
      const cleanToken = token.replace('Bearer ', '');
      const decoded: any = jwt.verify(cleanToken, process.env.JWT_SECRET as string);
      client.userId = decoded.sub;
      await this.redisService.set(`user:online:${client.userId}`, '1', 300);
      client.emit('authenticated', { userId: client.userId });
    } catch {
      client.emit('error', { message: 'Unauthorized: Invalid token' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      await this.redisService.del(`user:online:${client.userId}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Match Lobby routing
  // ---------------------------------------------------------------------------

  @SubscribeMessage('joinMatch')
  async handleJoinMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string; scriptId: string; mode?: 'COMBAT' | 'RACING' | 'TRAINING_SOLO' },
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
  handleGetLobby(@ConnectedSocket() client: AuthenticatedSocket) {
    return this.lobbyManager.handleGetLobby(client);
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
    @MessageBody() data: { command: string },
  ) {
    return this.lobbyManager.handleManualCommand(client, data);
  }

  @SubscribeMessage('toggleLockVision')
  handleToggleLockVision(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    return this.lobbyManager.handleToggleLockVision(client);
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