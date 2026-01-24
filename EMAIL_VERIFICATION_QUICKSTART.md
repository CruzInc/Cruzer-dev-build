# Email Verification Quick Start Guide

This guide walks you through setting up email verification for your Cruzer app in 5 minutes.

## 📋 Checklist

- [ ] **Backend Setup**: Email routes created and server updated
- [ ] **SendGrid Account**: Create free account
- [ ] **API Key**: Generate and add to .env
- [ ] **DNS Records**: Add 6 DNS records to your domain
- [ ] **Testing**: Test verification flow
- [ ] **Deployment**: Deploy to production

---

## ✅ Step 1: Backend Setup (Already Done!)

The email infrastructure is now ready:

✓ Email service created: `backend/services/sendgrid.js`  
✓ Email routes created: `backend/routes/email.js`  
✓ Server updated: `backend/server.js` (added `/api/email` route)  
✓ Package installed: `@sendgrid/mail` (v13+)  

**What this includes:**
- Send verification codes (6-digit, 10-min expiration)
- Verify codes with rate limiting (3 attempts max)
- Send welcome emails
- Password reset functionality
- Health check endpoint

---

## 🔑 Step 2: SendGrid Account & API Key

### Create Account (Free)
1. Go to https://sendgrid.com/free
2. Sign up with your email
3. Verify your email address
4. Choose "Email API" as your primary need

### Generate API Key

1. **Log into SendGrid Dashboard**
   - Go to https://app.sendgrid.com/

2. **Create API Key**
   - Left sidebar → Settings → API Keys
   - Click "Create API Key"
   - Name it: `Cruzer Backend`
   - Permissions: Full Access (for testing) or select these:
     - `mail.send` (required)
     - `mail_settings` (optional)
   - Click "Create & View"
   - **COPY THE FULL KEY** (starts with `SG.`)

3. **Add to Backend .env**
   ```bash
   cd /workspaces/Cruzer-dev-build/backend
   ```
   
   Open (or create) `.env` file:
   ```
   SENDGRID_API_KEY=SG.your_key_here_paste_full_key
   SENDGRID_FROM_EMAIL=noreply@cruzer-dev-build.vercel.app
   SENDGRID_API_KEY_NAME=Cruzer Backend
   ```

4. **Test it works**
   ```bash
   cd /workspaces/Cruzer-dev-build/backend
   npm install
   node -e "const sgMail = require('@sendgrid/mail'); sgMail.setApiKey(process.env.SENDGRID_API_KEY); console.log('✅ SendGrid API key loaded successfully');"
   ```
   Should output: `✅ SendGrid API key loaded successfully`

---

## 📧 Step 3: Verify Sender Email

You must verify at least one sender email address before SendGrid will send emails.

### Option A: Quick Verification (Sandbox - Development Only)

1. Go to Settings → Sender Authentication → Senders
2. Click "Create New Sender"
3. Use any email: `noreply@cruzer-dev-build.vercel.app` or `hello@cruzer-dev-build.vercel.app`
4. Verify the email (click link in your inbox)

**Note**: Sandbox senders can only send to verified recipients (your own email)

### Option B: Domain Verification (Production - Recommended)

This requires adding DNS records to your domain:

1. Go to Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Select your domain: `cruzer-dev-build.vercel.app`
4. **Copy the 5-6 DNS records provided**
5. See **Step 4** below

---

## 🔐 Step 4: Add DNS Records (Domain Authentication)

**⏱️ Time**: 5-10 minutes setup + 24-48 hours for propagation

This step verifies you own the domain and improves email deliverability.

### Where to Add DNS Records

Choose your domain provider:

**For Vercel (Recommended if using Vercel domains):**
1. Go to Vercel Dashboard → Select Project → Settings → Domains
2. Click your domain
3. Scroll to "DNS Records"
4. Add the 5-6 records from SendGrid (see below)

**For Other Providers:**
- GoDaddy: Domain Control Panel → DNS
- Namecheap: Advanced DNS
- Route53 (AWS): Hosted Zones → Records
- Cloudflare: DNS tab

### DNS Records to Add

Copy these from your SendGrid dashboard (Settings → Sender Authentication):

| Type | Name | Value |
|------|------|-------|
| CNAME | url1368.cruzer-dev-build.vercel.app | sendgrid.net |
| CNAME | 59272004.cruzer-dev-build.vercel.app | sendgrid.net |
| CNAME | em913.cruzer-dev-build.vercel.app | sendgrid.net |
| CNAME | s1._domainkey.cruzer-dev-build.vercel.app | s1.domainkey.sendgrid.net |
| CNAME | s2._domainkey.cruzer-dev-build.vercel.app | s2.domainkey.sendgrid.net |
| TXT | _dmarc.cruzer-dev-build.vercel.app | v=DMARC1; p=none |

