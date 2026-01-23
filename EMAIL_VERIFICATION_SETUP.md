# Email Verification Setup & Testing Guide

## ✅ What's Been Implemented

### 1. **Server Reset Button in Developer Panel**
- **Location**: Developer Panel only (not in Staff Panel)
- **Access**: Open Developer Panel → Scroll to bottom → "🔄 Server Reset" button
- **Function**: Closes app for all users to apply updates (use with caution)

### 2. **Email Verification System**
The complete email verification flow has been implemented and is ready to use:

#### **Frontend Components** ✅
- Email verification modal with 6-digit code input
- Countdown timer showing code expiration (15 minutes)
- Resend code functionality
- Error handling and user feedback
- Integration with signup flow

#### **Backend Services** ✅
- Email sending via Nodemailer (Gmail SMTP)
- 6-digit random verification code generation
- Code expiration tracking (15 minutes)
- Secure code storage in MongoDB
- Email verification endpoint

#### **Email Configuration** ✅
- **Email Service**: Gmail SMTP
- **Sender Email**: cruzzerapps@gmail.com (configured)
- **App Password**: Already set up (obfuscated in code)
- **Template**: Professional HTML email with branding

---

## 📧 How Email Verification Works

### User Flow:
1. **Sign Up**
   - User fills in: Email, Password, Public Name, Private Name
   - Clicks "Sign Up" button

2. **Verification Code Sent**
   - Backend generates random 6-digit code
   - Email sent to user's address with the code
   - Code expires in 15 minutes
   - User sees verification modal

3. **Enter Code**
   - User receives email (check spam if not in inbox)
   - Enters 6-digit code in app
   - Clicks "Verify Email"

4. **Verification Complete**
   - If code is correct and not expired: Account verified ✅
   - User is automatically logged in
   - Redirected to profile screen

5. **Resend Option**
   - If code expires or wasn't received
   - Click "Resend Code" button
   - New code generated and sent

---

## 🧪 Testing the Email Verification

### **Test Scenario 1: Successful Signup**
```
1. Open app → Go to Auth screen
2. Switch to "Sign Up" mode
3. Fill in details:
   - Email: your-test-email@gmail.com
   - Password: TestPass123
   - Public Name: Test User
   - Private Name: Tester
   - Confirm Password: TestPass123
4. Click "Sign Up"
5. Check email for verification code
6. Enter code in modal
7. Click "Verify Email"
8. ✅ Should see "Success" message and be logged in
```

### **Test Scenario 2: Invalid Code**
```
1. Sign up with valid details
2. Enter wrong code (e.g., 123456)
3. Click "Verify Email"
4. ❌ Should see error: "Invalid verification code"
5. Enter correct code
6. ✅ Should verify successfully
```

### **Test Scenario 3: Expired Code**
```
1. Sign up with valid details
2. Wait 15+ minutes (or manually expire in database)
3. Enter code
4. ❌ Should see error: "Verification code has expired"
5. Click "Resend Code"
6. Enter new code
7. ✅ Should verify successfully
```

### **Test Scenario 4: Resend Code**
```
1. Sign up with valid details
2. Don't receive email or can't find it
3. Click "Resend Code" in modal
4. Check email for new code
5. Enter new code
6. ✅ Should verify successfully
```

---

## 🔧 Backend Requirements

### **Prerequisites**
Ensure your backend server is running:

```bash
cd backend
npm install
node server.js
```

Expected output:
```
🚀 Cruzer Backend Server running on port 3000
📍 Environment: development
🌐 Access at: http://localhost:3000
🔌 WebSocket ready for connections
✅ MongoDB Connected
```

### **Environment Variables**
The email service is already configured in the backend with:
- Gmail SMTP (smtp.gmail.com:465)
- Credentials: cruzzerapps@gmail.com
- App password is already obfuscated in code

**Optional**: You can override these in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@cruzer.app
```

---

## 📱 App Configuration

### **Backend URL**
Ensure your app is pointing to the correct backend:

In `.env` or environment:
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000/api
```

For physical devices (not localhost):
```env
EXPO_PUBLIC_BACKEND_URL=http://YOUR_COMPUTER_IP:3000/api
# Example: http://192.168.1.100:3000/api
```

---

## 🐛 Troubleshooting

### **Email Not Received**
1. **Check Spam Folder**: Gmail might mark it as spam initially
2. **Verify Backend**: Check backend console for email sending logs
3. **Check Gmail Settings**: App password must be enabled
4. **Network**: Ensure device can reach backend server

### **"Network Request Failed"**
- Backend server not running
- Wrong EXPO_PUBLIC_BACKEND_URL
- Firewall blocking connection
- Using localhost on physical device (use IP instead)

### **"Invalid Verification Code"**
- Code was mistyped
- Code expired (15 minutes)
- Wrong email address used

### **Backend Logs to Check**
```bash
# In backend directory
cd backend
node server.js

# Watch for these logs:
# [EmailVerification] Sending code to: http://localhost:3000/api/users/...
# Verification email sent: <message-id>
```

---

## 📋 API Endpoints

### **Send Verification Code**
```
POST /api/users/:userId/send-verification
Body: { "email": "user@example.com" }
Response: { "success": true, "message": "Verification code sent", "expiresIn": 900 }
```

### **Verify Email**
```
POST /api/users/:userId/verify-email
Body: { "verificationCode": "123456" }
Response: { "success": true, "message": "Email verified successfully" }
```

---

## 📨 Email Template Preview

Users will receive an email that looks like:

```
┌─────────────────────────────────┐
│         Cruzer                  │
│    (Blue Header Background)     │
└─────────────────────────────────┘

Verify Your Email Address

Thank you for signing up for Cruzer! To complete 
your account setup, please verify your email 
address by entering the code below:

┌─────────────────────────────────┐
│   Your Verification Code        │
│                                 │
│         123456                  │
│                                 │
└─────────────────────────────────┘

This code will expire in 15 minutes. If you 
didn't sign up for Cruzer, please ignore this 
email.

─────────────────────────────────
© 2026 Cruzer. All rights reserved.
```

---

## ✨ Features Summary

### ✅ **Fully Implemented**
- [x] Random 6-digit code generation
- [x] Professional HTML email template
- [x] 15-minute code expiration
- [x] Code validation and verification
- [x] Email sending via Gmail SMTP
- [x] Frontend verification modal
- [x] Resend code functionality
- [x] Error handling and user feedback
- [x] Automatic login after verification
- [x] Server reset button in developer panel

### 🔒 **Security Features**
- [x] Codes expire after 15 minutes
- [x] One-time use codes
- [x] Obfuscated email credentials
- [x] Secure MongoDB storage
- [x] Input validation
- [x] Error message sanitization

---

## 🚀 Quick Start Checklist

- [ ] Backend server is running (`node server.js`)
- [ ] MongoDB is connected (check backend logs)
- [ ] EXPO_PUBLIC_BACKEND_URL is set correctly in app
- [ ] Email credentials are configured
- [ ] Gmail "Less secure app access" or App Password is enabled
- [ ] Test signup with real email address
- [ ] Check email inbox (and spam) for verification code
- [ ] Verify email in app
- [ ] Test server reset button in developer panel

---

## 📞 Support

If you encounter any issues:
1. Check backend console logs
2. Verify all environment variables are set
3. Test with a real email address you have access to
4. Ensure backend server is accessible from your device
5. Check MongoDB connection status

All systems are configured and ready to use! 🎉
