import io from 'socket.io-client';

export const createSocketConnection = (replId: string) => {
  return io(`http://${replId}.cloudide.site`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
};
