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
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
});

export default socket;