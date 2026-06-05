import { Server } from 'socket.io';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import { MatchState } from './match.state';
import { AuthenticatedSocket } from './types';
import { MatchEngine } from '../match.engine';
import { GameMode, MapTheme } from '@logic-arena/engine';
import * as crypto from 'crypto';
import {
  loadPlayerScriptAndLoadout,
  createAndStartMatch,
} from './match.lobby-init';

const LOBBY_CACHE_KEY = 'lobby:matches';
const LOBBY_CACHE_TTL = 120;
export const LOBBY_ROOM = 'lobby:viewers';
export const LEADERBOARD_ROOM = 'leaderboard:viewers';

export class MatchLobbyManager {
  constructor(
    private state: MatchState,
    private server: Server,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private async publishLobbySnapshot(): Promise<void> {
    const snapshot = Array.from(this.state.lobbyMatches.values());
    await this.redis.set(LOBBY_CACHE_KEY, snapshot, LOBBY_CACHE_TTL);
    this.server.to(LOBBY_ROOM).emit('lobbyUpdated', snapshot);
  }

  async handleJoinMatch(
    client: AuthenticatedSocket,
    data: {
      matchId: string;
      scriptId: string;
      mode?: GameMode;
      mapTheme?: MapTheme;
    },
  ) {
    if (!client.userId) {
      client.emit('error', {
        message: 'Unauthorized: User not authenticated.',
      });
      return;
    }
    if (!data.scriptId) {
      client.emit('error', { message: 'Invalid scriptId provided.' });
      return;
    }

    const loadout = await loadPlayerScriptAndLoadout(
      this.prisma,
      this.redis,
      client,
      data.scriptId,
    );
    if (!loadout) return;

    let match = this.state.matches.get(data.matchId);
    const currentMode = this.state.matchModes.get(data.matchId);
    const mode = data.mode || 'COMBAT';
    const currentTheme = match?.getState().mapTheme || 'CYBER';
    const requestedTheme = data.mapTheme || 'CYBER';

    if (
      match &&
      ((currentMode && currentMode !== mode) || currentTheme !== requestedTheme)
    ) {
      match.stop();
      this.state.cleanupMatch(data.matchId);
      match = undefined;
    }

    if (!match) {
      match = await createAndStartMatch(
        this.state,
        this.server,
        this.prisma,
        data.matchId,
        {
          id: client.userId,
          script: loadout.scriptContent,
          color: loadout.selectedColor,
          model: loadout.selectedRobotId,
          tracerColor: loadout.selectedTracerColor,
        },
        mode,
        data.mapTheme || 'CYBER',
      );
    } else {
      if (this.state.lobbyMatches.has(data.matchId)) {
        match.removePlayer('bot-2');
        match.addPlayer({
          id: client.userId,
          script: loadout.scriptContent,
          color: loadout.selectedColor,
          model: loadout.selectedRobotId,
        });
        this.state.lobbyMatches.delete(data.matchId);
        await this.publishLobbySnapshot();
      } else {
        const isReconnect = match
          .getState()
          .robots.some((r) => r.id === client.userId);
        if (!isReconnect) {
          match.removePlayer('bot-2');
        } else {
          match.removePlayer(client.userId);
        }
        match.addPlayer({
          id: client.userId,
          script: loadout.scriptContent,
          color: loadout.selectedColor,
          model: loadout.selectedRobotId,
        });
        match.updateInitialPlayer(client.userId, loadout.scriptContent);
      }
    }

    client.matchId = data.matchId;
    client.join(data.matchId);
    client.emit('matchJoinedInfo', { mode });
    this.server
      .to(data.matchId)
      .emit('gameState', { type: 'full', state: match.getState() });

    if (client.userId && !client.isGuest) {
      this.state.userStatus.set(client.userId, {
        status: 'in-match',
        matchId: data.matchId,
      });
      this.server.to(LEADERBOARD_ROOM).emit('userStatusUpdate', {
        userId: client.userId,
        status: 'in-match',
        matchId: data.matchId,
      });
    }
  }

  async handleCreateMatch(
    client: AuthenticatedSocket,
    data: { scriptId: string },
  ) {
    if (!client.userId) return;

    // Check if user already has an active WAITING match
    for (const match of this.state.lobbyMatches.values()) {
      if (match.hostId === client.userId) {
        client.emit('createMatchError', {
          message: 'You already have an active match in the lobby.',
        });
        return;
      }
    }

    // Rate limiting: max 3 matches per minute per userId
    const rateLimitKey = `lobby:create:${client.userId}`;
    const currentCount = await this.redis.incr(rateLimitKey, 60);

    if (currentCount > 3) {
      client.emit('createMatchError', {
        message:
          'Rate limit exceeded. Please wait before creating another match.',
      });
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: client.userId },
    });
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
    await this.publishLobbySnapshot();

