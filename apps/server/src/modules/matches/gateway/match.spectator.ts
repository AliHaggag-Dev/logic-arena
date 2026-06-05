import { Server } from 'socket.io';
import { MatchState } from './match.state';
import { AuthenticatedSocket } from './types';

export class SpectatorManager {
  constructor(
    private state: MatchState,
    private server: Server,
  ) {}

  handleSpectate(client: AuthenticatedSocket, data: { matchId: string }) {
    if (!data?.matchId) {
      client.emit('error', { message: 'Invalid matchId.' });
      return;
    }

    const match = this.state.matches.get(data.matchId);
    if (!match) {
      client.emit('error', { message: 'Match not found or not active.' });
      return;
    }

    (client as AuthenticatedSocket & { isSpectator?: boolean }).isSpectator =
      true;
    client.matchId = data.matchId;
    client.join(data.matchId);

    if (!this.state.spectatorSockets.has(data.matchId)) {
      this.state.spectatorSockets.set(data.matchId, new Set<string>());
    }
    const spectators = this.state.spectatorSockets.get(data.matchId)!;
    spectators.add(client.id);

    client.emit('gameState', { type: 'full', state: match.getState() });
    this.server.to(data.matchId).emit('spectatorCount', spectators.size);
    client.emit('spectateJoined', { matchId: data.matchId });
  }

  handleLeaveSpectate(client: AuthenticatedSocket) {
    if (!client.matchId) return;

    const spectators = this.state.spectatorSockets.get(client.matchId);
    if (spectators) {
      spectators.delete(client.id);
      this.server.to(client.matchId).emit('spectatorCount', spectators.size);
    }

    client.leave(client.matchId);
    (client as AuthenticatedSocket & { isSpectator?: boolean }).isSpectator =
      false;
    client.matchId = undefined;
  }

  removeSpectator(client: AuthenticatedSocket) {
    if (!client.matchId || !client.isSpectator) return;
    const spectators = this.state.spectatorSockets.get(client.matchId);
    if (spectators) {
      spectators.delete(client.id);
      this.server.to(client.matchId).emit('spectatorCount', spectators.size);
    }
  }
}
