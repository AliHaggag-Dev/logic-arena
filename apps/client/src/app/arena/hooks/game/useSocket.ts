'use client';

import { useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../../../lib/api-client';

export const useSocket = (): Socket => {
  return useMemo(() => {
    const wsUrl = API_BASE_URL
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')
      .replace(/\/api$/, '');
    return io(wsUrl, { autoConnect: false, withCredentials: true });
  }, []);
};