    return { matchId };
  }

  async handleGetLobby(client: AuthenticatedSocket) {
    client.join(LOBBY_ROOM);
    const localLobby = Array.from(this.state.lobbyMatches.values());
    if (localLobby.length > 0) {
      client.emit('lobbyList', localLobby);
      return;
    }

    const cachedLobby = await this.redis.get<unknown[]>(LOBBY_CACHE_KEY);
    client.emit('lobbyList', cachedLobby ?? []);
  }

  handleLeaveLobby(client: AuthenticatedSocket) {
    client.leave(LOBBY_ROOM);
  }

  handleResetGame(client: AuthenticatedSocket, data: { matchId: string }) {
    if (client.matchId && this.state.matches.has(client.matchId)) {
      const match = this.state.matches.get(client.matchId);
      match?.reset();
      this.server
        .to(client.matchId)
        .emit('gameState', { type: 'full', state: match?.getState() });
    }
  }

  handleUpdateLogic(
    client: AuthenticatedSocket,
    data: { robotId: string; scriptContent: string },
  ) {
    if (client.matchId && this.state.matches.has(client.matchId)) {
      if (data.robotId !== client.userId && !data.robotId.startsWith('bot-'))
        return;
      const match = this.state.matches.get(client.matchId);
      match?.updateRobotScript(data.robotId, data.scriptContent);
      client.emit('logicExecuted', {
        robotId: data.robotId,
        action: 'SCRIPT_DEPLOYED',
        message: 'Neural payload active.',
      });
    }
  }

  handleManualCommand(
    client: AuthenticatedSocket,
    data: { robotId?: string; command: string },
  ) {
    if (client.matchId && this.state.matches.has(client.matchId)) {
      const targetRobotId = data.robotId || client.userId!;
      // Only allow if it's the user's own robot or a test bot
      if (targetRobotId !== client.userId && !targetRobotId.startsWith('bot-'))
        return;

      const match = this.state.matches.get(client.matchId)!;
      const executed = match.receiveManualCommand(targetRobotId, data.command);
      if (!executed) {
        client.emit('logicExecuted', {
          robotId: targetRobotId,
          action: 'STASIS',
          message: '[STASIS] Manual override rejected — robot is recharging.',
        });
      } else {
        client.emit('logicExecuted', {
          robotId: targetRobotId,
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

  handleRespawnDummies(client: AuthenticatedSocket) {
    if (!client.matchId || !this.state.matches.has(client.matchId)) return;
    const match = this.state.matches.get(client.matchId)!;
    const state = match.getState();
    for (const robot of state.robots) {
      if (robot.id.startsWith('dummy-')) {
        robot.health = 100;
        robot.isAlive = true;
        if (robot.energy !== undefined) robot.energy = robot.maxEnergy ?? 100;
        robot.inStasis = false;
      }
    }
    // Clear the killed-set so the same dummies can fire dummyKilled again
    this.state.dummyKilledThisTick.delete(client.matchId);
    this.server
      .to(client.matchId)
      .emit('gameState', { type: 'full', state: match.getState() });
  }
}
