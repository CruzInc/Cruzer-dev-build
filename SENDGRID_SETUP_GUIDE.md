# SendGrid DNS Configuration Guide

## Overview

These DNS records authenticate your domain (cruzer-dev-build.vercel.app) with SendGrid for sending verification emails.

## DNS Records to Add

Add these records to your domain's DNS provider:

| Type | Host | Value |
|------|------|-------|
| CNAME | url1368.cruzer-dev-build.vercel.app | sendgrid.net |
| CNAME | 59272004.cruzer-dev-build.vercel.app | sendgrid.net |
| CNAME | em913.cruzer-dev-build.vercel.app | u59272004.wl005.sendgrid.net |
| CNAME | s1._domainkey.cruzer-dev-build.vercel.app | s1.domainkey.u59272004.wl005.sendgrid.net |
| CNAME | s2._domainkey.cruzer-dev-build.vercel.app | s2.domainkey.u59272004.wl005.sendgrid.net |
| TXT | _dmarc.cruzer-dev-build.vercel.app | v=DMARC1; p=none; |

## What Each Record Does

### CNAME Records (Link Tracking & Signing)
- **url1368.cruzer-dev-build.vercel.app** → sendgrid.net
  - Enables link tracking in emails
  
- **59272004.cruzer-dev-build.vercel.app** → sendgrid.net
  - Enables click tracking in emails
  
- **em913.cruzer-dev-build.vercel.app** → u59272004.wl005.sendgrid.net
  - Bounce/complaint management
  
- **s1._domainkey.cruzer-dev-build.vercel.app** → s1.domainkey.u59272004.wl005.sendgrid.net
  - DKIM signing key #1 (email authentication)
  
- **s2._domainkey.cruzer-dev-build.vercel.app** → s2.domainkey.u59272004.wl005.sendgrid.net
  - DKIM signing key #2 (email authentication)

### TXT Record (DMARC Policy)
- **_dmarc.cruzer-dev-build.vercel.app** → v=DMARC1; p=none;
  - DMARC policy (Domain-based Message Authentication)
  - Set to `p=none` initially for monitoring
  - Can upgrade to `p=quarantine` or `p=reject` later

## How to Add These Records

### Option 1: If You Have a Custom Domain Registrar (GoDaddy, Namecheap, Route53, etc.)

1. Log in to your DNS provider
2. Find DNS settings/DNS management
3. Add each CNAME record:
   - **Host**: url1368.cruzer-dev-build.vercel.app
   - **Type**: CNAME
   - **Value**: sendgrid.net
4. Add the TXT record:
   - **Host**: _dmarc.cruzer-dev-build.vercel.app
   - **Type**: TXT
   - **Value**: v=DMARC1; p=none;
5. Save and wait 24-48 hours for propagation

### Option 2: If Using Vercel's Built-in DNS

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Domains
4. Click your domain (cruzer-dev-build.vercel.app)
5. Scroll to "DNS Records"
6. Click "Add DNS Record"
7. Add each record manually

### Option 3: Using Cloudflare (if your domain is on Cloudflare)

1. Log in to Cloudflare
2. Select your zone
3. Go to DNS
4. Add each CNAME record
5. Make sure records are "DNS only" (not proxied)

## Step-by-Step Instructions

### For Vercel Domains:

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Select Project**: cruzer-dev-build

3. **Go to Settings → Domains**

4. **Find your domain**: cruzer-dev-build.vercel.app

5. **Add DNS Records** (click "Add DNS Record" for each):

```
Record 1:
- Type: CNAME
- Name: url1368
- Value: sendgrid.net
- TTL: 3600

Record 2:
- Type: CNAME
- Name: 59272004
- Value: sendgrid.net
- TTL: 3600

Record 3:
- Type: CNAME
- Name: em913
- Value: u59272004.wl005.sendgrid.net
- TTL: 3600

Record 4:
- Type: CNAME
- Name: s1._domainkey
- Value: s1.domainkey.u59272004.wl005.sendgrid.net
- TTL: 3600

Record 5:
- Type: CNAME
- Name: s2._domainkey
- Value: s2.domainkey.u59272004.wl005.sendgrid.net
- TTL: 3600

Record 6:
- Type: TXT
- Name: _dmarc
- Value: v=DMARC1; p=none;
- TTL: 3600
```

6. **Save** all records

7. **Go back to SendGrid** to verify records

## Verification

After adding DNS records:

1. Go to SendGrid Dashboard
2. Settings → Sender Authentication
3. Click "Verify DNS"
4. Wait for verification (can take 24-48 hours)
5. Status will change from "Pending" to "Verified"

## Troubleshooting

### Records Not Verifying After 24 Hours

**Common Issues:**
- TTL not updated yet (can take 48 hours)
- CNAME values have typos
- Records not added to correct domain
- DNS provider not saving changes

**Solutions:**
1. Double-check all values match exactly
2. Wait up to 48 hours
3. Use DNS checker: https://mxtoolbox.com/
4. Contact your DNS provider support

### Checking if Records Propagated

Use MX Toolbox to verify:

1. Go to https://mxtoolbox.com/
2. Select "CNAME Lookup"
3. Enter: `url1368.cruzer-dev-build.vercel.app`
4. Should show: `sendgrid.net`

Do this for each CNAME record to verify all are live.

## Next Steps

1. Add all 6 DNS records above
2. Wait 24-48 hours for DNS propagation
3. Verify in SendGrid dashboard
4. Start sending verification emails!

## Integration Code

Once verified, use this in your backend:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'user@example.com',
  from: 'noreply@cruzer-dev-build.vercel.app',
  subject: 'Email Verification Code',
  text: `Your verification code is: ${verificationCode}`,
  html: `<strong>Your verification code is:</strong> ${verificationCode}`,
};

await sgMail.send(msg);
```

## Environment Variables Needed

In your `.env.local` or backend config:

```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@cruzer-dev-build.vercel.app
```

---

**Status**: Ready to set up  
**Time to Complete**: 5 minutes + 24-48 hours DNS propagation  
**Difficulty**: Easy
