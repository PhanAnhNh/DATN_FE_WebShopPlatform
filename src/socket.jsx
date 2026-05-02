// socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = (() => {
  const url = 'https://datnwebshopplatform-production.up.railway.app';
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) {
    return envUrl.replace('http://', 'https://');
  }
  return url;
})();

const socket = io(SOCKET_URL, {
    path: '/socket.io',
    autoConnect: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // Thêm timeout
    timeout: 20000,
});

// Thêm log để debug
socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
});

socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
});

export default socket;