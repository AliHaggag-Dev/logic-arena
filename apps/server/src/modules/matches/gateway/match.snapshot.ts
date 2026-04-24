import { MatchState } from './match.state';

export function captureReplaySnapshot(matchId: string, state: any, matchState: MatchState, tick: number): void {
  if (tick % 10 === 0) {
    const snapshots = matchState.replaySnapshots.get(matchId) || [];
    snapshots.push({
      t: tick,
      robots: state.robots.map((r: any) => ({
        id: r.id,
        position: { x: r.position.x, y: r.position.y },
        health: r.health,
        energy: r.energy,
        inStasis: r.inStasis,
        color: r.color,
        rotation: r.rotation,
        isAlive: r.isAlive,
      })),
      projectiles: state.projectiles.map((p: any) => ({
        id: p.id,
        position: { x: p.position.x, y: p.position.y },
        velocity: p.velocity,
        ownerId: p.ownerId,
      })),
    });
    matchState.replaySnapshots.set(matchId, snapshots);
  }
}
