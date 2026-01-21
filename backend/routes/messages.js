const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Get all messages for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { contactId, limit = 100, skip = 0 } = req.query;

    const query = { userId };
    if (contactId) {
      query.contactId = contactId;
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({ success: true, data: messages, count: messages.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new message
router.post('/', async (req, res) => {
  try {
    const message = new Message(req.body);
    await message.save();
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update message (mark as read, delivered, etc.)
router.patch('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndUpdate(
      messageId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndDelete(messageId);

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk create messages (sync from app)
router.post('/bulk', async (req, res) => {
  try {
    const { messages } = req.body;
    const result = await Message.insertMany(messages, { ordered: false });
    res.status(201).json({ success: true, data: result, count: result.length });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
