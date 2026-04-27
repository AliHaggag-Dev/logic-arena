import { MatchEngine } from '../match.engine';

export class MatchState {
  matches = new Map<string, MatchEngine>();
  lastStateMap = new Map<string, any>();
  lobbyMatches = new Map<string, { hostId: string; hostName: string; matchId: string; createdAt: number }>();
  matchStartTime = new Map<string, number>();
  replaySnapshots = new Map<string, any[]>();
  tickCount = new Map<string, number>();
  savingMatches = new Set<string>();
  matchModes = new Map<string, string>();
  dummyKilledThisTick = new Map<string, Set<string>>();

  cleanupMatch(matchId: string) {
    this.matches.delete(matchId);
    this.lastStateMap.delete(matchId);
    this.matchStartTime.delete(matchId);
    this.matchModes.delete(matchId);
    this.replaySnapshots.delete(matchId);
    this.tickCount.delete(matchId);
    this.savingMatches.delete(matchId);
    this.dummyKilledThisTick.delete(matchId);
  }
}
