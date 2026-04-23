import { io } from 'socket.io-client';

const SOCKET_URL = 'https://datnwebshopplatform-production.up.railway.app';

const socket = io(SOCKET_URL, {
    path: '/socket.io',
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
});

export default socket;             