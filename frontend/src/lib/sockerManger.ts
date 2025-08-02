// socketManager.ts
import io, {Socket} from 'socket.io-client';
import {getSocketUrl} from './config';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(replId: string): Socket {
    if (!this.socket) {
      const url = getSocketUrl(replId);
      this.socket = io(url, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Handle reconnection logic
      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.notifyListeners('connection-status', {status: 'disconnected'});
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.notifyListeners('connection-status', {status: 'connected'});
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.notifyListeners('connection-status', {status: 'error', error});
      });
    }
    return this.socket;
  }

  // Subscribe to events
  subscribe(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // If socket exists, bind the listener
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Unsubscribe from events
  unsubscribe(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit events
  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected');
    }
  }

  // Notify all listeners for an event
  private notifyListeners(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketManager = SocketManager.getInstance();
