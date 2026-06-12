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
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { CampaignService } from '../campaign/campaign.service';
import { AuthenticatedSocket } from './gateway/types';
import { MatchState } from './gateway/match.state';
import {
  LOBBY_ROOM,
  LEADERBOARD_ROOM,
  MatchLobbyManager,
} from './gateway/match.lobby';
import { MatchSocialManager } from './gateway/match.social';
import { MatchLoopManager } from './gateway/match.loop';
import { authenticateSocket } from './gateway/match.auth';
import {
  CampaignFightRunner,
  CampaignFightData,
} from './gateway/match.campaign';
import { CleanupManager } from './gateway/match.cleanup';
import { SpectatorManager } from './gateway/match.spectator';
import { handleJoinLeaderboard } from './gateway/match.leaderboard';
import { AchievementsService } from '../achievements/achievements.service';
import { FriendsGateway } from '../friends/friends.gateway';
import { NotificationsService } from '../notifications/notifications.service';

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

  private lobbyManager!: MatchLobbyManager;
  private socialManager!: MatchSocialManager;
  private loopManager!: MatchLoopManager;
  private campaignIntervals = new Map<string, NodeJS.Timeout>();
  private campaignRunner!: CampaignFightRunner;
  private cleanupManager!: CleanupManager;
  private spectatorManager!: SpectatorManager;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly campaignService: CampaignService,
    private readonly achievementsService: AchievementsService,
    private readonly state: MatchState,
    private readonly friendsGateway: FriendsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.cleanupManager = new CleanupManager(
      this.state,
      this.server,
      this.redisService,
      new Map(),
    );
    this.spectatorManager = new SpectatorManager(this.state, this.server);
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
      this.notificationsService,
    );
    this.loopManager = new MatchLoopManager(
      this.state,
      this.server,
      this.prisma,
      this.redisService,
      this.achievementsService,
    );
    this.campaignRunner = new CampaignFightRunner(
      this.campaignService,
      this.redisService,
      this.campaignIntervals,
    );
    this.friendsGateway.bindServer(this.server);
    this.loopManager.startLoop();
  }

  onModuleDestroy() {
    this.loopManager?.stopLoop();
    this.cleanupManager.clearAll();
    for (const interval of this.campaignIntervals.values())
      clearInterval(interval);
    this.campaignIntervals.clear();
    for (const [matchId, match] of this.state.matches.entries()) {
      match.stop();
      this.state.cleanupMatch(matchId);
    }
  }

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    await authenticateSocket(client, this.redisService);
    if (!client.isGuest && client.userId) {
      client.join(client.userId);
      this.cleanupManager.cancel(client.userId);
    }
  }

  async handleDisconnect(@ConnectedSocket() client: AuthenticatedSocket) {
    this.spectatorManager.removeSpectator(client);

    if (client.userId) {
      // Delay offline check to avoid race conditions during page transitions (where new socket connects before old one finishes disconnecting)
      setTimeout(async () => {
        const isActuallyOffline =
          (await this.server.in(client.userId!).fetchSockets()).length === 0;
        if (isActuallyOffline) {
          const ci = this.campaignIntervals.get(client.userId!);
          if (ci) {
            clearInterval(ci);
            this.campaignIntervals.delete(client.userId!);
          }
          await this.redisService.del(`user:online:${client.userId}`);

          if (!client.isSpectator) {
            this.server.to(LEADERBOARD_ROOM).emit('userStatusUpdate', {
              userId: client.userId,
              status: 'idle',
              isOnline: false,
            });
          }
          this.cleanupManager.schedule(client.userId!);
        }
      }, 2000);
    }

    if (client.userId && !client.isSpectator) {
      const status = this.state.userStatus.get(client.userId);
      if (status?.status === 'in-match') {
        this.state.userStatus.set(client.userId, { status: 'idle' });
        this.server
          .to(LEADERBOARD_ROOM)
          .emit('userStatusUpdate', { userId: client.userId, status: 'idle' });
      }
    }

    // Guard: if handleLeaveMatch already cleared matchId, skip match cleanup
    if (client.matchId && this.state.matches.has(client.matchId)) {
      const matchMode = this.state.matchModes.get(client.matchId);
      const isSoloMode =
        matchMode === 'TRAINING_SOLO' ||
        matchMode === 'SURVIVAL' ||
        matchMode === 'RACING';
      // Solo modes: always clean up immediately.
      // Multiplayer: only clean up when no clients remain in the room.
      let shouldCleanup = isSoloMode;
      if (!shouldCleanup) {
        const numClients =
          this.server.sockets.adapter.rooms.get(client.matchId)?.size ?? 0;
        shouldCleanup = numClients === 0;
      }
      if (shouldCleanup) {
        const match = this.state.matches.get(client.matchId);
        if (match) {
          match.stop();
          this.state.cleanupMatch(client.matchId);
          if (this.state.lobbyMatches.has(client.matchId)) {
            this.state.lobbyMatches.delete(client.matchId);
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

  // Lobby routing
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
    @MessageBody() data: { scriptId: string; mode?: 'CLASSIC' | 'TACTICAL' },
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
  @SubscribeMessage('leaveMatch')
  handleLeaveMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    return this.lobbyManager.handleLeaveMatch(client, data);
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
  @SubscribeMessage('match:submit-ready')
  handleSubmitReady(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { script: string },
  ) {
    if (!client.matchId || !client.userId) return;
    this.loopManager.submitReady(client.matchId, client.userId, data.script);
  }
  @SubscribeMessage('match:classic-edit')
  handleClassicEdit(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { script: string; tokensLeft: number },
  ) {
    if (!client.matchId || !client.userId) return;
    if (typeof data.script !== 'string' || data.tokensLeft < 0) return;
    const match = this.state.matches.get(client.matchId);
    if (!match) return;
    match.updateRobotScript(client.userId, data.script);
    match.updateInitialPlayer(client.userId, data.script);
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

  // Leaderboard routing
  @SubscribeMessage('joinLeaderboard')
  async handleJoinLeaderboard(@ConnectedSocket() client: AuthenticatedSocket) {
    return handleJoinLeaderboard(client, this.server, this.state);
  }
  @SubscribeMessage('leaveLeaderboard')
  handleLeaveLeaderboard(@ConnectedSocket() client: AuthenticatedSocket) {
    client.leave(LEADERBOARD_ROOM);
  }

  // Spectator routing
  @SubscribeMessage('spectate')
  handleSpectate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    return this.spectatorManager.handleSpectate(client, data);
  }
  @SubscribeMessage('leaveSpectate')
  handleLeaveSpectate(@ConnectedSocket() client: AuthenticatedSocket) {
    return this.spectatorManager.handleLeaveSpectate(client);
  }

  // Social routing
  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    return this.socialManager.handlePing(client);
  }
  @SubscribeMessage('send-challenge')
  async handleSendChallenge(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string; mode?: 'CLASSIC' | 'TACTICAL' },
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

  // Friends routing
  @SubscribeMessage('friend:send-request')
  async handleSendFriendRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverUsername: string; message?: string },
  ) {
    return this.friendsGateway.handleSendRequest(client, data);
  }
  @SubscribeMessage('friend:accept-request')
  async handleAcceptFriendRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    return this.friendsGateway.handleAcceptRequest(client, data);
  }
  @SubscribeMessage('friend:decline-request')
  async handleDeclineFriendRequest(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    return this.friendsGateway.handleDeclineRequest(client, data);
  }
  @SubscribeMessage('friend:unfriend')
  async handleUnfriendSocket(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { friendId: string },
  ) {
    return this.friendsGateway.handleUnfriend(client, data);
  }

  // Campaign routing
  @SubscribeMessage('campaignFight')
  async handleCampaignFight(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CampaignFightData,
  ) {
    return this.campaignRunner.handle(client, data);
  }
}
