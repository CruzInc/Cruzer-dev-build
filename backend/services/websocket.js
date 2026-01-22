const { Server } = require('socket.io');

/**
 * WebSocket Service for Real-Time Communication
 * Handles: crash logs, presence updates, account events, friend updates
 */

let io = null;
const activeSessions = new Map(); // userId -> socketId
const userPresence = new Map(); // userId -> presence data

/**
 * Initialize WebSocket server
 */
function initializeWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://cruzer.app', 'https://www.cruzer.app']
        : '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', (data) => {
      const { userId, email } = data;
      if (userId) {
        socket.userId = userId;
        socket.userEmail = email;
        activeSessions.set(userId, socket.id);
        
        // Broadcast user online status
        io.emit('presence', {
          userId,
          email,
          status: 'online',
          lastSeen: new Date().toISOString()
        });
        
        console.log(`[WebSocket] User authenticated: ${userId}`);
      }
    });

    // Handle crash reports
    socket.on('crash', (crashLog) => {
      console.log(`[WebSocket] Crash log received:`, crashLog);
      
      // Broadcast to all connected clients (for team monitoring)
      io.emit('crash', crashLog);
      
      // Store crash log if needed
      // TODO: Save to database
    });

    // Handle presence updates
    socket.on('presence', (presence) => {
      const { userId, status, email, publicName } = presence;
      
      userPresence.set(userId, {
        ...presence,
        lastSeen: new Date().toISOString()
      });
      
      // Broadcast to all connected clients
      io.emit('presence', userPresence.get(userId));
      
      console.log(`[WebSocket] Presence update: ${userId} - ${status}`);
    });

    // Handle account events
    socket.on('account', (accountEvent) => {
      console.log(`[WebSocket] Account event:`, accountEvent);
      
      // Broadcast to all connected clients
      io.emit('account', accountEvent);
      
      // TODO: Save to database if needed
    });

    // Handle friend updates
    socket.on('friend-update', (friendUpdate) => {
      const { targetUserId, ...data } = friendUpdate;
      
      // Send to specific user if online
      if (targetUserId && activeSessions.has(targetUserId)) {
        const targetSocketId = activeSessions.get(targetUserId);
        io.to(targetSocketId).emit('friend-update', data);
      }
      
      // Also broadcast to sender
      socket.emit('friend-update', data);
      
      console.log(`[WebSocket] Friend update:`, friendUpdate);
    });

    // Handle friend request
    socket.on('friend-request', (request) => {
      const { toUserId, fromUser } = request;
      
      // Send to target user if online
      if (toUserId && activeSessions.has(toUserId)) {
        const targetSocketId = activeSessions.get(toUserId);
        io.to(targetSocketId).emit('friend-request', request);
        console.log(`[WebSocket] Friend request sent to: ${toUserId}`);
      }
    });

    // Handle message typing indicator
    socket.on('typing', (data) => {
      const { targetUserId, isTyping } = data;
      if (targetUserId && activeSessions.has(targetUserId)) {
        const targetSocketId = activeSessions.get(targetUserId);
        io.to(targetSocketId).emit('typing', {
          userId: socket.userId,
          isTyping
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        activeSessions.delete(socket.userId);
        
        // Update presence to offline
        const presence = {
          userId: socket.userId,
          email: socket.userEmail,
          status: 'offline',
          lastSeen: new Date().toISOString()
        };
        
        userPresence.set(socket.userId, presence);
        io.emit('presence', presence);
        
        console.log(`[WebSocket] User disconnected: ${socket.userId}`);
      } else {
        console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error:`, error);
    });
  });

  console.log('🔌 WebSocket server initialized');
  return io;
}

/**
 * Get Socket.io instance
 */
function getIO() {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
}

/**
 * Send event to specific user
 */
function sendToUser(userId, event, data) {
  if (activeSessions.has(userId)) {
    const socketId = activeSessions.get(userId);
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
}

/**
 * Broadcast event to all connected users
 */
function broadcast(event, data) {
  if (io) {
    io.emit(event, data);
    return true;
  }
  return false;
}

/**
 * Get online users
 */
function getOnlineUsers() {
  return Array.from(activeSessions.keys());
}

/**
 * Get user presence
 */
function getUserPresence(userId) {
  return userPresence.get(userId);
}

/**
 * Get all presence data
 */
function getAllPresence() {
  return Array.from(userPresence.values());
}

module.exports = {
  initializeWebSocket,
  getIO,
  sendToUser,
  broadcast,
  getOnlineUsers,
  getUserPresence,
  getAllPresence
};
