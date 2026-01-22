// Realtime service for crash logs, presence, and account sync
// Uses WebSocket for real-time communication or falls back to local-only mode

export interface CrashLog {
  id: string;
  message: string;
  stack?: string;
  userId?: string;
  userEmail?: string;
  fatal?: boolean;
  timestamp: string;
  deviceInfo?: string;
}

export interface PresenceEntry {
  userId: string;
  email?: string;
  publicName?: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

export interface AccountEvent {
  id: string;
  userId: string;
  email: string;
  action: 'google-login' | 'signup' | 'signin' | 'signout' | 'profile-update';
  timestamp: string;
  data?: any;
}

export type RealtimeEvent =
  | { type: 'crash'; payload: CrashLog }
  | { type: 'presence'; payload: PresenceEntry }
  | { type: 'account'; payload: AccountEvent };

type Listener = (event: RealtimeEvent) => void;

// In-memory storage for local mode (when no server configured)
let localCrashLogs: CrashLog[] = [];
let localPresence: Record<string, PresenceEntry> = {};
let localAccountEvents: AccountEvent[] = [];

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let isConnected = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pendingEvents: RealtimeEvent[] = [];
const MAX_PENDING = 100;
const MAX_LOCAL_CRASHES = 200;
const MAX_LOCAL_ACCOUNT_EVENTS = 500;

const getRealtimeUrl = () => process.env.EXPO_PUBLIC_REALTIME_URL || '';

const notifyListeners = (event: RealtimeEvent) => {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (err) {
      console.warn('Realtime listener error:', err);
    }
  });
};

const storeLocally = (event: RealtimeEvent) => {
  switch (event.type) {
    case 'crash':
      localCrashLogs.unshift(event.payload);
      if (localCrashLogs.length > MAX_LOCAL_CRASHES) {
        localCrashLogs = localCrashLogs.slice(0, MAX_LOCAL_CRASHES);
      }
      break;
    case 'presence':
      localPresence[event.payload.userId] = event.payload;
      break;
    case 'account':
      localAccountEvents.unshift(event.payload);
      if (localAccountEvents.length > MAX_LOCAL_ACCOUNT_EVENTS) {
        localAccountEvents = localAccountEvents.slice(0, MAX_LOCAL_ACCOUNT_EVENTS);
      }
      break;
  }
};

const flushPending = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  pendingEvents.forEach((event) => {
    try {
      socket?.send(JSON.stringify(event));
    } catch (err) {
      console.warn('Failed to send pending event:', err);
    }
  });
  pendingEvents = [];
};

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 5000);
};

export const connect = () => {
  const url = getRealtimeUrl();
  if (!url || socket) return;

  try {
    socket = new WebSocket(url);
    
    socket.onopen = () => {
      isConnected = true;
      console.log('Realtime connected');
      flushPending();
    };
    
    socket.onclose = () => {
      isConnected = false;
      socket = null;
      console.log('Realtime disconnected');
      scheduleReconnect();
    };
    
    socket.onerror = (err) => {
      console.warn('Realtime error:', err);
      isConnected = false;
    };
    
    socket.onmessage = (evt) => {
      try {
        const event: RealtimeEvent = JSON.parse(evt.data);
        storeLocally(event);
        notifyListeners(event);
      } catch (err) {
        console.warn('Failed to parse realtime message:', err);
      }
    };
  } catch (error) {
    console.warn('Failed to connect realtime:', error);
    socket = null;
  }
};

export const disconnect = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    try {
      socket.close();
    } catch {}
  }
  socket = null;
  isConnected = false;
};

export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const sendEvent = (event: RealtimeEvent) => {
  // Always store locally and notify listeners
  storeLocally(event);
  notifyListeners(event);

  const url = getRealtimeUrl();
  if (!url) return; // Local-only mode

  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(event));
    } catch (err) {
      console.warn('Realtime send failed, queuing:', err);
      pendingEvents.push(event);
      if (pendingEvents.length > MAX_PENDING) {
        pendingEvents = pendingEvents.slice(-MAX_PENDING);
      }
    }
  } else {
    pendingEvents.push(event);
    if (pendingEvents.length > MAX_PENDING) {
      pendingEvents = pendingEvents.slice(-MAX_PENDING);
    }
    connect();
  }
};

// Capture and report crashes/errors
export const reportCrash = (
  error: Error | string,
  userId?: string,
  userEmail?: string,
  fatal: boolean = false
) => {
  const crashLog: CrashLog = {
    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'string' ? undefined : error.stack,
    userId,
    userEmail,
    fatal,
    timestamp: new Date().toISOString(),
    deviceInfo: `${require('react-native').Platform.OS} ${require('react-native').Platform.Version}`,
  };

  sendEvent({ type: 'crash', payload: crashLog });
};

// Report presence update
export const reportPresence = (
  userId: string,
  email?: string,
  publicName?: string,
  status: 'online' | 'offline' = 'online'
) => {
  const presence: PresenceEntry = {
    userId: userId,
    email,
    publicName,
    status,
    lastSeen: new Date().toISOString(),
  };

  sendEvent({ type: 'presence', payload: presence });
};

// Report account event (login, signup, update, etc.)
export const reportAccountEvent = (
  userId: string,
  email: string,
  action: AccountEvent['action'],
  data?: any
) => {
  const event: AccountEvent = {
    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
    userId,
    email,
    action,
    timestamp: new Date().toISOString(),
    data,
  };

  sendEvent({ type: 'account', payload: event });
};

// Getters for local data
export const getCrashLogs = () => [...localCrashLogs];
export const getPresence = () => ({ ...localPresence });
export const getAccountEvents = () => [...localAccountEvents];
export const clearCrashLogs = () => { localCrashLogs = []; };

// Broadcast event to all connected clients (server reset, etc.)
export const broadcast = (broadcastEvent: {
  type: string;
  payload: Record<string, any>;
}) => {
  const event = {
    type: 'broadcast',
    payload: {
      ...broadcastEvent,
      broadcastAt: new Date().toISOString(),
    },
  };

  sendEvent(event as any);
  console.log('[Realtime] Broadcast event sent:', broadcastEvent.type);
};

export const realtimeService = {
  connect,
  disconnect,
  subscribe,
  sendEvent,
  reportCrash,
  reportPresence,
  reportAccountEvent,
  broadcast,
  getCrashLogs,
  getPresence,
  getAccountEvents,
  clearCrashLogs,
  isConnected: () => isConnected,
};
