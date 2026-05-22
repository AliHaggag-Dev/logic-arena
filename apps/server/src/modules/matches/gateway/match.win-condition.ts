import { GameState, Robot, ModeData } from '@logic-arena/engine';

export interface WinConditionResult {
  matchIsOver: boolean;
  winner: Robot | null;
}

export function checkWinCondition(
  state: GameState,
  mode: string,
  modeData?: ModeData,
): WinConditionResult {
  const aliveRobots = state.robots.filter((r) => r.health > 0);
  let matchIsOver = false;
  let winner: Robot | null = null;

  if (mode === 'RACING') {
    const finishLine = state.obstacles?.find(
      (o) => o.type === 'FINISH_LINE',
    );
    if (finishLine) {
      winner = state.robots.find((r) => {
        const dx = Math.abs(r.position.x - finishLine.position.x);
        const dy = Math.abs(r.position.y - finishLine.position.y);
        return (
          dx < finishLine.width / 2 + 15 && dy < finishLine.height / 2 + 15
        ); // 15 is robot radius
      }) || null;
      if (winner) matchIsOver = true;
    }
  } else if (mode === 'TRAINING_SOLO' || mode === 'SURVIVAL') {
    matchIsOver = false;
  } else if (mode === 'KING_OF_THE_HILL' && modeData?.type === 'KOTH') {
    for (const [team, score] of Object.entries(modeData.zoneScores)) {
      if (score >= modeData.scoreTarget) {
        matchIsOver = true;
        winner = state.robots.find(r => r.team === team && r.isAlive) || null;
        break;
      }
    }
  } else if (mode === 'CAPTURE_THE_FLAG' && modeData?.type === 'CTF') {
    for (const [team, score] of Object.entries(modeData.teamScores)) {
      if (score >= modeData.scoreTarget) {
        matchIsOver = true;
        winner = state.robots.find(r => r.team === team && r.isAlive) || null;
        break;
      }
    }
  } else if (state.robots.length > 0 && aliveRobots.length <= 1) {
    matchIsOver = true;
    winner = aliveRobots.length === 1 ? aliveRobots[0] : null;
  }

  return { matchIsOver, winner };
}
