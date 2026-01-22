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

### "Contact the Developer" / "App Not Authorized" Error

**This is the most common issue!** It happens when:

1. **OAuth Consent Screen is in Testing Mode**
   - Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → OAuth consent screen
   - Click "PUBLISH APP" button to make it available to all users
   - OR add test users in the "Test users" section if keeping in testing mode

2. **Redirect URI Mismatch**
   - The redirect URI must be added to Google Cloud Console
   - Get your exact redirect URI by checking the app logs when signing in
   - Go to APIs & Services → Credentials → Your OAuth 2.0 Client ID
   - Add these authorized redirect URIs:
     ```
     cruzer-app://redirect
     cruzer-app:/
     exp://localhost:8081
     https://auth.expo.io/@your-expo-username/cruzer-dev
     ```
   - Save and wait 5 minutes for changes to propagate

3. **Client ID Not Set or Invalid**
   - Make sure you have a `.env` file (copy from `env.example`)
   - Set `EXPO_PUBLIC_GOOGLE_CLIENT_ID` to your Web Client ID
   - The Client ID should end with `.apps.googleusercontent.com`
   - Restart your app after changing `.env`

### "Failed to sign in with Google"
- Check your internet connection
- Verify Client ID is correctly configured in `.env`
- Clear the app cache and try again
- Make sure you're using the **Web Client ID**, not iOS/Android Client ID

### "Access Denied" Error
- User cancelled or denied permissions
- Make sure to grant all requested permissions (email, profile)

### "Invalid Client" Error
- Your Client ID is incorrect or doesn't exist
- Double-check the Client ID in Google Cloud Console
- Make sure you copied the entire ID including the `.apps.googleusercontent.com` part

### OAuth Consent Screen Issues
- **Testing mode**: Only allows test users you've added
- **In production**: Must verify your app (can take weeks)
- **Solution**: Either publish the app OR add yourself as a test user

### Redirect Issues
- Verify `scheme: 'cruzer-app'` matches in both `app.json` and OAuth config
- The redirect URI should include the `/redirect` path
- Check redirect URIs are added in Google Cloud Console
- Case sensitivity matters! Use exact matches

### iOS Specific
- If using platform-specific client: Make sure iOS Client ID is used (different from Android/Web)
- Bundle ID must match exactly: `app.work.cruzer`
- For testing, you can use the Web Client ID on iOS

### Android Specific
- Ensure SHA-1 fingerprint is correct in Google Console
- Package name must match: `app.cruzer.mobile`
- Use the correct keystore (debug vs release)
  ```bash
  # Get debug SHA-1
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```

### Still Not Working?

1. **Check Console Logs**
   - Look for "Google Sign-In Debug" messages
   - Note the Client ID and Redirect URI being used
   - Check for any OAuth error messages

2. **Verify Google Cloud Setup**
   - OAuth consent screen is configured
   - Required scopes are added (openid, email, profile)
   - Correct application type (Web application for Expo)
   - Authorized redirect URIs include your app's scheme

3. **Test with Development Client ID**
   - The app has a fallback Client ID for testing
   - If it works with fallback but not yours, your config is wrong

4. **Common Fixes**
   ```bash
   # Clear Expo cache
   npx expo start -c
   
   # Reinstall dependencies
   npm install
   
   # Reset Google OAuth (remove stored credentials)
   # On iOS: Settings → Safari → Clear History and Website Data
   # On Android: Settings → Apps → Chrome → Clear Data
   ```


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
