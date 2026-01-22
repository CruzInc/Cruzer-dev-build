import { io, Socket } from 'socket.io-client';

/**
 * Socket.io Client Integration for React Native
 * Connects to backend WebSocket server for real-time updates
 */

let socket: Socket | null = null;
let isConnected = false;
let currentUserId: string | null = null;
let currentEmail: string | null = null;

// Get WebSocket URL from environment
const getSocketUrl = () => {
  return process.env.EXPO_PUBLIC_REALTIME_URL || 'ws://localhost:3000';
};

/**
 * Initialize and connect to WebSocket
 */
export const connectSocket = (userId: string, email: string) => {
  if (socket?.connected) {
    console.log('[Socket] Already connected');
    return socket;
  }

  currentUserId = userId;
  currentEmail = email;

  const url = getSocketUrl();
  console.log('[Socket] Connecting to:', url);

  socket = io(url, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Connection events
  socket.on('connect', () => {
    isConnected = true;
    console.log('[Socket] Connected:', socket?.id);
    
    // Authenticate user
    if (currentUserId && currentEmail) {
      socket?.emit('authenticate', {
        userId: currentUserId,
        email: currentEmail,
      });
    }
  });

  socket.on('disconnect', () => {
    isConnected = false;
    console.log('[Socket] Disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
  });

  return socket;
};

/**
 * Disconnect from WebSocket
 */
export const disconnectSocket = () => {
  if (socket) {
    // Update presence to offline before disconnect
    if (currentUserId) {
      socket.emit('presence', {
        userId: currentUserId,
        email: currentEmail,
        status: 'offline',
      });
    }
    
    socket.disconnect();
    socket = null;
    isConnected = false;
    console.log('[Socket] Disconnected manually');
  }
};

/**
 * Get socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return isConnected && socket?.connected === true;
};

// ============================================
// PRESENCE UPDATES
// ============================================

/**
 * Update user presence status
 */
export const updatePresence = (status: 'online' | 'offline' | 'busy' | 'away') => {
  if (!socket || !currentUserId) return;
  
  socket.emit('presence', {
    userId: currentUserId,
    email: currentEmail,
    status,
  });
};

/**
 * Listen for presence updates
 */
export const onPresenceUpdate = (callback: (presence: any) => void) => {
  if (!socket) return () => {};
  
  socket.on('presence', callback);
  
  return () => {
    socket?.off('presence', callback);
  };
};

// ============================================
// CRASH REPORTING
// ============================================

/**
 * Report crash to all connected devices
 */
export const reportCrash = (error: Error | string, fatal: boolean = false) => {
  if (!socket) return;
  
  const crashLog = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? undefined : error.stack,
    userId: currentUserId,
    userEmail: currentEmail,
    fatal,
    timestamp: new Date().toISOString(),
  };
  
  socket.emit('crash', crashLog);
  console.log('[Socket] Crash reported:', crashLog.message);
};

/**
 * Listen for crash reports
 */
export const onCrashReport = (callback: (crash: any) => void) => {
  if (!socket) return () => {};
  
  socket.on('crash', callback);
  
  return () => {
    socket?.off('crash', callback);
  };
};

// ============================================
// ACCOUNT EVENTS
// ============================================

/**
 * Report account event (login, signup, profile update)
 */
export const reportAccountEvent = (
  action: 'google-login' | 'signup' | 'signin' | 'signout' | 'profile-update',
  data?: any
) => {
  if (!socket || !currentUserId || !currentEmail) return;
  
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: currentUserId,
    email: currentEmail,
    action,
    timestamp: new Date().toISOString(),
    data,
  };
  
  socket.emit('account', event);
  console.log('[Socket] Account event:', action);
};

/**
 * Listen for account events
 */
export const onAccountEvent = (callback: (event: any) => void) => {
  if (!socket) return () => {};
  
  socket.on('account', callback);
  
  return () => {
    socket?.off('account', callback);
  };
};

// ============================================
// FRIEND UPDATES
// ============================================

/**
 * Send friend request
 */
export const sendFriendRequest = (toUserId: string, fromUser: any) => {
  if (!socket) return;
  
  socket.emit('friend-request', {
    toUserId,
    fromUser,
  });
  
  console.log('[Socket] Friend request sent to:', toUserId);
};

/**
 * Notify friend update
 */
export const notifyFriendUpdate = (targetUserId: string, data: any) => {
  if (!socket) return;
  
  socket.emit('friend-update', {
    targetUserId,
    ...data,
  });
};

/**
 * Listen for friend requests
 */
export const onFriendRequest = (callback: (request: any) => void) => {
  if (!socket) return () => {};
  
  socket.on('friend-request', callback);
  
  return () => {
    socket?.off('friend-request', callback);
  };
};

/**
 * Listen for friend updates
 */
export const onFriendUpdate = (callback: (update: any) => void) => {
  if (!socket) return () => {};
  
  socket.on('friend-update', callback);
  
  return () => {
    socket?.off('friend-update', callback);
  };
};

// ============================================
// TYPING INDICATORS
// ============================================

/**
 * Send typing indicator
 */
export const sendTypingIndicator = (targetUserId: string, isTyping: boolean) => {
  if (!socket) return;
  
  socket.emit('typing', {
    targetUserId,
    isTyping,
  });
};

/**
 * Listen for typing indicators
 */
export const onTyping = (callback: (data: { userId: string; isTyping: boolean }) => void) => {
  if (!socket) return () => {};
  
  socket.on('typing', callback);
  
  return () => {
    socket?.off('typing', callback);
  };
};

// Export all functions
export default {
  connectSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
  updatePresence,
  onPresenceUpdate,
  reportCrash,
  onCrashReport,
  reportAccountEvent,
  onAccountEvent,
  sendFriendRequest,
  notifyFriendUpdate,
  onFriendRequest,
  onFriendUpdate,
  sendTypingIndicator,
  onTyping,
};
