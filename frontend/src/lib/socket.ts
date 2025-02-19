import io from 'socket.io-client';

export const createSocketConnection = (replId: string) => {
  //return io(`http://${replId}.cloudide.site`, {
  return io(`http://localhost:3001`, {
    transports: ['websocket'],
    reconnection: false,
    //reconnectionAttempts: 5,
    //reconnectionDelay: 1000,
  });
};
