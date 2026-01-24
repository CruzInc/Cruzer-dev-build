# How to Add DNS Records to Vercel - Step by Step

**Estimated Time**: 5-10 minutes  
**Required**: Vercel account with your project  

---

## Step 1: Go to Vercel Dashboard

1. Open: **https://vercel.com/dashboard**
2. You should see your projects listed
3. Find and click: **Cruzer-dev-build** project

---

## Step 2: Go to Domains Settings

After clicking your project:

1. Click: **Settings** (top menu bar)
2. Click: **Domains** (left sidebar)
3. You should see: **cruzer-dev-build.vercel.app** listed

---

## Step 3: Click on Your Domain

1. Click: **cruzer-dev-build.vercel.app** (the domain name)
2. This opens the domain configuration page

---

## Step 4: Find DNS Records Section

On the domain page, scroll down until you see:

**"DNS Records"** section (usually near the bottom)

or 

**"Edit DNS"** button

Click on whichever you see first.

---

## Step 5: Add First Record (url1368)

### Option A: If you see an "Add DNS Record" button
1. Click: **Add DNS Record**
2. A form appears with fields

### Option B: If you see an "Edit" or "Manage DNS" button
1. Click it
2. You'll see existing records (if any)
3. Click: **Add Record** or **+** button

### Fill in the form:

**Record 1:**
```
Type:   CNAME (select from dropdown)
Name:   url1368
Value:  sendgrid.net
TTL:    3600 (leave default, or leave blank)
```

Then click: **Save** or **Add**

---

## Step 6: Add Second Record (59272004)

Click: **Add DNS Record** again (or **+** button)

```
Type:   CNAME
Name:   59272004
Value:  sendgrid.net
TTL:    3600 (or leave blank)
```

Click: **Save** or **Add**

---

## Step 7: Add Third Record (em913)

Click: **Add DNS Record** again

```
Type:   CNAME
Name:   em913
Value:  u59272004.wl005.sendgrid.net
TTL:    3600 (or leave blank)
```

Click: **Save** or **Add**

---

## Step 8: Add Fourth Record (s1._domainkey)

Click: **Add DNS Record** again

```
Type:   CNAME
Name:   s1._domainkey
Value:  s1.domainkey.u59272004.wl005.sendgrid.net
TTL:    3600 (or leave blank)
```

⚠️ **Important**: The name is `s1._domainkey` (with the dot and underscore)

Click: **Save** or **Add**

---

## Step 9: Add Fifth Record (s2._domainkey)

Click: **Add DNS Record** again

```
Type:   CNAME
Name:   s2._domainkey
Value:  s2.domainkey.u59272004.wl005.sendgrid.net
TTL:    3600 (or leave blank)
```

⚠️ **Important**: The name is `s2._domainkey` (with the dot and underscore)

Click: **Save** or **Add**

---

## Step 10: Add Sixth Record (_dmarc) - IMPORTANT!

Click: **Add DNS Record** again

```
Type:   TXT (NOT CNAME! This is different from others)
Name:   _dmarc
Value:  v=DMARC1; p=none;
TTL:    3600 (or leave blank)
```

⚠️ **CRITICAL**: This must be **TXT** type, NOT CNAME!

Click: **Save** or **Add**

---

## Step 11: Verify All Records Are Added

You should now see all **6 records** listed on the page:

✅ url1368 (CNAME) → sendgrid.net  
✅ 59272004 (CNAME) → sendgrid.net  
✅ em913 (CNAME) → u59272004.wl005.sendgrid.net  
✅ s1._domainkey (CNAME) → s1.domainkey.u59272004.wl005.sendgrid.net  
✅ s2._domainkey (CNAME) → s2.domainkey.u59272004.wl005.sendgrid.net  
✅ _dmarc (TXT) → v=DMARC1; p=none;

---

## Step 12: Wait for Propagation

After adding all records:

**Timeline:**
- ✅ **5-15 minutes**: Vercel updates (fast)
- ✅ **15-30 minutes**: Your ISP updates (medium)
- ✅ **30 min - 48 hours**: Global DNS propagation (slow)

During this time, the records are spreading across the internet's DNS servers.

---

## Step 13: Verify Records Are Working

### Option A: Check in Vercel Dashboard

1. Go back to: **Cruzer-dev-build** → **Settings** → **Domains**
2. Click: **cruzer-dev-build.vercel.app**
3. Look at DNS Records section
4. Records should show as **active** or **verified** (usually green checkmark)

### Option B: Check with MX Toolbox (Recommended)

1. Go to: **https://mxtoolbox.com/mxtoolbox/tools**
2. Select: **"CNAME Lookup"** from dropdown
3. Enter: **url1368.cruzer-dev-build.vercel.app**
4. Click: **Lookup**

**What you should see:**
- ✅ **CNAME Record**: sendgrid.net

