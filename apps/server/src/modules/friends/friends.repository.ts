import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { FriendRequest, Friendship, User } from '@prisma/client';
import { FriendRequestEntry } from './types';

type FriendWithUser = Friendship & {
  userA: Pick<User, 'id' | 'username' | 'avatarUrl' | 'rank'>;
  userB: Pick<User, 'id' | 'username' | 'avatarUrl' | 'rank'>;
};

type RequestWithUsers = FriendRequest & {
  sender: Pick<User, 'id' | 'username' | 'avatarUrl' | 'rank'>;
  receiver: Pick<User, 'id' | 'username' | 'avatarUrl' | 'rank'>;
};

const userSelectForFriends = {
  id: true,
  username: true,
  avatarUrl: true,
  rank: true,
} as const;

@Injectable()
export class FriendsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isBlocked(initiatorId: string, targetId: string): Promise<boolean> {
    const block = await this.prisma.block.findUnique({
      where: {
        initiatorId_targetId: {
          initiatorId: targetId,
          targetId: initiatorId,
        },
      },
      select: { id: true },
    });
    if (block) return true;

    const reverseBlock = await this.prisma.block.findUnique({
      where: {
        initiatorId_targetId: {
          initiatorId,
          targetId,
        },
      },
      select: { id: true },
    });
    return reverseBlock !== null;
  }

  async findUserByUsername(
    username: string,
  ): Promise<Pick<User, 'id' | 'username' | 'avatarUrl' | 'rank'> | null> {
    return this.prisma.user.findUnique({
      where: { username },
      select: userSelectForFriends,
    });
  }

  async findUserById(
    id: string,
  ): Promise<Pick<User, 'id' | 'username' | 'avatarUrl' | 'rank'> | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: userSelectForFriends,
    });
  }

  async areFriends(userAId: string, userBId: string): Promise<boolean> {
    const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
    const friendship = await this.prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      select: { id: true },
    });
    return friendship !== null;
  }

  async findExistingRequest(
    senderId: string,
    receiverId: string,
  ): Promise<FriendRequest | null> {
    return this.prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });
  }

  async findReverseRequest(
    senderId: string,
    receiverId: string,
  ): Promise<FriendRequest | null> {
    return this.prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: { senderId: receiverId, receiverId: senderId },
      },
    });
  }

  async createFriendRequest(
    senderId: string,
    receiverId: string,
    message: string | null,
    expiresAt: Date,
  ): Promise<FriendRequest> {
    return this.prisma.friendRequest.create({
      data: { senderId, receiverId, message, expiresAt },
    });
  }

  async deleteRequest(requestId: string): Promise<void> {
    await this.prisma.friendRequest.delete({ where: { id: requestId } });
  }

  async findRequestById(requestId: string): Promise<RequestWithUsers | null> {
    return this.prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: { select: userSelectForFriends },
        receiver: { select: userSelectForFriends },
      },
    });
  }

  async listIncomingRequests(
    receiverId: string,
    skip: number,
    take: number,
  ): Promise<RequestWithUsers[]> {
    return this.prisma.friendRequest.findMany({
      where: {
        receiverId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        sender: { select: userSelectForFriends },
        receiver: { select: userSelectForFriends },
      },
    });
  }

  async countIncomingRequests(receiverId: string): Promise<number> {
    return this.prisma.friendRequest.count({
      where: {
        receiverId,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async listOutgoingRequests(
    senderId: string,
    skip: number,
    take: number,
  ): Promise<RequestWithUsers[]> {
    return this.prisma.friendRequest.findMany({
      where: {
        senderId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        sender: { select: userSelectForFriends },
        receiver: { select: userSelectForFriends },
      },
    });
  }

  async createFriendship(
    userAId: string,
    userBId: string,
  ): Promise<Friendship> {
    const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
    return this.prisma.friendship.create({
      data: { userAId: a, userBId: b },
    });
  }

  async deleteFriendship(userAId: string, userBId: string): Promise<void> {
    const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
    await this.prisma.friendship.delete({
      where: { userAId_userBId: { userAId: a, userBId: b } },
    });
  }

  async listFriendships(userId: string): Promise<FriendWithUser[]> {
    return this.prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        userA: { select: userSelectForFriends },
        userB: { select: userSelectForFriends },
      },
    });
  }

  async countFriends(userId: string): Promise<number> {
    return this.prisma.friendship.count({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });
  }

  async getExcludedUserIdsForSuggestions(userId: string): Promise<Set<string>> {
    const [friendships, outgoingRequests, incomingRequests, blocks] = await Promise.all([
      this.prisma.friendship.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        select: { userAId: true, userBId: true },
      }),
      this.prisma.friendRequest.findMany({
        where: { senderId: userId },
        select: { receiverId: true },
      }),
      this.prisma.friendRequest.findMany({
        where: { receiverId: userId },
        select: { senderId: true },
      }),
      this.prisma.block.findMany({
        where: {
          OR: [{ initiatorId: userId }, { targetId: userId }],
        },
        select: { initiatorId: true, targetId: true },
      }),
    ]);

    const excluded = new Set<string>();
    for (const f of friendships) {
      excluded.add(f.userAId === userId ? f.userBId : f.userAId);
    }
    for (const r of outgoingRequests) {
      excluded.add(r.receiverId);
    }
    for (const r of incomingRequests) {
      excluded.add(r.senderId);
    }
    for (const b of blocks) {
      excluded.add(b.initiatorId === userId ? b.targetId : b.initiatorId);
    }
    
    // Also exclude themselves
    excluded.add(userId);

    return excluded;
  }

  async findUserIdsNearRank(
    userId: string,
    userRank: number,
    window: number,
    limit: number,
  ): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { rank: { gte: userRank - window, lte: userRank + window } },
        ],
      },
      orderBy: { rank: 'desc' },
      take: limit,
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  async findRecentOpponentIds(
    userId: string,
    limit: number,
  ): Promise<string[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ participants: { some: { id: userId } } }, { winnerId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        participants: { select: { id: true } },
        winnerId: true,
      },
    });

    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const match of matches) {
      for (const p of match.participants) {
        if (p.id !== userId && !seen.has(p.id)) {
          seen.add(p.id);
          ordered.push(p.id);
          if (ordered.length >= limit) return ordered;
        }
      }
    }
    return ordered;
  }

  async findUsersByIds(
    ids: string[],
  ): Promise<Array<Pick<User, 'id' | 'username' | 'avatarUrl' | 'rank'>>> {
    if (ids.length === 0) return [];
    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: userSelectForFriends,
    });
  }

  async countMutualFriends(userAId: string, userBId: string): Promise<number> {
    const aFriends = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userAId }, { userBId: userAId }],
      },
      select: { userAId: true, userBId: true },
    });
    const aSet = new Set<string>();
    for (const f of aFriends) {
      aSet.add(f.userAId === userAId ? f.userBId : f.userAId);
    }

    const bFriends = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userBId }, { userBId: userBId }],
      },
      select: { userAId: true, userBId: true },
    });

    let mutual = 0;
    for (const f of bFriends) {
      const other = f.userAId === userBId ? f.userBId : f.userAId;
      if (aSet.has(other)) mutual++;
    }
    return mutual;
  }

  async searchUsers(
    query: string,
    excludeUserId: string,
    limit: number,
  ): Promise<Array<Pick<User, 'id' | 'username' | 'avatarUrl' | 'rank'>>> {
    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: excludeUserId } },
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: [{ rank: 'desc' }, { username: 'asc' }],
      take: limit,
      select: userSelectForFriends,
    });
  }

  mapToRequestEntry(req: RequestWithUsers): FriendRequestEntry {
    return {
      id: req.id,
      sender: req.sender,
      receiver: req.receiver,
      message: req.message,
      createdAt: req.createdAt.toISOString(),
      expiresAt: req.expiresAt.toISOString(),
    };
  }
}
