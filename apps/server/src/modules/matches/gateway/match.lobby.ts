import { Server } from 'socket.io';
import { PrismaService } from '../../../common/prisma.service';
import { MatchState } from './match.state';
import { AuthenticatedSocket } from './types';
import { MatchEngine } from '../match.engine';
import * as crypto from 'crypto';

export class MatchLobbyManager {
  constructor(
    private state: MatchState,
    private server: Server,
    private prisma: PrismaService,
  ) { }

  async handleJoinMatch(
    client: AuthenticatedSocket,
    data: { matchId: string; scriptId: string; mode?: 'COMBAT' | 'RACING' | 'TRAINING_SOLO' },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized: User not authenticated.' });
      return;
    }
    if (!data.scriptId) {
      client.emit('error', { message: 'Invalid scriptId provided.' });
      return;
    }

    const script = await this.prisma.robotScript.findUnique({
      where: { id: data.scriptId, userId: client.userId },
    });
    if (!script) {
      client.emit('error', { message: 'Script not found or unauthorized.' });
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: client.userId },
      select: { selectedColor: true },
    });

    let match = this.state.matches.get(data.matchId);
    const currentMode = this.state.matchModes.get(data.matchId);
    const mode = data.mode || 'COMBAT';

    // If mode changed, tear down the old match instance
    if (match && currentMode && currentMode !== mode) {
      match.stop();
      this.state.cleanupMatch(data.matchId);
      match = undefined;
    }

    if (!match) {
      const playerToken = {
        id: client.userId,
        script: script.content,
        color: user?.selectedColor ?? '#22d3ee',
      };

      const initialPlayers =
        mode === 'RACING' || mode === 'TRAINING_SOLO'
          ? [playerToken]
          : [playerToken, { id: 'bot-2', script: '', color: '#ff00ff' }];

      match = new MatchEngine(data.matchId, initialPlayers, {
        mode,
        disableProjectiles: mode === 'RACING' || mode === 'TRAINING_SOLO',
      });
      this.state.matches.set(data.matchId, match);
      this.state.matchModes.set(data.matchId, mode);
      this.state.matchStartTime.set(data.matchId, Date.now());
      match.start();

      // update match status to in_progress and set startedAt
      await this.prisma.match.upsert({
        where: { id: data.matchId },
        create: {
          id: data.matchId,
          type: 'Friendly',
          status: 'in_progress',
          startedAt: new Date(),
          duration: 0,
        },
        update: {
          status: 'in_progress',
          startedAt: new Date(),
        },
      });
    } else {
      if (this.state.lobbyMatches.has(data.matchId)) {
        match.removePlayer('bot-2');
        match.addPlayer({ id: client.userId!, script: script.content, color: user?.selectedColor ?? '#22d3ee' });
        this.state.lobbyMatches.delete(data.matchId);
        this.server.emit('lobbyUpdated', Array.from(this.state.lobbyMatches.values()));
      } else {
        match.removePlayer(client.userId!);
        match.addPlayer({ id: client.userId!, script: script.content, color: user?.selectedColor ?? '#22d3ee' });
        match.updateInitialPlayer(client.userId!, script.content);
      }
    }

    client.matchId = data.matchId;
    client.join(data.matchId);
    client.emit('matchJoinedInfo', { mode });
    this.server.to(data.matchId).emit('gameState', match.getState());
  }

  async handleCreateMatch(
    client: AuthenticatedSocket,
    data: { scriptId: string },
  ) {
    if (!client.userId) return;
    const user = await this.prisma.user.findUnique({ where: { id: client.userId } });
    const matchId = crypto.randomUUID();

    // save match in db with status pending
    await this.prisma.match.create({
      data: {
        id: matchId,
        type: 'Friendly',
        status: 'pending',
        duration: 0,
      },
    });

    this.state.lobbyMatches.set(matchId, {
      hostId: client.userId,
      hostName: user?.username || 'Unknown Hacker',
      matchId,
      createdAt: Date.now(),
    });
    client.emit('matchCreated', { matchId });
    this.server.emit('lobbyUpdated', Array.from(this.state.lobbyMatches.values()));
  }

  handleGetLobby(client: AuthenticatedSocket) {
    client.emit('lobbyList', Array.from(this.state.lobbyMatches.values()));
  }

  handleResetGame(client: AuthenticatedSocket, data: { matchId: string }) {
    if (client.matchId && this.state.matches.has(client.matchId)) {
      const match = this.state.matches.get(client.matchId);
      match?.reset();
      this.server.to(client.matchId).emit('gameState', match?.getState());
    }
  }

  handleUpdateLogic(client: AuthenticatedSocket, data: { robotId: string; scriptContent: string }) {
    if (client.matchId && this.state.matches.has(client.matchId)) {
      const match = this.state.matches.get(client.matchId);
      match?.updateRobotScript(data.robotId, data.scriptContent);
      client.emit('logicExecuted', {
        robotId: data.robotId,
        action: 'SCRIPT_DEPLOYED',
        message: 'Neural payload active.',
      });
    }
  }

  handleManualCommand(client: AuthenticatedSocket, data: { command: string }) {
    if (client.matchId && this.state.matches.has(client.matchId)) {
      const match = this.state.matches.get(client.matchId)!;
      const executed = match.receiveManualCommand(client.userId!, data.command);
      if (!executed) {
        client.emit('logicExecuted', {
          robotId: client.userId,
          action: 'STASIS',
          message: '[STASIS] Manual override rejected — robot is recharging.',
        });
      } else {
        client.emit('logicExecuted', {
          robotId: client.userId,
          action: data.command.toUpperCase(),
          message: `Manual override: ${data.command.toUpperCase()}`,
        });
      }
    }
  }

  handleToggleLockVision(client: AuthenticatedSocket) {
    if (client.matchId && this.state.matches.has(client.matchId)) {
      const match = this.state.matches.get(client.matchId)!;
      const newState = match.toggleLockVision(client.userId!);
      client.emit('lockVisionToggled', {
        robotId: client.userId,
        lockVision: newState,
      });
    }
  }
}
