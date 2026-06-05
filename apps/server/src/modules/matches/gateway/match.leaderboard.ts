import { Server } from 'socket.io';
import { MatchState } from './match.state';
import { AuthenticatedSocket } from './types';
import { LEADERBOARD_ROOM } from './match.lobby';

export async function handleJoinLeaderboard(
  client: AuthenticatedSocket,
  server: Server,
  state: MatchState,
) {
  client.join(LEADERBOARD_ROOM);

  const allSockets = await server.fetchSockets();
  const seenUserIds = new Set<string>();
  const snapshot: Array<{
    userId: string;
    isOnline: boolean;
    matchId?: string;
  }> = [];

  for (const s of allSockets) {
    const sock = s as unknown as AuthenticatedSocket;
    if (!sock.userId || sock.isGuest || seenUserIds.has(sock.userId)) continue;
    seenUserIds.add(sock.userId);
    const status = state.userStatus.get(sock.userId);
    snapshot.push({
      userId: sock.userId,
      isOnline: true,
      matchId: status?.status === 'in-match' ? status.matchId : undefined,
    });
  }

  client.emit('userStatusSnapshot', snapshot);
}
