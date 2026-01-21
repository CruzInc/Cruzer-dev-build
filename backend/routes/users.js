const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateVerificationCode, sendVerificationEmail } = require('../services/emailService');

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

// Send email verification code
router.post('/:userId/send-verification', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Check if email already verified for another user
    const existingUser = await User.findOne({ 
      email, 
      emailVerified: true,
      userId: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already verified on another account' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with verification code
    const user = await User.findOneAndUpdate(
      { userId },
      { 
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpires: expiresAt,
        email: email
      },
      { new: true, runValidators: true, upsert: true }
    );

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send verification email',
        details: emailResult.error
      });
    }

    res.json({ 
      success: true, 
      message: 'Verification code sent to email',
      expiresIn: 900 // 15 minutes in seconds
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Verify email with code
router.post('/:userId/verify-email', async (req, res) => {
  try {
    const { userId } = req.params;
    const { verificationCode } = req.body;

    if (!verificationCode) {
      return res.status(400).json({ success: false, error: 'Verification code is required' });
    }

    // Find user with matching code
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if code is correct
    if (user.emailVerificationCode !== verificationCode) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    // Check if code has expired
    if (new Date() > user.emailVerificationCodeExpires) {
      return res.status(400).json({ success: false, error: 'Verification code has expired' });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpires = undefined;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Email verified successfully',
      data: user
    });
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
