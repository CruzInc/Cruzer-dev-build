# Email Verification API Documentation

This guide covers the SendGrid email integration for account verification, password resets, and welcome emails.

## Overview

The email service uses SendGrid's API to send transactional emails. All email routes are available at `/api/email/`.

## Prerequisites

1. **SendGrid Account**: Create a free account at [sendgrid.com](https://sendgrid.com)
2. **API Key**: Get your SendGrid API key from Settings → API Keys
3. **Sender Email**: Verify a sender email or domain in SendGrid
4. **DNS Records**: Configure DNS records for domain authentication (see SENDGRID_SETUP_GUIDE.md)

## Environment Variables

Add these to your `.env` file in the `/backend` directory:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@cruzer-dev-build.vercel.app
```

## API Endpoints

### 1. Send Verification Code

**Endpoint**: `POST /api/email/send-verification`

**Purpose**: Send a 6-digit verification code to user's email during signup

**Request Body**:
```json
{
  "email": "user@example.com",
  "userName": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "email": "user@example.com",
  "expiresIn": "10 minutes",
  "messageId": "msg_123456"
}
```

**Code Expiration**: 10 minutes  
**Max Attempts**: 3 failed attempts before requiring a new code

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/email/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "userName": "John Doe"
  }'
```

**JavaScript/Fetch Example**:
```javascript
async function sendVerificationEmail(email, userName) {
  const response = await fetch('/api/email/send-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, userName })
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('Verification code sent! Expires in 10 minutes');
  }
  return data;
}
```

---

### 2. Verify Code

**Endpoint**: `POST /api/email/verify-code`

**Purpose**: Verify the 6-digit code sent to user's email

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "email": "user@example.com",
  "verified": true
}
```

**Response (Failure)**:
```json
{
  "success": false,
  "error": "Invalid verification code",
  "attemptsRemaining": 2
}
```

**Error Cases**:
- `Invalid verification code` - Code doesn't match (tracks attempts)
- `No verification code found for this email` - No code was sent
- `Verification code has expired` - More than 10 minutes passed
- `Too many failed attempts` - 3 failed attempts, need new code

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/email/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

**JavaScript/Fetch Example**:
```javascript
async function verifyCode(email, code) {
  const response = await fetch('/api/email/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('Email verified!');
    // Proceed to next step (login, account creation, etc.)
  } else {
    console.error(data.error);
    // Show error to user
  }
  return data;
}
```

---

### 3. Send Welcome Email

**Endpoint**: `POST /api/email/send-welcome`

**Purpose**: Send a welcome email to newly verified users

**Request Body**:
```json
{
  "email": "user@example.com",
  "userName": "John Doe"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Welcome email sent",
  "email": "user@example.com",
  "messageId": "msg_123456"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/email/send-welcome \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "userName": "John Doe"
  }'
```

---

### 4. Request Password Reset

**Endpoint**: `POST /api/email/request-password-reset`

**Purpose**: Send password reset link to user's email

**Request Body**:
```json
{
  "email": "user@example.com",
  "baseUrl": "https://cruzer-dev-build.vercel.app"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset email sent",
  "email": "user@example.com",
  "messageId": "msg_123456"
}
```

**Token Expiration**: 1 hour  
**Reset Link Format**: `{baseUrl}/reset-password?token={resetToken}`

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/email/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "baseUrl": "https://cruzer-dev-build.vercel.app"
  }'
```

---

### 5. Verify Reset Token

**Endpoint**: `POST /api/email/verify-reset-token`

**Purpose**: Verify password reset token is still valid

**Request Body**:
```json
{
  "token": "abc123def456..."
}
```

**Response (Valid)**:
```json
{
  "success": true,
  "email": "user@example.com",
  "valid": true
}
```

**Response (Invalid/Expired)**:
```json
{
  "success": false,
  "error": "Invalid reset token"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/email/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456..."
  }'
```

---

### 6. Health Check

**Endpoint**: `GET /api/email/health`

**Purpose**: Check if SendGrid is properly configured

**Response**:
```json
{
  "status": "ok",
  "sendgridConfigured": true,
  "fromEmailConfigured": true,
  "fromEmail": "noreply@cruzer-dev-build.vercel.app"
}
```

**cURL Example**:
```bash
curl http://localhost:3000/api/email/health
```

---

## Complete Signup Flow Example

Here's a complete example of implementing email verification in a signup flow:

