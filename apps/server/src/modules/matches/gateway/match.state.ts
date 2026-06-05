import { Injectable } from '@nestjs/common';
import { MatchEngine } from '../match.engine';
import { ModeData } from '@logic-arena/engine';

export type UserMatchStatus =
  | { status: 'idle' }
  | { status: 'in-match'; matchId: string };

@Injectable()
export class MatchState {
  matches = new Map<string, MatchEngine>();
  lastStateMap = new Map<string, unknown>();
  lobbyMatches = new Map<
    string,
    { hostId: string; hostName: string; matchId: string; createdAt: number }
  >();
  matchStartTime = new Map<string, number>();
  replaySnapshots = new Map<string, unknown[]>();
  tickCount = new Map<string, number>();
  savingMatches = new Set<string>();
  matchModes = new Map<string, string>();
  dummyKilledThisTick = new Map<string, Set<string>>();
  modeDataMap = new Map<string, ModeData>();

  /** Tracks per-user match status for the leaderboard presence system */
  userStatus = new Map<string, UserMatchStatus>();

  /** Tracks spectator socket IDs per matchId */
  spectatorSockets = new Map<string, Set<string>>();

  cleanupMatch(matchId: string) {
    this.matches.delete(matchId);
    this.lastStateMap.delete(matchId);
    this.matchStartTime.delete(matchId);
    this.matchModes.delete(matchId);
    this.replaySnapshots.delete(matchId);
    this.tickCount.delete(matchId);
    this.savingMatches.delete(matchId);
    this.dummyKilledThisTick.delete(matchId);
    this.spectatorSockets.delete(matchId);
    this.modeDataMap.delete(matchId);
  }
}
