import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../auth/storage';

export function useSocket(onSync) {
  const [connected, setConnected] = useState(false);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io({
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('task:sync', (payload) => onSyncRef.current?.(payload));

    return () => {
      socket.disconnect();
    };
  }, []);

  return { connected };
}