```javascript
// Frontend signup form
async function handleSignup(email, password, userName) {
  try {
    // Step 1: Create account
    const accountRes = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userName })
    });
    
    if (!accountRes.ok) throw new Error('Account creation failed');
    
    // Step 2: Send verification code
    const verifyRes = await fetch('/api/email/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userName })
    });
    
    if (!verifyRes.ok) throw new Error('Failed to send verification code');
    
    const verifyData = await verifyRes.json();
    console.log('Verification code sent! Expires in:', verifyData.expiresIn);
    
    // Step 3: Show verification input screen
    return { 
      success: true, 
      message: 'Check your email for the verification code',
      email 
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// User enters verification code from email
async function handleVerifyCode(email, code) {
  try {
    const response = await fetch('/api/email/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      return { 
        success: false, 
        error: data.error,
        attemptsRemaining: data.attemptsRemaining 
      };
    }
    
    // Email verified! Send welcome email
    await fetch('/api/email/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userName })
    });
    
    // Proceed to login or dashboard
    return { 
      success: true, 
      message: 'Email verified! Welcome to Cruzer!' 
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Testing with SendGrid

### 1. Test Mode (Free Trial)

SendGrid provides free credits for testing. You can send up to 100 emails/day with a free account.

### 2. Use Sandbox Mode (for development only)

Create a Sandbox sender in SendGrid Settings → Sender Authentication and use that email for testing.

```bash
SENDGRID_FROM_EMAIL=sandbox123456789@sandbox.sendgrid.net
```

### 3. Test Email Addresses

During development, use test email addresses:
- `test@example.com`
- `user+test@gmail.com` (Gmail allows `+` aliases)
- `fake.email@tempmail.io` (temporary email service)

### 4. Monitor Sends

Check SendGrid Dashboard → Mail Send for:
- Delivery status
- Open rates
- Click rates
- Bounce rates
- Spam complaints

---

## Troubleshooting

### Email Not Sending

**Error: "Invalid email address"**
```
Solution: Check email format is valid (contains @)
```

**Error: "API Key not configured"**
```bash
# Check your .env file has:
SENDGRID_API_KEY=SG.your_key_here

# Verify API key in SendGrid Dashboard:
- Settings → API Keys
- Copy full key (starts with SG.)
```

**Error: "Unauthorized (401)"**
```
Solution: API Key is invalid or expired
- Generate new key in SendGrid Dashboard
- Update .env file
- Restart server
```

### DNS Records Not Verified

See [SENDGRID_SETUP_GUIDE.md](./SENDGRID_SETUP_GUIDE.md) for detailed DNS troubleshooting.

### Emails Going to Spam

1. **Check DNS Records**: Ensure all 6 DNS records are verified
2. **SPF/DKIM**: Verify in SendGrid Dashboard → Sender Authentication
3. **Unsubscribe Link**: Add to footer (included in our templates)
4. **Email Content**: Avoid spam trigger words (FREE!!! URGENT!!!, etc.)

---

## Production Deployment

### 1. Vercel Environment Variables

Add to Vercel project settings:
```
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 2. Domain Setup (Vercel)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain (e.g., mail.cruzer-dev-build.vercel.app)
3. Copy DNS records from SendGrid
4. Add to Vercel DNS or your registrar

### 3. Monitor Production

- Set up SendGrid webhooks for bounce/spam alerts
- Monitor email delivery rates
- Set up alerts in SendGrid for failures

---

## Rate Limits

- **Verification Code**: 1 code per email every 5 minutes
- **Password Reset**: 1 reset per email every 15 minutes  
- **General API**: 100 requests per 15 minutes (rate limiter)

---

## Security Best Practices

1. **Never log sensitive data**:
   ```javascript
   // ❌ Don't do this:
   console.log(email, code, token);
   
   // ✅ Do this:
   console.log(`Verification sent to ${email.split('@')[0]}@...`);
   ```

2. **Use HTTPS only** in production

3. **Validate input**:
   ```javascript
   // Check email format
   if (!email.includes('@')) return error;
   ```

4. **Set short expiration times**:
   - Verification code: 10 minutes
   - Password reset: 1 hour

5. **Limit attempts**:
   - Max 3 failed verification attempts
   - Require new code after 3 failures

6. **Use environment variables** for sensitive data

---

## API Response Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (missing/invalid parameters) |
| 500 | Server error (SendGrid API issue) |

---

## Next Steps

1. **Add DNS Records** (see SENDGRID_SETUP_GUIDE.md)
2. **Test Email Endpoints** (use provided cURL examples)
3. **Integrate with Auth Flow** (signup/login)
4. **Monitor Deliverability** (SendGrid Dashboard)
5. **Deploy to Production** (add env vars to Vercel)

---

## Support

- **SendGrid Docs**: https://docs.sendgrid.com/
- **SendGrid Support**: https://support.sendgrid.com/
- **Discord**: https://discord.gg/vGQweSv7j4
