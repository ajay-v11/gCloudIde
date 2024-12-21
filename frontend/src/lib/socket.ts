import io from 'socket.io-client';

// Create socket connection with debug logs
export const socket = io('http://localhost:3001', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
