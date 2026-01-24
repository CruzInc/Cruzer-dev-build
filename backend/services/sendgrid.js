const sgMail = require('@sendgrid/mail');

// Initialize with API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send email verification code to user
 * @param {string} email - User's email address
 * @param {string} verificationCode - 6-digit verification code
 * @param {string} userName - User's name (optional)
 * @returns {Promise<Object>} SendGrid response
 */
async function sendVerificationEmail(email, verificationCode, userName = 'User') {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@cruzer-dev-build.vercel.app',
      subject: 'Verify Your Cruzer Account - ' + verificationCode,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #007AFF; }
              .content { margin-bottom: 30px; }
              .code-box { 
                background-color: #f0f0f0; 
                padding: 20px; 
                border-radius: 8px; 
                text-align: center; 
                margin: 20px 0;
              }
              .verification-code { 
                font-size: 32px; 
                font-weight: bold; 
                color: #007AFF; 
                letter-spacing: 5px; 
              }
              .footer { 
                text-align: center; 
                font-size: 12px; 
                color: #666; 
                margin-top: 30px; 
                border-top: 1px solid #eee; 
                padding-top: 20px; 
              }
              .warning { 
                background-color: #fff3cd; 
                border-left: 4px solid #ffc107; 
                padding: 12px; 
                margin: 20px 0; 
                border-radius: 4px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">⚡ Cruzer</div>
                <p style="color: #666;">Email Verification</p>
              </div>

              <div class="content">
                <p>Hi ${userName},</p>
                
                <p>Thank you for signing up for Cruzer! To complete your registration, please verify your email address using the code below.</p>

                <div class="code-box">
                  <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code</p>
                  <div class="verification-code">${verificationCode}</div>
                </div>

                <p style="color: #666; font-size: 14px;">
                  This code will expire in <strong>10 minutes</strong>.
                </p>

                <div class="warning">
                  <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Cruzer support will never ask for your verification code.
                </div>

                <p>If you didn't request this verification code, you can safely ignore this email.</p>

                <p>
                  Best regards,<br>
                  <strong>The Cruzer Team</strong>
                </p>
              </div>

              <div class="footer">
                <p>© 2026 Cruzer. All rights reserved.</p>
                <p>
                  <a href="https://cruzer-dev-build.vercel.app/privacy" style="color: #007AFF; text-decoration: none;">Privacy Policy</a> | 
                  <a href="https://cruzer-dev-build.vercel.app/terms" style="color: #007AFF; text-decoration: none;">Terms</a> | 
                  <a href="https://discord.gg/vGQweSv7j4" style="color: #007AFF; text-decoration: none;">Support</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Hi ${userName},

Your Cruzer email verification code is:

${verificationCode}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The Cruzer Team

---
Privacy Policy: https://cruzer-dev-build.vercel.app/privacy
Terms: https://cruzer-dev-build.vercel.app/terms
Support: https://discord.gg/vGQweSv7j4
      `,
    };

    // Send email via SendGrid
    const response = await sgMail.send(msg);
    
    console.log(`✅ Verification email sent to ${email}`);
    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      email: email,
    };

  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 * @param {string} resetLink - Full password reset link
 * @returns {Promise<Object>} SendGrid response
 */
async function sendPasswordResetEmail(email, resetToken, resetLink) {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@cruzer-dev-build.vercel.app',
      subject: 'Reset Your Cruzer Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #007AFF; }
              .content { margin-bottom: 30px; }
              .button { 
                background-color: #007AFF; 
                color: white; 
                padding: 12px 30px; 
                border-radius: 6px; 
                text-decoration: none; 
                display: inline-block; 
                margin: 20px 0;
              }
              .footer { 
                text-align: center; 
                font-size: 12px; 
                color: #666; 
                margin-top: 30px; 
                border-top: 1px solid #eee; 
                padding-top: 20px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">⚡ Cruzer</div>
                <p style="color: #666;">Password Reset Request</p>
              </div>

              <div class="content">
                <p>Hi,</p>
                
                <p>We received a request to reset your Cruzer account password. Click the button below to create a new password.</p>

                <center>
                  <a href="${resetLink}" class="button">Reset Password</a>
                </center>

                <p style="color: #666; font-size: 14px;">
                  This link will expire in <strong>1 hour</strong>.
                </p>

                <p style="color: #999; font-size: 12px;">
                  Or copy and paste this link in your browser:<br>
                  ${resetLink}
                </p>

                <p style="color: #666; margin-top: 30px;">
                  If you didn't request this reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>

              <div class="footer">
                <p>© 2026 Cruzer. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const response = await sgMail.send(msg);
    console.log(`✅ Password reset email sent to ${email}`);
    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      email: email,
    };

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

/**
 * Send welcome email to new user
 * @param {string} email - User's email address
 * @param {string} userName - User's name
 * @returns {Promise<Object>} SendGrid response
 */
async function sendWelcomeEmail(email, userName) {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@cruzer-dev-build.vercel.app',
      subject: 'Welcome to Cruzer!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #007AFF; }
              .content { margin-bottom: 30px; }
              .footer { 
                text-align: center; 
                font-size: 12px; 
                color: #666; 
                margin-top: 30px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">⚡ Cruzer</div>
                <p style="color: #666; font-size: 18px;">Welcome Aboard!</p>
              </div>

              <div class="content">
                <p>Hi ${userName},</p>
                
                <p>Welcome to Cruzer! We're excited to have you join our community of users.</p>

                <p>Cruzer is your all-in-one social communication platform. Here's what you can do:</p>

                <ul style="color: #666; line-height: 1.8;">
                  <li>💬 Send instant messages with read receipts</li>
                  <li>📞 Make crystal-clear voice and video calls</li>
                  <li>📍 Share your location safely with friends</li>
                  <li>🎵 Integrate with Spotify and Apple Music</li>
                  <li>🤖 Use our AI assistant for smarter communication</li>
                  <li>👥 Manage friends and connect with others</li>
                  <li>🎨 Customize your experience with themes</li>
                </ul>

                <p style="margin-top: 30px;">
                  <strong>Get Started:</strong> Download the app from your device's app store and start connecting!
                </p>

                <p style="color: #999; font-size: 12px;">
                  Need help? Join our Discord community: https://discord.gg/vGQweSv7j4
                </p>
              </div>

              <div class="footer">
                <p>© 2026 Cruzer. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const response = await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${email}`);
    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      email: email,
    };

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
