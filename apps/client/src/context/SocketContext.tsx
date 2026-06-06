"use client";

import { createContext, useContext } from 'react';

export type MatchMode = 'CLASSIC' | 'TACTICAL';
export type ChallengeSource = 'friend' | 'leaderboard' | 'profile';

interface SocketContextType {
  sendChallenge: (targetUserId: string, source?: ChallengeSource, mode?: MatchMode) => void;
  sendFriendRequest: (receiverUsername: string, message?: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  unfriendSocket: (friendId: string) => void;
}

export const SocketContext = createContext<SocketContextType>({
  sendChallenge: () => {},
  sendFriendRequest: () => {},
  acceptFriendRequest: () => {},
  declineFriendRequest: () => {},
  unfriendSocket: () => {},
});

export const useSocket = () => useContext(SocketContext);