**⚠️ Important**: Use the EXACT names and values from SendGrid (they're unique to your account)

### Verify DNS Records

After adding (wait 24-48 hours for propagation):

1. **Using SendGrid Dashboard:**
   - Settings → Sender Authentication
   - Click "Verify DNS"
   - Should show "Verified" with green checkmark

2. **Check Status:**
   - Visit https://mxtoolbox.com
   - Enter your domain
   - Look for your CNAME records

3. **In SendGrid Dashboard:**
   - Mail Send → Statistics
   - Should show increasing delivery counts

---

## 🧪 Step 5: Test Email Verification

### Test Locally

**Start the backend server:**
```bash
cd /workspaces/Cruzer-dev-build/backend
npm start
# Should see: "Server running on port 3000"
```

**Test sending verification email:**
```bash
# In another terminal:
curl -X POST http://localhost:3000/api/email/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "userName": "Test User"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "email": "your-email@gmail.com",
  "expiresIn": "10 minutes",
  "messageId": "msg_abc123"
}
```

**Check your email inbox** (and spam folder) for the 6-digit code.

**Verify the code:**
```bash
curl -X POST http://localhost:3000/api/email/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "code": "123456"  # Replace with code from email
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "email": "your-email@gmail.com",
  "verified": true
}
```

---

## 📱 Step 6: Integrate with Your App

### Add to Signup Flow (Frontend)

```javascript
import { useState } from 'react';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [code, setCode] = useState('');

  // Step 1: User enters email and password
  const handleSignup = async (e) => {
    e.preventDefault();
    
    try {
      // Send verification code
      const res = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          userName: 'User' // Get from form
        })
      });

      if (res.ok) {
        setShowVerification(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Step 2: User enters verification code
  const handleVerify = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();
      
      if (data.success) {
        // Email verified! Send welcome email
        await fetch('/api/email/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userName: 'User' })
        });

        // Redirect to dashboard or login
        window.location.href = '/dashboard';
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (showVerification) {
    return (
      <form onSubmit={handleVerify}>
        <h2>Verify Your Email</h2>
        <p>We sent a 6-digit code to {email}</p>
        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength="6"
          required
        />
        <button type="submit">Verify Email</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignup}>
      <h2>Sign Up</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {/* Add password input */}
      <button type="submit">Next: Verify Email</button>
    </form>
  );
}
```

See [EMAIL_API_DOCUMENTATION.md](./EMAIL_API_DOCUMENTATION.md) for complete API reference and examples.

---

## 🚀 Step 7: Deploy to Production

### 1. Add Environment Variables to Vercel

```bash
# Go to Vercel Dashboard
# Project Settings → Environment Variables

SENDGRID_API_KEY=SG.your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 2. Update Backend URL in App

```javascript
// In your frontend code:
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Make sure it points to your deployed backend:
// https://your-backend-domain.com/api
```

### 3. Deploy Backend

If using Vercel for backend too:
```bash
cd backend
vercel --prod
```

### 4. Test Production Emails

```bash
curl -X POST https://your-backend.vercel.app/api/email/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "userName": "Test"
  }'
```

---

## 📊 Monitor Deliverability

### SendGrid Dashboard

1. **Mail Send**: Real-time delivery stats
2. **Recipients**: Bounces, spam complaints, unsubscribes
3. **Alerts**: Set up notifications for failures
4. **Logs**: See individual email delivery status

### Common Issues

**Email not received?**
- Check spam folder
- Verify sender email is verified in SendGrid
- Ensure DNS records are propagated (wait 24-48 hours)
- Check SendGrid dashboard for bounce reasons

**Email going to spam?**
- Make sure DNS records are verified (SPF, DKIM)
- Avoid spam trigger words (FREE!!!, URGENT!!!, etc.)
- Include unsubscribe link (we include this automatically)

---

## 📚 Full Documentation

- [EMAIL_API_DOCUMENTATION.md](./EMAIL_API_DOCUMENTATION.md) - Complete API reference
- [SENDGRID_SETUP_GUIDE.md](./SENDGRID_SETUP_GUIDE.md) - Detailed DNS setup
- [SendGrid Official Docs](https://docs.sendgrid.com/)

---

## 🆘 Troubleshooting

**API Key Error**
```
Error: Unauthorized (401)
Solution: Check API key is correct and starts with "SG."
```

**Email not sending**
```
Error: Invalid email address
Solution: Check email format is valid (has @)
```

**DNS not verifying**
```
Solution: Wait 24-48 hours for DNS propagation
         Check records in mxtoolbox.com
         Ensure EXACT names and values from SendGrid
```

**Still having issues?**
- Check [EMAIL_API_DOCUMENTATION.md](./EMAIL_API_DOCUMENTATION.md) troubleshooting section
- Visit SendGrid support: https://support.sendgrid.com/
- Join Discord: https://discord.gg/vGQweSv7j4

---

## ✨ What's Next?

After email verification is working:

1. **Add Password Reset**: Use `/api/email/request-password-reset` endpoint
2. **Two-Factor Auth**: Send OTP via email during login
3. **Email Notifications**: Send activity summaries
4. **Newsletter**: Send product updates to users
5. **Analytics**: Track email opens and clicks

---

**Status**: ✅ Email infrastructure ready  
**Time to production**: ~24-48 hours (waiting for DNS propagation)  
**Need help?**: Check documentation or ask in Discord
