import { PrismaService } from '../../../common/prisma.service';
import { MatchState } from './match.state';

export async function persistMatchResults(
  matchId: string,
  state: any,
  winner: any,
  efficiencyScores: Record<string, number>,
  matchState: MatchState,
  prisma: PrismaService,
  matchRef: any,
): Promise<void> {
  const playerIds = state.robots
    .map((r: any) => r.id)
    .filter((id: string) => id !== 'bot-2');
  const startTime = matchState.matchStartTime.get(matchId) || Date.now();

  if (playerIds.length === 0) return;

  const snapshots = matchState.replaySnapshots.get(matchId) || [];

  const aliveAtEnd = state.robots
    .filter((r: any) => r.id !== 'bot-2')
    .sort((a: any, b: any) => b.health - a.health);

  const playerScriptMap = new Map<string, string>();
  for (const p of matchRef['initialPlayers'] as { id: string; script: string }[]) {
    if (p.id === 'bot-2') continue;
    const dbScript = await prisma.robotScript.findFirst({
      where: { userId: p.id },
      orderBy: { createdAt: 'desc' },
    });
    if (dbScript) playerScriptMap.set(p.id, dbScript.id);
  }

  const createdMatch = await prisma.match.upsert({
    where: { id: matchId },
    create: {
      id: matchId,
      type: 'Friendly',
      status: 'completed',
      winnerId: winner && winner.id !== 'bot-2' ? winner.id : null,
      duration: Math.floor((Date.now() - startTime) / 1000),
      startedAt: new Date(startTime),
      endedAt: new Date(),
      replayData: snapshots,
      participants: { connect: playerIds.map((id: string) => ({ id })) },
    },
    update: {
      status: 'completed',
      winnerId: winner && winner.id !== 'bot-2' ? winner.id : null,
      duration: Math.floor((Date.now() - startTime) / 1000),
      startedAt: new Date(startTime),
      endedAt: new Date(),
      replayData: snapshots,
      participants: { connect: playerIds.map((id: string) => ({ id })) },
    },
  });

  for (let i = 0; i < aliveAtEnd.length; i++) {
    const robot = aliveAtEnd[i];
    const scriptId = playerScriptMap.get(robot.id);
    if (!scriptId) continue;

    await prisma.matchParticipant.upsert({
      where: {
        matchId_userId: {
          matchId: createdMatch.id,
          userId: robot.id,
        },
      },
      create: {
        matchId: createdMatch.id,
        userId: robot.id,
        robotScriptId: scriptId,
        score: efficiencyScores[robot.id] ?? 0,
        placement: i + 1,
      },
      update: {
        robotScriptId: scriptId,
        score: efficiencyScores[robot.id] ?? 0,
        placement: i + 1,
      },
    });
  }

  if (winner && winner.id !== 'bot-2') {
    await prisma.user.update({
      where: { id: winner.id },
      data: { rank: { increment: 10 } },
    });
  }
}
