import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { FriendsService } from './friends.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthenticatedSocket } from '../matches/gateway/types';
import { FriendEntry, FriendRequestEntry, FriendSuggestion } from './types';

export interface FriendRequestReceivedPayload {
  request: FriendRequestEntry;
  unreadCount: number;
}

export interface FriendRequestResolvedPayload {
  requestId: string;
  by: {
    id: string;
    username: string;
  };
  friendshipCreatedAt: string;
  unreadCount: number;
}

export interface FriendRemovedPayload {
  by: {
    id: string;
    username: string;
  };
}

@Injectable()
export class FriendsGateway {
  private readonly logger = new Logger(FriendsGateway.name);
  private server!: Server;

  constructor(
    @Inject(forwardRef(() => FriendsService))
    private readonly friends: FriendsService,
    private readonly notifications: NotificationsService,
  ) {}

  bindServer(server: Server): void {
    this.server = server;
  }

  // ── Emitters (called by FriendsService after mutations) ─────────────────

  async emitFriendRequestReceived(
    targetUserId: string,
    request: FriendRequestEntry,
  ): Promise<void> {
    if (!this.server) return;
    const unreadCount = await this.notifications.countUnread(targetUserId);
    this.server.to(targetUserId).emit('friend:request-received', {
      request,
      unreadCount,
    });
  }

  async emitFriendRequestAccepted(
    originalRequesterId: string,
    accepterInfo: { id: string; username: string },
    friendshipCreatedAt: string,
  ): Promise<void> {
    if (!this.server) return;

    await this.notifications.create(originalRequesterId, {
      type: 'FRIEND_ACCEPTED',
      title: 'Friend request accepted',
      body: `${accepterInfo.username} accepted your friend request`,
      data: { actorId: accepterInfo.id },
    });
    const unreadCount =
      await this.notifications.countUnread(originalRequesterId);
    this.server.to(originalRequesterId).emit('friend:request-accepted', {
      by: accepterInfo,
      friendshipCreatedAt,
      unreadCount,
    });
  }

  emitFriendRequestDeclined(
    originalRequesterId: string,
    declinerInfo: { id: string; username: string },
  ): void {
    if (!this.server) return;
    this.server.to(originalRequesterId).emit('friend:request-declined', {
      by: declinerInfo,
    });
  }

  emitFriendRemoved(
    friendId: string,
    removerInfo: { id: string; username: string },
  ): void {
    if (!this.server) return;
    this.server.to(friendId).emit('friend:removed', {
      by: removerInfo,
    });
  }

  async emitFriendListInvalidate(userId: string): Promise<void> {
    if (!this.server) return;
    this.server.to(userId).emit('friends:list-invalidate');
  }

  // ── Subscribe handlers (called by MatchGateway event routes) ────────────

  async handleSendRequest(
    client: AuthenticatedSocket,
    data: { receiverUsername: string; message?: string },
  ): Promise<{ success: true; request: FriendRequestEntry }> {
    if (!client.userId) {
      throw new Error('Not authenticated');
    }
    const request = await this.friends.sendRequest(
      client.userId,
      data.receiverUsername,
      data.message ?? null,
    );
    return { success: true, request };
  }

  async handleAcceptRequest(
    client: AuthenticatedSocket,
    data: { requestId: string },
  ): Promise<{ success: true; request: FriendRequestEntry }> {
    if (!client.userId) {
      throw new Error('Not authenticated');
    }
    const request = await this.friends.acceptRequest(
      client.userId,
      data.requestId,
    );
    return { success: true, request };
  }

  async handleDeclineRequest(
    client: AuthenticatedSocket,
    data: { requestId: string },
  ): Promise<{ success: true }> {
    if (!client.userId) {
      throw new Error('Not authenticated');
    }
    return this.friends.declineRequest(client.userId, data.requestId);
  }

  async handleUnfriend(
    client: AuthenticatedSocket,
    data: { friendId: string },
  ): Promise<{ success: true }> {
    if (!client.userId) {
      throw new Error('Not authenticated');
    }
    return this.friends.unfriend(client.userId, data.friendId);
  }
}

// ── Wire types for consumers ──────────────────────────────────────────────
export type { FriendEntry, FriendRequestEntry, FriendSuggestion };
