import { Server } from 'socket.io';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import { AuthenticatedSocket } from './types';
import * as crypto from 'crypto';

export class MatchSocialManager {
  constructor(
    private server: Server,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async handlePing(client: AuthenticatedSocket) {
    if (client.userId) {
      await this.redisService.set(`user:online:${client.userId}`, '1', 300);
      client.emit('pong');
    }
  }

  async handleSendChallenge(client: AuthenticatedSocket, data: { targetUserId: string }) {
    if (!client.userId) return;

    const isOnline = await this.redisService.get(`user:online:${data.targetUserId}`);
    if (!isOnline) {
      client.emit('challenge-failed', { reason: 'TARGET_OFFLINE' });
      return;
    }

    const sockets = await this.server.fetchSockets();
    const targetSocket = sockets.find((s: any) => s.userId === data.targetUserId);
    if (!targetSocket) {
      client.emit('challenge-failed', { reason: 'TARGET_OFFLINE' });
      return;
    }

    const challenger = await this.prisma.user.findUnique({
      where:  { id: client.userId },
      select: { username: true },
    });

    targetSocket.emit('challenge-received', {
      challengerId:   client.userId,
      challengerName: challenger?.username ?? 'UNKNOWN',
    });

    client.emit('challenge-sent', { targetUserId: data.targetUserId });
  }

  async handleAcceptChallenge(client: AuthenticatedSocket, data: { challengerId: string }) {
    if (!client.userId) return;

    const matchId = crypto.randomUUID();

    client.emit('challenge-accepted', { matchId });

    const sockets = await this.server.fetchSockets();
    const challengerSocket = sockets.find((s: any) => s.userId === data.challengerId);
    if (challengerSocket) {
      challengerSocket.emit('challenge-accepted', { matchId });
    }
  }
}
