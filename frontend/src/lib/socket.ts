import io from 'socket.io-client';

// Create socket connection with debug logs
export const socket = io('http://34.47.249.228/', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
