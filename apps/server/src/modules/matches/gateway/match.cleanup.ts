import { Server } from 'socket.io';
import { RedisService } from '../../../common/redis.service';
import { MatchState } from './match.state';
import { LOBBY_ROOM } from './match.lobby';

export class CleanupManager {
  constructor(
    private state: MatchState,
    private server: Server,
    private redisService: RedisService,
    private disconnectCleanupTimers: Map<string, NodeJS.Timeout>,
  ) {}

  cancel(userId: string): void {
    const existingTimer = this.disconnectCleanupTimers.get(userId);
    if (!existingTimer) return;
    clearTimeout(existingTimer);
    this.disconnectCleanupTimers.delete(userId);
  }

  schedule(userId: string): void {
    this.cancel(userId);
    const timer = setTimeout(async () => {
      this.disconnectCleanupTimers.delete(userId);
      const isOnline = await this.redisService.get(`user:online:${userId}`);
      if (!isOnline) {
        // Clean up lobby matches for this user
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

        // Stop active match if user was the sole human player (training/solo)
        const status = this.state.userStatus.get(userId);
        if (status?.status === 'in-match') {
          const matchId = status.matchId;
          const match = this.state.matches.get(matchId);
          if (match) {
            const mode = this.state.matchModes.get(matchId);
            if (
              mode === 'TRAINING_SOLO' ||
              mode === 'SURVIVAL' ||
              mode === 'RACING'
            ) {
              match.stop();
              this.state.cleanupMatch(matchId);
            } else {
              // Multiplayer: remove disconnected player's robot
              match.removePlayer(userId);
            }
          }
        }
      }
    }, 2000);
    this.disconnectCleanupTimers.set(userId, timer);
  }

  clearAll(): void {
    for (const timer of this.disconnectCleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectCleanupTimers.clear();
  }
}
