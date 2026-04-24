export interface WinConditionResult {
  matchIsOver: boolean;
  winner: any;
}

export function checkWinCondition(state: any, mode: string): WinConditionResult {
  const aliveRobots = state.robots.filter((r: any) => r.health > 0);
  let matchIsOver = false;
  let winner: any = null;

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

  return { matchIsOver, winner };
}
