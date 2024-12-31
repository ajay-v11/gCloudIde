import io from 'socket.io-client';

// Create socket connection with debug logs
export const socket = io('http://hithere.cloudide.site', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
