const express = require('express');
const router = express.Router();
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../services/sendgrid');
const crypto = require('crypto');

// In-memory store for verification codes (use MongoDB in production)
const verificationCodes = new Map();
const passwordResetTokens = new Map();

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a secure reset token
 * @returns {string} Reset token
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/email/send-verification
 * Send verification code to user's email
 */
router.post('/send-verification', async (req, res) => {
  try {
    const { email, userName } = req.body;

    // Validate input
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required',
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store verification code
    verificationCodes.set(email, {
      code: verificationCode,
      expiresAt,
      attempts: 0,
    });

    // Send email
    const result = await sendVerificationEmail(email, verificationCode, userName || 'User');

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      email,
      expiresIn: '10 minutes',
      messageId: result.messageId,
    });

    console.log(`✅ Verification code sent to ${email}: ${verificationCode}`);

  } catch (error) {
    console.error('❌ Error in /send-verification:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send verification email',
    });
  }
});

/**
 * POST /api/email/verify-code
 * Verify the code sent to user's email
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    // Validate input
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email and verification code are required',
      });
    }

    // Get stored verification code
    const stored = verificationCodes.get(email);

    if (!stored) {
      return res.status(400).json({
        success: false,
        error: 'No verification code found for this email',
      });
    }

    // Check if expired
    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired',
      });
    }

    // Check max attempts
    if (stored.attempts >= 3) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        error: 'Too many failed attempts. Please request a new code.',
      });
    }

    // Verify code
    if (code !== stored.code) {
      stored.attempts++;
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code',
        attemptsRemaining: 3 - stored.attempts,
      });
    }

    // Code is valid - remove it
    verificationCodes.delete(email);

    res.json({
      success: true,
      message: 'Email verified successfully',
      email,
      verified: true,
    });

    console.log(`✅ Email verified for ${email}`);

  } catch (error) {
    console.error('❌ Error in /verify-code:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify code',
    });
  }
});

/**
 * POST /api/email/send-welcome
 * Send welcome email to new user
 */
router.post('/send-welcome', async (req, res) => {
  try {
    const { email, userName } = req.body;

    // Validate input
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required',
      });
    }

    // Send welcome email
    const result = await sendWelcomeEmail(email, userName || 'User');

    res.json({
      success: true,
      message: 'Welcome email sent',
      email,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('❌ Error in /send-welcome:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send welcome email',
    });
  }
});

/**
 * POST /api/email/request-password-reset
 * Send password reset token to user's email
 */
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email, baseUrl } = req.body;

    // Validate input
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required',
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    // Store reset token
    passwordResetTokens.set(resetToken, {
      email,
      expiresAt,
    });

    // Build reset link
    const resetUrl = `${baseUrl || 'https://cruzer-dev-build.vercel.app'}/reset-password?token=${resetToken}`;

    // Send email
    const result = await sendPasswordResetEmail(email, resetToken, resetUrl);

    res.json({
      success: true,
      message: 'Password reset email sent',
      email,
      messageId: result.messageId,
    });

    console.log(`✅ Password reset email sent to ${email}`);

  } catch (error) {
    console.error('❌ Error in /request-password-reset:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send password reset email',
    });
  }
});

/**
 * POST /api/email/verify-reset-token
 * Verify password reset token
 */
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Reset token is required',
      });
    }

    // Get stored token
    const stored = passwordResetTokens.get(token);

    if (!stored) {
      return res.status(400).json({
        success: false,
        error: 'Invalid reset token',
      });
    }

    // Check if expired
    if (Date.now() > stored.expiresAt) {
      passwordResetTokens.delete(token);
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired',
      });
    }

    res.json({
      success: true,
      email: stored.email,
      valid: true,
    });

  } catch (error) {
    console.error('❌ Error in /verify-reset-token:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify reset token',
    });
  }
});

/**
 * GET /api/email/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    res.json({
      status: 'ok',
      sendgridConfigured: !!apiKey,
      fromEmailConfigured: !!fromEmail,
      fromEmail: fromEmail || 'not-configured',
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

module.exports = router;
