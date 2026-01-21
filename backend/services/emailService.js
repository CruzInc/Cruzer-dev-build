const nodemailer = require('nodemailer');
const { deobfuscateString } = require('../utils/obfuscate');

// Obfuscated credentials (for security - deobfuscate at runtime)
// EMAIL_USER: cruzzerapps@gmail.com
const EMAIL_USER_OBFUSCATED = [99,114,117,122,122,101,114,97,112,112,115,64,103,109,97,105,108,46,99,111,109];
// EMAIL_PASS: Hs1090hs (app password)
const EMAIL_PASS_OBFUSCATED = [72,115,49,48,57,48,104,115];

// De-obfuscate credentials
const deobfuscatedUser = String.fromCharCode(...EMAIL_USER_OBFUSCATED);
const deobfuscatedPass = String.fromCharCode(...EMAIL_PASS_OBFUSCATED);

// Initialize email transporter
// In production, use your email service provider (SendGrid, AWS SES, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || deobfuscatedUser,
    pass: process.env.EMAIL_PASS || deobfuscatedPass,
  },
});

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
async function sendVerificationEmail(email, verificationCode) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@cruzer.app',
      to: email,
      subject: 'Verify Your Cruzer Email Address',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background-color: #007AFF; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Cruzer</h1>
          </div>
          <div style="background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Thank you for signing up for Cruzer! To complete your account setup, please verify your email address by entering the code below:
            </p>
            <div style="background-color: #007AFF; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8);">Your Verification Code</p>
              <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">${verificationCode}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 15 minutes. If you didn't sign up for Cruzer, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              © 2026 Cruzer. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `Verify Your Cruzer Email Address\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
};
