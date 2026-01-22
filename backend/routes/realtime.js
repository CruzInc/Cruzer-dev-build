const express = require('express');
const router = express.Router();
const { getOnlineUsers, getUserPresence, getAllPresence, broadcast } = require('../services/websocket');

/**
 * Get all online users
 */
router.get('/online', (req, res) => {
  try {
    const onlineUsers = getOnlineUsers();
    res.json({ 
      success: true, 
      count: onlineUsers.length,
      users: onlineUsers 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get specific user presence
 */
router.get('/presence/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const presence = getUserPresence(userId);
    
    if (!presence) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found or offline' 
      });
    }

    res.json({ success: true, data: presence });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all presence data
 */
router.get('/presence', (req, res) => {
  try {
    const allPresence = getAllPresence();
    res.json({ 
      success: true, 
      count: allPresence.length,
      data: allPresence 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Broadcast message to all connected clients
 */
router.post('/broadcast', (req, res) => {
  try {
    const { event, data } = req.body;
    
    if (!event) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event name is required' 
      });
    }

    const sent = broadcast(event, data);
    
    if (sent) {
      res.json({ 
        success: true, 
        message: 'Broadcast sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to broadcast message' 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Health check for realtime service
 */
router.get('/health', (req, res) => {
  try {
    const onlineCount = getOnlineUsers().length;
    res.json({ 
      success: true, 
      status: 'operational',
      onlineUsers: onlineCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      status: 'error',
      error: error.message 
    });
  }
});

module.exports = router;
