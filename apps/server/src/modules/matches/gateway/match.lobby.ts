import { Server } from 'socket.io';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import { MatchState, type ArenaMatchMode } from './match.state';
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

function toArenaMatchMode(mode?: GameMode): ArenaMatchMode {
  return mode === 'TACTICAL' ? 'TACTICAL' : 'CLASSIC';
}

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
      matchMode?: 'CLASSIC' | 'TACTICAL' | 'HYBRID';
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
    const currentTheme = match?.getState().mapTheme || 'CYBER';
    const waitingMatch = this.state.lobbyMatches.get(data.matchId);
    const mode = data.mode || waitingMatch?.mode || 'COMBAT';
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
        data.matchMode || 'CLASSIC',
        data.mapTheme || 'CYBER',
      );
    } else {
      if (this.state.lobbyMatches.has(data.matchId)) {
        // Lobby-to-match flow: replace bot-2 placeholder
        match.removePlayer('bot-2');
        match.addPlayer({
          id: client.userId,
          script: loadout.scriptContent,
          color: loadout.selectedColor,
          model: loadout.selectedRobotId,
          tracerColor: loadout.selectedTracerColor,
        });
        this.state.lobbyMatches.delete(data.matchId);
        await this.publishLobbySnapshot();
      } else {
        // Non-lobby match: handle reconnect or join
        const existingRobots = match.getState().robots;
        const isReconnect = existingRobots.some((r) => r.id === client.userId);

        if (isReconnect) {
          // Same userId reconnecting — remove and re-add
          match.removePlayer(client.userId);
        } else {
          // New userId joining an existing match
          // Remove any stale robot from a previous guest connection first
          const staleGuestRobot = existingRobots.find(
            (r) => r.id.startsWith('guest_') && r.id !== client.userId,
          );
          if (staleGuestRobot) {
            match.removePlayer(staleGuestRobot.id);
          }
          match.removePlayer('bot-2');
        }

        match.addPlayer({
          id: client.userId,
          script: loadout.scriptContent,
          color: loadout.selectedColor,
          model: loadout.selectedRobotId,
          tracerColor: loadout.selectedTracerColor,
        });
        match.updateInitialPlayer(client.userId, loadout.scriptContent);
      }
    }

    client.matchId = data.matchId;
    client.join(data.matchId);
    const phaseEndsAt = this.state.phaseEndsAt.get(data.matchId) ?? Date.now();
    const timeLeft = Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000));

    client.emit('matchJoinedInfo', {
      mode,
      phase: this.state.matchPhases.get(data.matchId) ?? 'ROUND_ACTIVE',
      roundNumber: this.state.roundNumbers.get(data.matchId) ?? 1,
      timeLeft,
      phaseEndsAt,
    });
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
    data: { scriptId: string; mode?: GameMode },
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
      mode: toArenaMatchMode(data.mode),
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

  handleLeaveMatch(
    client: AuthenticatedSocket,
    data: { matchId: string },
  ) {
    const matchId = data.matchId;
    const match = this.state.matches.get(matchId);

    if (match) {
      const mode = this.state.matchModes.get(matchId);
      const isSoloMode =
        mode === 'TRAINING_SOLO' ||
        mode === 'SURVIVAL' ||
        mode === 'RACING';

      if (isSoloMode) {
        // Solo: full teardown — no other players to keep it alive for
        match.stop();
        this.state.cleanupMatch(matchId);
      } else {
        // Multiplayer: only remove this player's robot, keep match running
        if (client.userId) {
          match.removePlayer(client.userId);
        }
      }
    }

    client.leave(matchId);
    client.matchId = undefined;

    // Clear user status so the leaderboard doesn't show stale "in-match"
    if (client.userId && !client.isGuest) {
      this.state.userStatus.set(client.userId, { status: 'idle' });
      this.server
        .to(LEADERBOARD_ROOM)
        .emit('userStatusUpdate', { userId: client.userId, status: 'idle' });
    }

    if (this.state.lobbyMatches.has(matchId)) {
      this.state.lobbyMatches.delete(matchId);
    }
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
    if (!client.matchId) {
      client.emit('logicExecuted', {
        robotId: data.robotId,
        action: 'SCRIPT_FAILED',
        message: '[ERR] Not in a match. Re-join the arena.',
      });
      return;
    }
    const match = this.state.matches.get(client.matchId);
    if (!match) {
      client.emit('logicExecuted', {
        robotId: data.robotId,
        action: 'SCRIPT_FAILED',
        message: '[ERR] Match not found. Re-join the arena.',
      });
      return;
    }

    // Resolve the actual robotId: prefer the one sent, fall back to client.userId
    let resolvedRobotId = data.robotId;
    const robotExists = match.getState().robots.some((r) => r.id === resolvedRobotId);
    if (!robotExists && client.userId && resolvedRobotId !== client.userId) {
      // Client sent a stale robotId (e.g. from a previous socket connection);
      // try the current socket's userId instead.
      const fallbackExists = match.getState().robots.some((r) => r.id === client.userId);
      if (fallbackExists) {
        resolvedRobotId = client.userId;
      } else {
        client.emit('logicExecuted', {
          robotId: data.robotId,
          action: 'SCRIPT_FAILED',
          message: `[ERR] Robot "${data.robotId}" not found in match. Try re-joining.`,
        });
        return;
      }
    } else if (!robotExists) {
      client.emit('logicExecuted', {
        robotId: data.robotId,
        action: 'SCRIPT_FAILED',
        message: `[ERR] Robot "${data.robotId}" not found in match. Try re-joining.`,
      });
      return;
    }

    // Security: only allow updating own robot or bots/dummies in the match
    const isOwnRobot = resolvedRobotId === client.userId;
    const isBotOrDummy = /^bot-|^dummy-/.test(resolvedRobotId);
    if (!isOwnRobot && !isBotOrDummy) {
      client.emit('logicExecuted', {
        robotId: resolvedRobotId,
        action: 'SCRIPT_FAILED',
        message: '[ERR] Cannot update another player\'s robot.',
      });
      return;
    }

    const success = match.updateRobotScript(resolvedRobotId, data.scriptContent);
    client.emit('logicExecuted', {
      robotId: resolvedRobotId,
      action: success ? 'SCRIPT_DEPLOYED' : 'SCRIPT_FAILED',
      message: success
        ? 'Neural payload active.'
        : '[ERR] Script compilation failed — check syntax.',
    });
  }

  handleManualCommand(
    client: AuthenticatedSocket,
    data: { robotId?: string; command: string },
  ) {
    if (!client.matchId) return;
    const match = this.state.matches.get(client.matchId);
    if (!match) return;
    const targetRobotId = data.robotId || client.userId!;
    // Only allow if it's the user's own robot or a test bot/dummy
    const isOwnRobot = targetRobotId === client.userId;
    const isBotOrDummy = /^bot-|^dummy-/.test(targetRobotId);
    if (!isOwnRobot && !isBotOrDummy) return;

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
