const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get user by userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update user
router.post('/', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findOneAndUpdate(
      { userId },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update user settings
router.patch('/:userId/settings', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { settings: req.body } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete user
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOneAndDelete({ userId });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
