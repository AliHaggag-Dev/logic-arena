import { Server } from 'socket.io';
import { PrismaService } from '../../../common/prisma.service';
import { RedisService } from '../../../common/redis.service';
import { MatchState } from './match.state';
import { AuthenticatedSocket } from './types';
import { MatchEngine } from '../match.engine';
import { GameMode, MapTheme } from '@logic-arena/engine';
import { BLACK_MARKET_ITEMS } from '../../users/black-market.constants';
import { combatLoadoutKey } from '../../users/types';

export async function loadPlayerScriptAndLoadout(
  prisma: PrismaService,
  redis: RedisService,
  client: AuthenticatedSocket,
  scriptId: string,
): Promise<{
  scriptContent: string;
  selectedColor: string;
  selectedTracerColor: string;
  selectedRobotId: string;
} | null> {
  let scriptContent = '';
  let selectedColor = '#22d3ee';
  let selectedTracerColor = '#22d3ee';
  let selectedRobotId = 'unit-01';

  if (client.isGuest) {
    scriptContent =
      '// Guest Mode active\n// You can write temporary logic here';
  } else {
    const script = await prisma.robotScript.findUnique({
      where: { id: scriptId, userId: client.userId },
    });
    if (!script) {
      client.emit('error', { message: 'Script not found or unauthorized.' });
      return null;
    }
    scriptContent = script.content;

    const cachedLoadout = await redis.get<{
      equippedChassis: string;
      equippedPaint: string;
      equippedTracer: string;
    }>(combatLoadoutKey(client.userId!));
    const user =
      cachedLoadout ??
      (await prisma.user.findUnique({
        where: { id: client.userId },
        select: {
          equippedChassis: true,
          equippedPaint: true,
          equippedTracer: true,
        },
      }));
    if (user) {
      selectedRobotId = user.equippedChassis || 'chassis-unit-01';
      const paint = BLACK_MARKET_ITEMS.find((i) => i.id === user.equippedPaint);
      if (paint?.color) selectedColor = paint.color;
      const tracer = BLACK_MARKET_ITEMS.find(
        (i) => i.id === user.equippedTracer,
      );
      if (tracer?.color) selectedTracerColor = tracer.color;
    }
  }

  return { scriptContent, selectedColor, selectedTracerColor, selectedRobotId };
}

export async function createAndStartMatch(
  state: MatchState,
  server: Server,
  prisma: PrismaService,
  matchId: string,
  playerToken: {
    id: string;
    script: string;
    color: string;
    model: string;
    tracerColor: string;
  },
  mode: GameMode,
  mapTheme: MapTheme = 'CYBER',
): Promise<MatchEngine> {
  const engineMode: GameMode =
    mode === 'CLASSIC' || mode === 'TACTICAL' ? 'COMBAT' : mode;
  let initialPlayers: {
    id: string;
    script: string;
    color: string;
    model: string;
    tracerColor?: string;
    spawnPosition?: { x: number; y: number };
    initialFovDirection?: number;
  }[];

  if (engineMode === 'RACING') {
    initialPlayers = [playerToken];
  } else if (engineMode === 'TRAINING_SOLO') {
    initialPlayers = [
      playerToken,
      { id: 'dummy-1', script: '', color: '#ef4444', model: 'dummy' },
      { id: 'dummy-2', script: '', color: '#eab308', model: 'dummy' },
      { id: 'dummy-3', script: '', color: '#3b82f6', model: 'dummy' },
    ];
  } else if (engineMode === 'SURVIVAL') {
    initialPlayers = [playerToken];
  } else if (engineMode === 'CAPTURE_THE_FLAG') {
    initialPlayers = [
      {
        ...playerToken,
        spawnPosition: { x: 100, y: 300 },
        initialFovDirection: 0,
      },
      {
        id: 'bot-2',
        script: '',
        color: '#ff00ff',
        model: 'unit-02',
        spawnPosition: { x: 700, y: 300 },
        initialFovDirection: Math.PI,
      },
    ];
  } else {
    // COMBAT and KING_OF_THE_HILL
    initialPlayers = [
      playerToken,
      { id: 'bot-2', script: '', color: '#ff00ff', model: 'unit-02' },
    ];
  }

  const match = new MatchEngine(
    matchId,
    initialPlayers,
    { mode: engineMode, mapTheme, disableProjectiles: engineMode === 'RACING' },
    (event, payload) => {
      server.to(matchId).emit(event, payload);
    },
  );
  state.matches.set(matchId, match);
  state.matchModes.set(matchId, mode);
  state.arenaMatchModes.set(
    matchId,
    mode === 'TACTICAL' ? 'TACTICAL' : 'CLASSIC',
  );
  state.matchPhases.set(matchId, 'ROUND_ACTIVE');
  state.roundNumbers.set(matchId, 1);
  if (mode === 'TACTICAL') {
    const config = {
      durations: [15, 30, 25],
      breakDuration: 60,
      healthTrigger: 50,
    };
    state.roundConfigs.set(matchId, config);
    state.phaseEndsAt.set(matchId, Date.now() + config.durations[0] * 1000);
  }
  state.matchStartTime.set(matchId, Date.now());
  match.start();

  await prisma.match.upsert({
    where: { id: matchId },
    create: {
      id: matchId,
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

  return match;
}
