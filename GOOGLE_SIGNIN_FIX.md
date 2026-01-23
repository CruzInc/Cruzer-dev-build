# 🔧 Google Sign-In Redirect URI Fix

## The Problem

You're getting a **"redirect_uri_mismatch"** error when trying to sign in with Google. This happens because the redirect URI your app is using doesn't match what's configured in Google Cloud Console.

## Your App's Redirect URI

Based on your configuration, your app is using this redirect URI:

```
https://auth.expo.io/@cruzer-devs/cruzer-dev
```

## ✅ The Solution (5 minutes)

### Step 1: Go to Google Cloud Console

Open this link: https://console.cloud.google.com/apis/credentials

### Step 2: Find Your OAuth Client ID

1. Look for the client ID that starts with: `394191305315-uuukgtb489k92mklvl4p71r7apjk6ra5`
2. Click on it to edit

### Step 3: Add These Redirect URIs

In the **"Authorized redirect URIs"** section, add ALL of these:

```
https://auth.expo.io/@cruzer-devs/cruzer-dev
cruzer-app://
cruzer-app://redirect
exp://localhost:19000
exp://127.0.0.1:19000
```

**Important:** Make sure each URI is on its own line with NO trailing spaces or slashes (except where shown).

### Step 4: Publish Your OAuth Consent Screen

This is the most commonly missed step!

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Look for a button that says **"PUBLISH APP"**
3. Click it to publish your OAuth consent screen

**Alternative:** If you want to keep it in testing mode:
- Click "Add Users" under "Test users"
- Add your Google email address
- Save

### Step 5: Save and Wait

1. Click **"Save"** in Google Cloud Console
2. Wait **5-10 minutes** for Google's servers to update
3. **Important:** Clear your app's cache:
   - Close the app completely
   - Clear app data (iOS: Delete and reinstall, Android: Clear app data in settings)

### Step 6: Test Again

1. Open your app
2. Try "Sign in with Google"
3. It should now work! ✅

---

## Still Having Issues?

### Error: "This app hasn't been verified"

**Solution:** This is normal for unpublished apps.
- Click "Advanced" → "Go to Cruzer (unsafe)"
- OR publish your OAuth consent screen (Step 4 above)

### Error: "Access denied"

**Solution:** You cancelled the sign-in or denied permissions.
- Try again and click "Allow" when prompted

### Error: "Invalid client"

**Solution:** Your Client ID might be wrong.
1. Double-check the Client ID in your `.env` file
2. Make sure it ends with `.apps.googleusercontent.com`
3. Make sure you're using a **Web application** OAuth client (not iOS or Android)

### Error: Still shows redirect_uri_mismatch

**Solutions:**
1. Wait longer (can take up to 15 minutes for changes to propagate)
2. Try copying and pasting the exact redirect URI again (no extra spaces!)
3. Make sure you saved the changes in Google Cloud Console
4. Check you're editing the correct OAuth client ID

---

## Quick Reference

### Your Configuration:
- **Scheme:** `cruzer-app`
- **Slug:** `cruzer-dev`  
- **Owner:** `cruzer-devs`
- **Client ID:** `394191305315-uuukgtb489k92mklvl4p71r7apjk6ra5.apps.googleusercontent.com`

### Most Important Redirect URI:
```
https://auth.expo.io/@cruzer-devs/cruzer-dev
```

### Console Links:
- **Credentials:** https://console.cloud.google.com/apis/credentials
- **OAuth Consent:** https://console.cloud.google.com/apis/credentials/consent

---

## Testing Commands

Check your configuration:
```bash
node scripts/check-google-redirect.js
```

Check if Google credentials are working:
```bash
bash scripts/check-google-auth.sh
```

---

## After It's Working

Once Google Sign-In is working, you'll see:
- ✅ A Google sign-in prompt
- ✅ Your Google account info
- ✅ Automatic account creation
- ✅ Profile picture from Google
- ✅ Blue "Google" badge in the Developer Panel

---

**Need more help?** Check [GOOGLE_SIGNIN_SETUP.md](GOOGLE_SIGNIN_SETUP.md) for full setup instructions.
