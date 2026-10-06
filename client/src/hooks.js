import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { apiBaseURL } from './api';

export function useQueueSocket(doctorId, callback) {
  useEffect(() => {
    if (!doctorId) return undefined;
    const baseURL = apiBaseURL.replace(/\/api\/?$/, '');
    const socket = io(baseURL, { transports: ['websocket', 'polling'] });
    const join = () => socket.emit('join', doctorId);
    socket.on('connect', join);
    socket.on('queueUpdated', callback);
    if (socket.connected) join();
    return () => {
      socket.off('connect', join);
      socket.off('queueUpdated', callback);
      socket.disconnect();
    };
  }, [doctorId, callback]);
}
