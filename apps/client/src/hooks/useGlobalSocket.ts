import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

type Handlers = {
  onChallengeReceived: (data: { challengerId: string; challengerName: string }) => void;
  onChallengeSent: () => void;
  onChallengeFailed: (reason: string) => void;
  onChallengeAccepted: (matchId: string) => void;
};

export function useGlobalSocket(handlers: Handlers) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Handlers>(handlers);
  const router = useRouter();

  // Keep handlers ref current without triggering reconnects
  useEffect(() => { handlersRef.current = handlers; });

  useEffect(() => {
    const token =
      localStorage.getItem('jwtToken') ||
      localStorage.getItem('token');
    if (!token) return;

    const wsUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');

    const socket = io(wsUrl, { auth: { token }, transports: ['websocket', 'polling'] },
    );

    socketRef.current = socket;

    // Refresh Redis presence TTL every 60 s
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

  return { sendChallenge, acceptChallenge };
}
