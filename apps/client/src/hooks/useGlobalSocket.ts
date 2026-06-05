import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../lib/api-client';
import { hasAuthSession } from '../lib/client-security';
import type { FriendRequestEntry } from '../lib/api/friends.types';

export interface FriendRequestReceivedPayload {
  request: FriendRequestEntry;
  unreadCount: number;
}

export interface FriendRequestAcceptedPayload {
  by: { id: string; username: string };
  friendshipCreatedAt: string;
  unreadCount: number;
}

export interface FriendRequestDeclinedPayload {
  by: { id: string; username: string };
}

export interface FriendRemovedPayload {
  by: { id: string; username: string };
}

interface Handlers {
  onChallengeReceived: (data: { challengerId: string; challengerName: string }) => void;
  onChallengeSent: () => void;
  onChallengeFailed: (reason: string) => void;
  onChallengeAccepted: (matchId: string) => void;
  onFriendRequestReceived: (data: FriendRequestReceivedPayload) => void;
  onFriendRequestAccepted: (data: FriendRequestAcceptedPayload) => void;
  onFriendRequestDeclined: (data: FriendRequestDeclinedPayload) => void;
  onFriendRemoved: (data: FriendRemovedPayload) => void;
  onFriendsListInvalidate: () => void;
}

export function useGlobalSocket(handlers: Handlers) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Handlers>(handlers);
  const router = useRouter();

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!hasAuthSession()) return;

    const wsUrl = API_BASE_URL
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')
      .replace(/\/api$/, '');

    const socket = io(wsUrl, {
      withCredentials: true,
    });

    socketRef.current = socket;

    const heartbeat = setInterval(() => socket.emit('ping'), 60_000);

    socket.on('challenge-received', (data: { challengerId: string; challengerName: string }) => {
      handlersRef.current.onChallengeReceived(data);
    });
    socket.on('challenge-sent', () => {
      handlersRef.current.onChallengeSent();
    });
    socket.on('challenge-failed', ({ reason }: { reason: string }) => {
      handlersRef.current.onChallengeFailed(reason);
    });
    socket.on('challenge-accepted', ({ matchId }: { matchId: string }) => {
      handlersRef.current.onChallengeAccepted(matchId);
      router.push(`/arena?matchId=${matchId}`);
    });

    socket.on('friend:request-received', (data: FriendRequestReceivedPayload) => {
      handlersRef.current.onFriendRequestReceived(data);
    });
    socket.on('friend:request-accepted', (data: FriendRequestAcceptedPayload) => {
      handlersRef.current.onFriendRequestAccepted(data);
    });
    socket.on('friend:request-declined', (data: FriendRequestDeclinedPayload) => {
      handlersRef.current.onFriendRequestDeclined(data);
    });
    socket.on('friend:removed', (data: FriendRemovedPayload) => {
      handlersRef.current.onFriendRemoved(data);
    });
    socket.on('friends:list-invalidate', () => {
      handlersRef.current.onFriendsListInvalidate();
    });

    return () => {
      clearInterval(heartbeat);
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendChallenge = useCallback((targetUserId: string) => {
    socketRef.current?.emit('send-challenge', { targetUserId });
  }, []);

  const acceptChallenge = useCallback((challengerId: string) => {
    socketRef.current?.emit('accept-challenge', { challengerId });
  }, []);

  const sendFriendRequest = useCallback(
    (receiverUsername: string, message?: string) => {
      socketRef.current?.emit('friend:send-request', { receiverUsername, message });
    },
    [],
  );

  const acceptFriendRequest = useCallback((requestId: string) => {
    socketRef.current?.emit('friend:accept-request', { requestId });
  }, []);

  const declineFriendRequest = useCallback((requestId: string) => {
    socketRef.current?.emit('friend:decline-request', { requestId });
  }, []);

  const unfriendSocket = useCallback((friendId: string) => {
    socketRef.current?.emit('friend:unfriend', { friendId });
  }, []);

  return {
    sendChallenge,
    acceptChallenge,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriendSocket,
  };
}
