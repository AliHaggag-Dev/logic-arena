import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { FriendsRepository } from './friends.repository';
import { SuggestionsService } from './suggestions.service';
import { RedisService } from '../../common/redis.service';
import { PrismaService } from '../../common/prisma.service';
import { MatchState } from '../matches/gateway/match.state';
import { FriendsGateway } from './friends.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import {
  FRIEND_LIST_CACHE_TTL,
  FRIEND_REQUEST_RATE_LIMIT_MAX,
  FRIEND_REQUEST_RATE_LIMIT_WINDOW_SECONDS,
  FRIEND_REQUEST_TTL_DAYS,
  FriendEntry,
  FriendPresenceStatus,
  FriendRequestEntry,
  FriendSuggestion,
  PENDING_REQUESTS_LIMIT,
  USER_SEARCH_CACHE_TTL,
  USER_SEARCH_LIMIT,
  UserSearchResult,
  friendListCacheKey,
  friendRequestRateLimitKey,
  userSearchCacheKey,
} from './types';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    private readonly repo: FriendsRepository,
    private readonly suggestions: SuggestionsService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly matchState: MatchState,
    @Inject(forwardRef(() => FriendsGateway))
    private readonly gateway: FriendsGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async sendRequest(
    senderId: string,
    receiverUsername: string,
    message: string | null,
  ): Promise<FriendRequestEntry> {
    if (!receiverUsername) {
      throw new BadRequestException('Receiver username is required');
    }

    const receiver = await this.repo.findUserByUsername(receiverUsername);
    if (!receiver) {
      throw new NotFoundException('User not found');
    }
    if (receiver.id === senderId) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }

    const blocked = await this.repo.isBlocked(senderId, receiver.id);
    if (blocked) {
      throw new ForbiddenException(
        'You cannot send a friend request to this user',
      );
    }

    const alreadyFriends = await this.repo.areFriends(senderId, receiver.id);
    if (alreadyFriends) {
      throw new ConflictException('You are already friends with this user');
    }

    const existing = await this.repo.findExistingRequest(senderId, receiver.id);
    if (existing && existing.expiresAt > new Date()) {
      throw new ConflictException('Friend request already pending');
    }
    if (existing) {
      await this.repo.deleteRequest(existing.id);
    }

    const reverse = await this.repo.findReverseRequest(senderId, receiver.id);
    if (reverse && reverse.expiresAt > new Date()) {
      return this.handleMutualAutoAccept(
        reverse.id,
        senderId,
        receiver.id,
        receiver,
      );
    }
    if (reverse) {
      await this.repo.deleteRequest(reverse.id);
    }

    const rate = await this.redis.incr(
      friendRequestRateLimitKey(senderId),
      FRIEND_REQUEST_RATE_LIMIT_WINDOW_SECONDS,
    );
    if (rate > FRIEND_REQUEST_RATE_LIMIT_MAX) {
      throw new ForbiddenException(
        `Daily friend request limit reached (${FRIEND_REQUEST_RATE_LIMIT_MAX}/day)`,
      );
    }

    const sender = await this.repo.findUserById(senderId);
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + FRIEND_REQUEST_TTL_DAYS);

    const request = await this.repo.createFriendRequest(
      senderId,
      receiver.id,
      message ?? null,
      expiresAt,
    );

    await this.suggestions.invalidate(senderId);
    await this.suggestions.invalidate(receiver.id);

    const entry: FriendRequestEntry = {
      id: request.id,
      sender,
      receiver,
      message: request.message,
      createdAt: request.createdAt.toISOString(),
      expiresAt: request.expiresAt.toISOString(),
    };

    await this.notifications.create(receiver.id, {
      type: 'FRIEND_REQUEST',
      title: 'New friend request',
      body: `${sender.username} sent you a friend request`,
      data: {
        actorId: senderId,
        requestId: request.id,
        actorUsername: sender.username,
      },
    });
    await this.gateway.emitFriendRequestReceived(receiver.id, entry);

    return entry;
  }

  private async handleMutualAutoAccept(
    reverseRequestId: string,
    senderId: string,
    receiverId: string,
    receiver: {
      id: string;
      username: string;
      avatarUrl: string | null;
      rank: number;
    },
  ): Promise<FriendRequestEntry> {
    const sender = await this.repo.findUserById(senderId);
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const reverseRequest = await this.repo.findRequestById(reverseRequestId);
    if (!reverseRequest) {
      throw new NotFoundException('Original request not found');
    }

    const friendship = await this.repo.createFriendship(senderId, receiverId);
    await this.repo.deleteRequest(reverseRequestId);
    await this.suggestions.invalidate(senderId);
    await this.suggestions.invalidate(receiverId);
    await this.redis.del(
      friendListCacheKey(senderId),
      friendListCacheKey(receiverId),
    );

    const entry: FriendRequestEntry = {
      id: reverseRequestId,
      sender,
      receiver,
      message: reverseRequest.message,
      createdAt: reverseRequest.createdAt.toISOString(),
      expiresAt: reverseRequest.expiresAt.toISOString(),
    };

    await this.gateway.emitFriendRequestAccepted(
      receiverId,
      { id: senderId, username: sender.username },
      friendship.createdAt.toISOString(),
    );

    return entry;
  }

  async listIncomingRequests(
    userId: string,
    skip: number,
    take: number,
  ): Promise<{ items: FriendRequestEntry[]; total: number }> {
    const safeTake = Math.min(take, PENDING_REQUESTS_LIMIT);
    const requests = await this.repo.listIncomingRequests(
      userId,
      skip,
      safeTake,
    );
    const total = await this.repo.countIncomingRequests(userId);
    return {
      items: requests.map((r) => this.repo.mapToRequestEntry(r)),
      total,
    };
  }

  async listOutgoingRequests(
    userId: string,
    skip: number,
    take: number,
  ): Promise<FriendRequestEntry[]> {
    const safeTake = Math.min(take, PENDING_REQUESTS_LIMIT);
    const requests = await this.repo.listOutgoingRequests(
      userId,
      skip,
      safeTake,
    );
    return requests.map((r) => this.repo.mapToRequestEntry(r));
  }

  async acceptRequest(
    userId: string,
    requestId: string,
  ): Promise<FriendRequestEntry> {
    const request = await this.repo.findRequestById(requestId);
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }
    if (request.receiverId !== userId) {
      throw new ForbiddenException(
        'You are not authorised to accept this request',
      );
    }
    if (request.expiresAt < new Date()) {
      await this.repo.deleteRequest(requestId);
      throw new GoneException('Friend request has expired');
    }

    const friendship = await this.repo.createFriendship(
      request.senderId,
      request.receiverId,
    );
    await this.repo.deleteRequest(requestId);
    await this.suggestions.invalidate(request.senderId);
    await this.suggestions.invalidate(request.receiverId);
    await this.redis.del(
      friendListCacheKey(request.senderId),
      friendListCacheKey(request.receiverId),
    );

    const receiver = await this.repo.findUserById(userId);
    if (receiver) {
      await this.gateway.emitFriendRequestAccepted(
        request.senderId,
        { id: userId, username: receiver.username },
        friendship.createdAt.toISOString(),
      );
    }

    return this.repo.mapToRequestEntry(request);
  }

  async declineRequest(
    userId: string,
    requestId: string,
  ): Promise<{ success: true }> {
    const request = await this.repo.findRequestById(requestId);
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }
    if (request.receiverId !== userId) {
      throw new ForbiddenException(
        'You are not authorised to decline this request',
      );
    }
    await this.repo.deleteRequest(requestId);

    const decliner = await this.repo.findUserById(userId);
    if (decliner) {
      await this.gateway.emitFriendRequestDeclined(request.senderId, {
        id: userId,
        username: decliner.username,
      });
    }

    return { success: true };
  }

  async unfriend(userId: string, friendId: string): Promise<{ success: true }> {
    if (userId === friendId) {
      throw new BadRequestException('Invalid friend id');
    }
    const areFriends = await this.repo.areFriends(userId, friendId);
    if (!areFriends) {
      throw new NotFoundException('You are not friends with this user');
    }
    await this.repo.deleteFriendship(userId, friendId);
    await this.suggestions.invalidate(userId);
    await this.suggestions.invalidate(friendId);
    await this.redis.del(
      friendListCacheKey(userId),
      friendListCacheKey(friendId),
    );

    const remover = await this.repo.findUserById(userId);
    if (remover) {
      await this.gateway.emitFriendRemoved(friendId, {
        id: userId,
        username: remover.username,
      });
    }

    return { success: true };
  }

  async listFriends(userId: string): Promise<FriendEntry[]> {
    const cacheKey = friendListCacheKey(userId);
    const cached = await this.redis.get<FriendEntry[]>(cacheKey);
    if (cached) return cached;

    const friendships = await this.repo.listFriendships(userId);
    if (friendships.length === 0) {
      await this.redis.set(cacheKey, [], FRIEND_LIST_CACHE_TTL);
      return [];
    }

    const friendIds = friendships.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );

    const presencePairs =
      friendIds.length > 0 && this.redis.healthy
        ? await this.redis
            .getClient()
            .mget(...friendIds.map((id) => `user:online:${id}`))
        : [];

    const inMatchIds = this.collectInMatchIds(friendIds);

    const entries: FriendEntry[] = friendships.map((f, idx) => {
      const friend = f.userAId === userId ? f.userB : f.userA;
      const friendId = friend.id;
      const isOnline =
        presencePairs[idx] !== null && presencePairs[idx] !== undefined;
      const inMatch = inMatchIds.get(friendId);
      const status: FriendPresenceStatus = inMatch
        ? 'in-match'
        : isOnline
          ? 'online'
          : 'offline';
      return {
        id: friend.id,
        username: friend.username,
        avatarUrl: friend.avatarUrl,
        rank: friend.rank,
        status,
        inMatchId: inMatch ?? null,
        lastSeenAt: null,
        friendshipCreatedAt: f.createdAt.toISOString(),
      };
    });

    await this.redis.set(cacheKey, entries, FRIEND_LIST_CACHE_TTL);
    return entries;
  }

  private collectInMatchIds(userIds: string[]): Map<string, string> {
    const out = new Map<string, string>();
    for (const id of userIds) {
      const status = this.matchState.userStatus.get(id);
      if (status?.status === 'in-match') {
        out.set(id, status.matchId);
      }
    }
    return out;
  }

  async getSuggestions(userId: string): Promise<FriendSuggestion[]> {
    return this.suggestions.getSuggestions(userId);
  }

  async searchUsers(
    viewerId: string,
    query: string,
  ): Promise<UserSearchResult[]> {
    const cacheKey = userSearchCacheKey(query, viewerId);
    const cached = await this.redis.get<UserSearchResult[]>(cacheKey);
    if (cached) return cached;

    const users = await this.repo.searchUsers(
      query,
      viewerId,
      USER_SEARCH_LIMIT,
    );
    if (users.length === 0) {
      await this.redis.set(cacheKey, [], USER_SEARCH_CACHE_TTL);
      return [];
    }

    const userIds = users.map((u) => u.id);

    const [friendPairs, outgoingRequests, incomingRequests, blocks] =
      await Promise.all([
        this.prisma.friendship.findMany({
          where: {
            OR: [
              { userAId: viewerId, userBId: { in: userIds } },
              { userBId: viewerId, userAId: { in: userIds } },
            ],
          },
          select: { userAId: true, userBId: true },
        }),
        this.prisma.friendRequest.findMany({
          where: { senderId: viewerId, receiverId: { in: userIds } },
          select: { receiverId: true },
        }),
        this.prisma.friendRequest.findMany({
          where: { receiverId: viewerId, senderId: { in: userIds } },
          select: { senderId: true },
        }),
        this.prisma.block.findMany({
          where: {
            OR: [
              { initiatorId: viewerId, targetId: { in: userIds } },
              { initiatorId: { in: userIds }, targetId: viewerId },
            ],
          },
          select: { initiatorId: true, targetId: true },
        }),
      ]);

    const friendSet = new Set<string>();
    for (const f of friendPairs) {
      friendSet.add(f.userAId === viewerId ? f.userBId : f.userAId);
    }
    const outgoingSet = new Set(outgoingRequests.map((r) => r.receiverId));
    const incomingSet = new Set(incomingRequests.map((r) => r.senderId));
    const blockedSet = new Set<string>();
    for (const b of blocks) {
      blockedSet.add(b.initiatorId === viewerId ? b.targetId : b.initiatorId);
    }

    const results: UserSearchResult[] = users.map((u) => ({
      id: u.id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      rank: u.rank,
      isFriend: friendSet.has(u.id),
      hasPendingRequestFromYou: outgoingSet.has(u.id),
      hasPendingRequestToYou: incomingSet.has(u.id),
      isBlocked: blockedSet.has(u.id),
    }));

    await this.redis.set(cacheKey, results, USER_SEARCH_CACHE_TTL);
    return results;
  }
}
