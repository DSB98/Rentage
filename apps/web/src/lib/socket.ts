import { io, Socket } from 'socket.io-client';

const normalizeLocalApiUrl = (url: string) => {
  if (url.includes('http://localhost:4100')) {
    return url.replace('http://localhost:4100', 'http://localhost:4000');
  }

  return url;
};

const API_URL = normalizeLocalApiUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
);
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '');

class SocketManager {
  private socket: Socket | null = null;
  private isConnecting = false;

  connect(token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        // Wait for connection to complete
        const checkInterval = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkInterval);
            resolve(this.socket!);
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      this.socket = io(`${SOCKET_URL}/chat`, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.isConnecting = false;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnecting = false;
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Room methods
  joinRoom(conversationId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('join_conversation', { conversationId });
  }

  leaveRoom(conversationId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('leave_conversation', { conversationId });
  }

  // Messaging methods
  sendMessage(conversationId: string, message: string, imageUrl?: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('send_message', {
      conversationId,
      content: message,
      messageType: 'TEXT',
      imageUrl,
    });
  }

  markMessageRead(conversationId: string, messageId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('mark_read', {
      conversationId,
      messageId,
    });
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit(isTyping ? 'typing_start' : 'typing_stop', { conversationId });
  }

  // Event listeners
  onNewMessage(callback: (data: any) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('new_message', callback);
  }

  onMessageRead(callback: (data: any) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('message_read', callback);
  }

  onTyping(callback: (data: any) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('user_typing', (data) => callback({ ...data, isTyping: true }));
    this.socket.on('user_stop_typing', (data) => callback({ ...data, isTyping: false }));
  }

  onUserOnline(callback: (data: any) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('user_online', callback);
  }

  onUserOffline(callback: (data: any) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('user_offline', callback);
  }
}

export const socketManager = new SocketManager();
