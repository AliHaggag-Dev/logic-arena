export interface WinConditionResult {
  matchIsOver: boolean;
  winner: any;
}

export function checkWinCondition(
  state: any,
  mode: string,
): WinConditionResult {
  const aliveRobots = state.robots.filter((r: any) => r.health > 0);
  let matchIsOver = false;
  let winner: any = null;

  if (mode === 'RACING') {
    const finishLine = state.obstacles?.find(
      (o: any) => o.type === 'FINISH_LINE',
    );
    if (finishLine) {
      winner = state.robots.find((r: any) => {
        const dx = Math.abs(r.position.x - finishLine.position.x);
        const dy = Math.abs(r.position.y - finishLine.position.y);
        return (
          dx < finishLine.width / 2 + 15 && dy < finishLine.height / 2 + 15
        ); // 15 is robot radius
      });
      if (winner) matchIsOver = true;
    }
  } else if (mode === 'TRAINING_SOLO') {
    matchIsOver = false;
  } else if (state.robots.length > 0 && aliveRobots.length <= 1) {
    matchIsOver = true;
    winner = aliveRobots.length === 1 ? aliveRobots[0] : null;
  }

  return { matchIsOver, winner };
}
