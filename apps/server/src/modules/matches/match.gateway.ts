import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchEngine } from './match.engine';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../common/prisma.service';

type AuthenticatedSocket = Socket & {
  userId?:  string;
  matchId?: string;
};

/** Robot props included in every delta-diff calculation. */
const TRACKED_ROBOT_PROPS = [
  'position', 'velocity', 'health', 'rotation', 'isAlive', 'color',
  'maxHealth', 'slowedUntil', 'speedMultiplier', 'trappedUntil', 'shields',
  // Energy / FOV / Physics additions
  'energy', 'maxEnergy', 'inStasis', 'fovDirection', 'hitWallTimestamp',
] as const;

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000', credentials: true },
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private matches        = new Map<string, MatchEngine>();
  private lastStateMap   = new Map<string, any>();
  private lobbyMatches   = new Map<string, { hostId: string; hostName: string; matchId: string; createdAt: number }>();
  private matchStartTime = new Map<string, number>();
  private replaySnapshots = new Map<string, any[]>();
  private tickCount      = new Map<string, number>();
  private savingMatches  = new Set<string>();
  private matchModes     = new Map<string, string>();

  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Connection / Auth
  // ---------------------------------------------------------------------------

  async handleConnection(@ConnectedSocket() client: AuthenticatedSocket) {
    const token =
      client.handshake?.auth?.token ||
      client.handshake?.headers?.authorization;

    if (!token) {
      client.emit('error', { message: 'Unauthorized: No token provided' });
      client.disconnect(true);
      return;
    }

    try {
      const cleanToken = token.replace('Bearer ', '');
      const decoded: any = jwt.verify(cleanToken, process.env.JWT_SECRET as string);
      client.userId = decoded.sub;
      client.emit('authenticated', { userId: client.userId });
    } catch {
      client.emit('error', { message: 'Unauthorized: Invalid token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() _client: AuthenticatedSocket) {
    // Intentional no-op: robot persists across reconnect / page-refresh
  }

  // ---------------------------------------------------------------------------
  // Match management
  // ---------------------------------------------------------------------------

  @SubscribeMessage('joinMatch')
  async handleJoinMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string; scriptId: string; mode?: 'COMBAT' | 'RACING' | 'TRAINING_SOLO' },
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

    let match       = this.matches.get(data.matchId);
    const currentMode = this.matchModes.get(data.matchId);
    const mode      = data.mode || 'COMBAT';

    // If mode changed, tear down the old match instance
    if (match && currentMode && currentMode !== mode) {
      match.stop();
      this.cleanupMatch(data.matchId);
      match = undefined;
    }

    if (!match) {
      const initialPlayers =
        mode === 'RACING' || mode === 'TRAINING_SOLO'
          ? [{ id: client.userId, script: script.content }]
          : [{ id: client.userId, script: script.content }, { id: 'bot-2', script: '' }];

      match = new MatchEngine(data.matchId, initialPlayers, {
        mode,
        disableProjectiles: mode === 'RACING' || mode === 'TRAINING_SOLO',
      });
      this.matches.set(data.matchId, match);
      this.matchModes.set(data.matchId, mode);
      this.matchStartTime.set(data.matchId, Date.now());
      match.start();
    } else {
      if (this.lobbyMatches.has(data.matchId)) {
        match.removePlayer('bot-2');
        match.addPlayer({ id: client.userId!, script: script.content });
        this.lobbyMatches.delete(data.matchId);
        this.server.emit('lobbyUpdated', Array.from(this.lobbyMatches.values()));
      } else {
        match.removePlayer(client.userId!);
        match.addPlayer({ id: client.userId!, script: script.content });
        match.updateInitialPlayer(client.userId!, script.content);
      }
    }

    client.matchId = data.matchId;
    client.join(data.matchId);
    client.emit('matchJoinedInfo', { mode });
    this.broadcastMatchState(data.matchId, match.getState());
  }

  @SubscribeMessage('createMatch')
  async handleCreateMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { scriptId: string },
  ) {
    if (!client.userId) return;
    const user    = await this.prisma.user.findUnique({ where: { id: client.userId } });
    const matchId = crypto.randomUUID();
    this.lobbyMatches.set(matchId, {
      hostId:    client.userId,
      hostName:  user?.username || 'Unknown Hacker',
      matchId,
      createdAt: Date.now(),
    });
    client.emit('matchCreated', { matchId });
    this.server.emit('lobbyUpdated', Array.from(this.lobbyMatches.values()));
  }

  @SubscribeMessage('getLobby')
  handleGetLobby(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('lobbyList', Array.from(this.lobbyMatches.values()));
  }

  @SubscribeMessage('resetGame')
  handleResetGame(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    if (client.matchId && this.matches.has(client.matchId)) {
      const match = this.matches.get(client.matchId);
      match?.reset();
      this.broadcastMatchState(client.matchId, match?.getState());
    }
  }

  @SubscribeMessage('updateLogic')
  handleUpdateLogic(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { robotId: string; scriptContent: string },
  ) {
    if (client.matchId && this.matches.has(client.matchId)) {
      const match = this.matches.get(client.matchId);
      match?.updateRobotScript(data.robotId, data.scriptContent);
      client.emit('logicExecuted', {
        robotId: data.robotId,
        action:  'SCRIPT_DEPLOYED',
        message: 'Neural payload active.',
      });
    }
  }

  @SubscribeMessage('manualCommand')
  handleManualCommand(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { command: string },
  ) {
    if (client.matchId && this.matches.has(client.matchId)) {
      const match = this.matches.get(client.matchId);
      match?.receiveManualCommand(client.userId!, data.command);
      client.emit('logicExecuted', {
        robotId: client.userId,
        action:  data.command,
        message: 'Manual command executed.',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Broadcast loop — runs every 50ms (20Hz)
  // ---------------------------------------------------------------------------

  onModuleInit() {
    setInterval(async () => {
      for (const [matchId, match] of this.matches.entries()) {
        const state = match.getState();

        // --- Replay snapshot (every 10th tick) ---
        const tick = (this.tickCount.get(matchId) || 0) + 1;
        this.tickCount.set(matchId, tick);
        if (tick % 10 === 0) {
          const snapshots = this.replaySnapshots.get(matchId) || [];
          snapshots.push({
            t:           tick,
            robots:      state.robots.map((r: any) => ({
              id:       r.id,
              position: { x: r.position.x, y: r.position.y },
              health:   r.health,
              energy:   r.energy,
              inStasis: r.inStasis,
              color:    r.color,
              rotation: r.rotation,
              isAlive:  r.isAlive,
            })),
            projectiles: state.projectiles.map((p: any) => ({
              id:       p.id,
              position: { x: p.position.x, y: p.position.y },
              velocity: p.velocity,
              ownerId:  p.ownerId,
            })),
          });
          this.replaySnapshots.set(matchId, snapshots);
        }

        // --- Win condition ---
        const aliveRobots = state.robots.filter((r: any) => r.health > 0);
        const mode        = this.matchModes.get(matchId) || 'COMBAT';
        let matchIsOver   = false;
        let winner: any   = null;

        if (mode === 'RACING') {
          const TARGET_X = 700, TARGET_Y = 300;
          winner = state.robots.find(
            (r: any) => Math.hypot(r.position.x - TARGET_X, r.position.y - TARGET_Y) < 50,
          );
          if (winner) matchIsOver = true;
        } else if (mode === 'TRAINING_SOLO') {
          matchIsOver = false;
        } else if (state.robots.length > 0 && aliveRobots.length <= 1) {
          matchIsOver = true;
          winner = aliveRobots.length === 1 ? aliveRobots[0] : null;
        }

        if (matchIsOver) {
          if (this.savingMatches.has(matchId)) continue;
          this.savingMatches.add(matchId);

          // Compute efficiency scores before teardown
          const efficiencyScores = match.getEfficiencyScores();

          this.server.to(matchId).emit('matchOver', {
            winner:           winner ? { id: winner.id, color: winner.color } : null,
            draw:             !winner && mode !== 'RACING',
            efficiencyScores, // { [robotId]: score }
          });

          // Persist match to DB
          const playerIds = state.robots
            .map((r: any) => r.id)
            .filter((id: string) => id !== 'bot-2');
          const startTime = this.matchStartTime.get(matchId) || Date.now();

          if (playerIds.length > 0) {
            const snapshots = this.replaySnapshots.get(matchId) || [];
            await this.prisma.match.create({
              data: {
                type:     'Friendly',
                winnerId: winner && winner.id !== 'bot-2' ? winner.id : null,
                duration: Math.floor((Date.now() - startTime) / 1000),
                replayData: snapshots,
                participants: { connect: playerIds.map((id: string) => ({ id })) },
              },
            });

            if (winner && winner.id !== 'bot-2') {
              await this.prisma.user.update({
                where: { id: winner.id },
                data:  { rank: { increment: 10 } },
              });
            }
          }

          match.stop();
          this.cleanupMatch(matchId);
          continue;
        }

        // --- Delta-state diff ---
        const prevState = this.lastStateMap.get(matchId);
        let delta: any  = { type: 'full', state };

        if (prevState) {
          const robotsDiff = state.robots.map((r: any) => {
            const prevR = prevState.robots.find((pr: any) => pr.id === r.id);
            // New robot — send full snapshot
            if (!prevR) return r;

            let rd: any = { id: r.id };
            let changed = false;

            for (const prop of TRACKED_ROBOT_PROPS) {
              // Deep-compare using JSON (safe, works for nested {x,y} objects)
              const curVal  = JSON.stringify(r[prop]);
              const prevVal = JSON.stringify((prevR as any)[prop]);
              if (curVal !== prevVal) {
                rd[prop] = r[prop];
                changed  = true;
              }
            }

            // ALWAYS include position and rotation for alive, moving robots.
            // This guarantees the client is never left with stale coordinates
            // even if the snapshot reference diffing missed an update.
            if (r.isAlive) {
              const vMag = Math.hypot(r.velocity?.x ?? 0, r.velocity?.y ?? 0);
              if (vMag > 0.01) {
                rd.position = r.position;
                rd.velocity = r.velocity;
                rd.rotation = r.rotation;
                changed = true;
              }
            }

            // visibleRobotIds — compare against the safe snapshot's pre-stripped id list
            const curIds  = (r.visibleEntities?.robots ?? []).map((vr: any) => vr.id).sort().join(',');
            const prevIds = ((prevR as any).visibleRobotIds ?? []).slice().sort().join(',');
            if (curIds !== prevIds) {
              rd.visibleRobotIds = (r.visibleEntities?.robots ?? []).map((vr: any) => vr.id);
              changed = true;
            }

            return changed ? rd : null;
          }).filter(Boolean);

          delta = {
            type: 'delta',
            diff: { robots: robotsDiff, projectiles: state.projectiles },
          };
        }

        const hasChanges =
          delta.type === 'full' ||
          (delta.diff && (delta.diff.robots.length > 0 || delta.diff.projectiles.length > 0));

        if (hasChanges) {
          // Safe snapshot — strip visibleEntities to avoid circular reference crash.
          // CRITICAL: shallow-clone all object-type props (position, velocity) so the
          // snapshot is immutable — if we store a live reference the diff will always
          // see them as equal on the next tick because the object mutates in-place.
          const safeSnapshot = {
            robots: state.robots.map((r: any) => {
              const snap: any = { id: r.id };
              for (const prop of TRACKED_ROBOT_PROPS) {
                const val = r[prop];
                // Shallow-clone plain objects (position, velocity) to freeze the value
                snap[prop] = val !== null && typeof val === 'object' && !Array.isArray(val)
                  ? { ...val }
                  : val;
              }
              snap.visibleRobotIds = (r.visibleEntities?.robots ?? []).map((vr: any) => vr.id);
              return snap;
            }),
            projectiles: state.projectiles.map((p: any) => ({
              id: p.id, position: { ...p.position }, velocity: { ...p.velocity },
            })),
            obstacles: undefined,
          };
          this.lastStateMap.set(matchId, safeSnapshot);
          this.broadcastMatchState(matchId, delta);
        }
      }
    }, 50);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private broadcastMatchState(matchId: string, state: any) {
    this.server.to(matchId).emit('gameState', state);
  }

  private cleanupMatch(matchId: string) {
    this.matches.delete(matchId);
    this.lastStateMap.delete(matchId);
    this.matchStartTime.delete(matchId);
    this.matchModes.delete(matchId);
    this.replaySnapshots.delete(matchId);
    this.tickCount.delete(matchId);
    this.savingMatches.delete(matchId);
  }
}