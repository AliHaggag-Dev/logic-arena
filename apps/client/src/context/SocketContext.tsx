"use client";

import { createContext, useContext } from 'react';

interface SocketContextType {
  sendChallenge: (targetUserId: string) => void;
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