If it shows **No Records Found**, wait longer and try again (DNS hasn't propagated yet).

Repeat for the other records:
- `59272004.cruzer-dev-build.vercel.app`
- `em913.cruzer-dev-build.vercel.app`
- `s1._domainkey.cruzer-dev-build.vercel.app`
- `s2._domainkey.cruzer-dev-build.vercel.app`

For the TXT record:
1. Go to: **https://mxtoolbox.com/mxtoolbox/tools**
2. Select: **"TXT Lookup"** from dropdown
3. Enter: **_dmarc.cruzer-dev-build.vercel.app**
4. Should show: **v=DMARC1; p=none;**

### Option C: Check SendGrid Dashboard

1. Go to: **https://app.sendgrid.com**
2. Click: **Settings** (gear icon)
3. Click: **Sender Authentication**
4. Find your domain: **cruzer-dev-build.vercel.app**
5. Click: **Verify DNS**
6. Check the status:
   - ✅ **Green checkmark**: All verified!
   - 🟡 **Yellow/pending**: Still checking, wait longer
   - ❌ **Red/failed**: Records not found, check if added correctly

---

## 📋 Quick Reference Checklist

As you add each record, check it off:

- [ ] **CNAME** url1368 → sendgrid.net
- [ ] **CNAME** 59272004 → sendgrid.net
- [ ] **CNAME** em913 → u59272004.wl005.sendgrid.net
- [ ] **CNAME** s1._domainkey → s1.domainkey.u59272004.wl005.sendgrid.net
- [ ] **CNAME** s2._domainkey → s2.domainkey.u59272004.wl005.sendgrid.net
- [ ] **TXT** _dmarc → v=DMARC1; p=none;

---

## ❌ Common Mistakes to Avoid

**Mistake 1**: Using wrong Type
- ❌ Don't use A, AAAA, MX, etc.
- ✅ Use **CNAME** for first 5 records
- ✅ Use **TXT** for _dmarc record

**Mistake 2**: Typing wrong Name
- ❌ Don't use full domain: `url1368.cruzer-dev-build.vercel.app`
- ✅ Use just the subdomain: `url1368`
- ✅ Exception: For `s1._domainkey`, use exactly: `s1._domainkey` (with dot and underscore)

**Mistake 3**: Typing wrong Value
- ❌ Don't type from memory
- ✅ Copy-paste from SendGrid dashboard (they're unique to your account!)

**Mistake 4**: Adding _dmarc as CNAME
- ❌ _dmarc MUST be **TXT** type
- ❌ Adding it as CNAME will cause errors

**Mistake 5**: Expecting instant verification
- ❌ Don't expect it to work immediately
- ✅ Wait 15 min - 48 hours for DNS propagation

---

## 🆘 Troubleshooting

### "I don't see DNS Records section in Vercel"

**Solution:**
1. Make sure you're on the domain page (click the domain name)
2. Scroll down to the bottom
3. Look for: **"DNS Records"** or **"Manage DNS"**
4. If you don't see it, try refreshing the page

### "I see Vercel's default records, where do I add new ones?"

**Solution:**
1. Vercel might already have some A records (for pointing to Vercel)
2. Scroll down to find **"Add DNS Record"** button
3. Click it to add your SendGrid records
4. You can have both types of records at the same time

### "Records show as pending/unverified"

**Solution:**
1. This is normal, wait 15-30 minutes
2. Check MX Toolbox to see if they've propagated
3. Refresh the page occasionally
4. After 30 minutes, all should show as active

### "MX Toolbox says 'No Records Found'"

**Solution:**
1. Means DNS hasn't propagated yet
2. Wait longer (could take up to 48 hours)
3. Try again in 15 minutes
4. If still not showing after 1 hour:
   - Double-check you added the record correctly
   - Make sure you saved it
   - Try flushing your DNS cache (see below)

### "How do I flush DNS cache?"

**Windows:**
```
Open Command Prompt and type:
ipconfig /flushdns
```

**Mac:**
```
Open Terminal and type:
sudo dscacheutil -flushcache
```

**Linux:**
```
Open Terminal and type:
sudo systemctl restart systemd-resolved
```

Then try MX Toolbox lookup again.

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ All 6 records show in Vercel DNS Records list
2. ✅ MX Toolbox shows all records with correct values
3. ✅ SendGrid dashboard shows **"✅ Verified"** (green checkmark)
4. ✅ You can send test emails from `/api/email/send-verification`
5. ✅ Emails appear in your inbox (not spam)

---

## Next Steps After Adding Records

1. **Wait**: 15 min - 48 hours for DNS propagation
2. **Verify**: Check with MX Toolbox or SendGrid
3. **Test**: Send a test email using `/api/email/send-verification`
4. **Deploy**: Push to production when everything works

---

**Time to complete**: 5-10 minutes  
**Total setup time**: 5 min + 15 min - 48 hours propagation  
**What's after this**: Email system will be fully operational!

Still have questions? Check:
- DNS_FIX_IMMEDIATE.md
- SENDGRID_DNS_TROUBLESHOOTING.md
- SENDGRID_SETUP_GUIDE.md
