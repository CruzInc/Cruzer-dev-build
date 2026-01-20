# Google Sign-In Setup Guide

## Status: ✅ Fully Functional & Ready

The Google Sign-In implementation is **complete and ready to use**. It includes:

✅ Proper OAuth 2.0 flow with token-based authentication  
✅ User profile fetching (name, email, profile picture)  
✅ Automatic account creation or login for existing users  
✅ Profile picture sync from Google  
✅ Developer panel integration with Google badge  
✅ Error handling and user feedback  
✅ Smooth animations and transitions  

## Google Accounts in Developer Panel

Google accounts are now clearly identified in the Developer Panel with:
- **Blue "Google" badge** on the account card
- **Account Type** field showing "Google Account"
- All standard account information (email, name, last login, etc.)

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable the **Google+ API** or **People API**

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Select application type:
   - For **iOS**: Select "iOS"
   - For **Android**: Select "Android"
   - For **Web/Testing**: Select "Web application"

### 3. Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Fill in required information:
   - App name: **Cruzer**
   - User support email: Your email
   - Developer contact: Your email
3. Add scopes:
   - `openid`
   - `email`
   - `profile`

### 4. Get Your Client ID

#### For iOS:
- Bundle ID: `app.work.cruzer`
- Copy the **iOS Client ID**

#### For Android:
- Package name: `app.cruzer.mobile`
- SHA-1 fingerprint: Get from your keystore
  ```bash
  # Debug keystore (for development)
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```
- Copy the **Android Client ID**

#### For Web (Development/Testing):
- Authorized redirect URIs:
  - `https://auth.expo.io/@cruzzerapps/cruzer-dev`
  - `exp://localhost:8081`
  - Add your custom scheme: `cruzer-app://auth/callback`

### 5. Add Client ID to Environment

Add your Client ID to `.env`:

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=YOUR-CLIENT-ID-HERE.apps.googleusercontent.com
```

**Note**: The app has a fallback development client ID, but you should use your own for production.

### 6. Test Google Sign-In

1. Start the app
2. Navigate to the Sign In screen
3. Tap "Sign in with Google"
4. Select your Google account
5. Grant permissions
6. You'll be redirected back to the app and signed in!

### 7. Verify in Developer Panel

1. Open the Developer Panel (enter PIN: `1090` or use whitelisted IP)
2. You'll see the new Google account with:
   - Blue "Google" badge
   - Profile picture from Google
   - Email and name
   - "Google Account" type in expanded view

## Features

### Account Creation
- New Google users automatically get an account created
- Profile picture synced from Google
- Phone number auto-generated
- Last login tracked

### Account Updates
- Existing users can sign in with their Google account
- Profile picture updates from Google on each login
- Last login timestamp updated

### Developer Panel Integration
- Google accounts clearly marked with blue badge
- Account type field shows "Google Account" vs "Email/Password"
- All account details visible (email, password hash, phone, etc.)
- Full developer controls (whitelist, view details, etc.)

## Troubleshooting

### "Failed to sign in with Google"
- Check your internet connection
- Verify Client ID is correctly configured
- Ensure OAuth consent screen is published (not in testing mode with no test users)

### Redirect issues
- Verify `scheme: 'cruzer-app'` matches in both `app.json` and OAuth config
- Check redirect URIs are added in Google Cloud Console

### iOS Specific
- Make sure iOS Client ID is used (different from Android/Web)
- Bundle ID must match exactly: `app.work.cruzer`

### Android Specific
- Ensure SHA-1 fingerprint is correct
- Package name must match: `app.cruzer.mobile`
- Use the correct keystore (debug vs release)

## Production Checklist

- [ ] Create production OAuth credentials
- [ ] Add production redirect URIs
- [ ] Publish OAuth consent screen
- [ ] Set production Client ID in environment
- [ ] Test on real devices (iOS & Android)
- [ ] Verify Developer Panel shows Google accounts correctly
- [ ] Test account switching and profile updates

## Security Notes

- OAuth tokens are not stored permanently
- Only user profile information is saved
- Password field for Google accounts shows: `google-oauth-[timestamp]`
- Client ID can be public (it's client-side anyway)
- Never commit `.env` file to version control (already in `.gitignore`)
