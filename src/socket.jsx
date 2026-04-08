import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
    path: '/socket.io',
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
});

export default socket;             