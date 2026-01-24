# Dynamic Version & APK Update System

## Overview

A complete real-time version checking and APK update system that keeps your website synchronized with your app's latest releases. The website automatically fetches and displays the current version, changelog, and provides direct download links.

## Architecture

### Backend Components

**API Endpoints** (`/api/versions`):
- `GET /api/versions/current` - Get current version info
- `GET /api/versions/history` - Get all version history
- `POST /api/versions/check-update` - Check if update is available (used by app)
- `GET /api/versions/download-stats` - Get download statistics

### Frontend Components

**VersionChecker Component** (`website/app/components/VersionChecker.tsx`):
- Fetches latest version from backend
- Displays current version with badge
- Shows changelog/what's new
- Provides download links (iOS, Android, direct APK)
- Shows download statistics
- Auto-refreshes every hour
- Fallback to offline data if API unavailable

## Features

✅ **Real-Time Sync**: Website checks backend every hour for updates
✅ **Multiple Download Methods**: App Store, Google Play, direct APK
✅ **Download Stats**: Track downloads by platform
✅ **Changelog Display**: Show what's new in each version
✅ **Offline Support**: Works without internet (uses fallback data)
✅ **Error Handling**: Graceful fallbacks and error messages
✅ **Mobile Responsive**: Optimized for all screen sizes
✅ **Performance**: Lazy loading and optimized requests

## Setup Instructions

### 1. Backend Setup

The API is already integrated into your Express server. The versions endpoint is automatically available at:

```
https://your-api.com/api/versions/current
```

### 2. Version Data Structure

Currently stored in memory in `backend/routes/versions.js`. To persist to database:

```javascript
// Create a Version model in MongoDB
const versionSchema = new Schema({
  version: String,
  versionCode: Number,
  releaseDate: Date,
  changelog: String,
  downloads: {
    ios: String,
    android: String,
    apk: String
  },
  downloadStats: {
    ios: Number,
    android: Number,
    apk: Number
  },
  isCurrent: Boolean
});
```

### 3. Website Integration

The VersionChecker component is already integrated into your homepage. It appears in the download section and:

- Fetches data automatically on page load
- Refreshes every 60 minutes
- Shows loading spinner while fetching
- Displays error warnings if needed
- Falls back to offline data

### 4. Update Your Version Information

**To update the current version**, edit `/backend/routes/versions.js`:

```javascript
const versionsData = {
  current: {
    version: '1.0.2',  // Update this
    versionCode: 102,  // Increment this
    releaseDate: new Date('2026-01-25'),
    changelog: 'Bug fixes and performance improvements',
    downloads: {
      ios: 'https://apps.apple.com/app/cruzer',
      android: 'https://play.google.com/store/apps/details?id=com.cruzinc.cruzer',
      apk: 'https://github.com/CruzInc/Cruzer-dev-build/releases/download/v1.0.2/cruzer-1.0.2.apk'
    },
    downloadStats: {
      ios: 1250,
      android: 3480,
      apk: 892
    }
  },
  // ... previous versions
};
```

## How It Works

### On Page Load (Website)

1. VersionChecker component mounts
2. Shows "Checking for latest version..." spinner
3. Attempts to fetch from backend API endpoints (with fallbacks)
4. Displays current version, changelog, and download options
5. Shows download stats by platform

### Update Check Flow (App)

1. App calls `POST /api/versions/check-update` with current version
2. Backend compares versions
3. Returns update availability and download URL
4. App can prompt user to update

### Auto-Refresh

- Website automatically refreshes version info every 60 minutes
- No manual page refresh needed
- Always shows latest release information

## API Endpoints Reference

### GET `/api/versions/current`

Returns current version and download information.

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "1.0.1",
    "versionCode": 101,
    "releaseDate": "2026-01-24",
    "changelog": "Fixed UI bugs, improved performance",
    "downloads": {
      "ios": "https://apps.apple.com/app/cruzer",
      "android": "https://play.google.com/...",
      "apk": "https://github.com/.../releases/..."
    },
    "downloadStats": {
      "ios": 1250,
      "android": 3480,
      "apk": 892
    }
  }
}
```

### POST `/api/versions/check-update`

Check if update is available for the app.

**Request:**
```json
{
  "currentVersion": "1.0.0",
  "platform": "android"
}
```

**Response:**
```json
{
  "success": true,
  "updateAvailable": true,
  "currentVersion": "1.0.1",
  "versionCode": 101,
  "releaseDate": "2026-01-24",
  "changelog": "Fixed UI bugs, improved performance",
  "downloadUrl": "https://play.google.com/...",
  "forceUpdate": false
}
```

### GET `/api/versions/download-stats`

Get download statistics for current version.

**Response:**
```json
{
  "success": true,
  "data": {
    "ios": 1250,
    "android": 3480,
    "apk": 892
  },
  "total": 5622
}
```

### GET `/api/versions/history`

Get full version history.

**Response:**
```json
{
  "success": true,
  "current": { /* current version data */ },
  "previous": [
    { /* v1.0.0 data */ },
    { /* earlier versions */ }
  ]
}
```

## Updating Download Links

### Update Your App Store Links

Edit the `downloads` object in `backend/routes/versions.js`:

```javascript
downloads: {
  ios: 'https://apps.apple.com/app/cruzer/id1234567890',
  android: 'https://play.google.com/store/apps/details?id=com.cruzinc.cruzer',
  apk: 'https://github.com/CruzInc/Cruzer-dev-build/releases/download/v1.0.1/cruzer-1.0.1.apk'
}
```

### Get Your App Store Links

1. **iOS App Store**: Publish to App Store, copy the link from your app page
2. **Google Play**: Publish to Google Play, copy the store link
3. **Direct APK**: Host APK on GitHub Releases and copy the download link

## Environment Variables

Add these to your `.env` file if using backend API:

```env
API_BASE_URL=https://cruzer-api.vercel.app
VERSIONS_API_ENDPOINT=/api/versions/current
```

## Testing

### Test Version Check Locally

```bash
# Test the API endpoint
curl http://localhost:3001/api/versions/current

# Test update check
curl -X POST http://localhost:3001/api/versions/check-update \
  -H "Content-Type: application/json" \
  -d '{"currentVersion":"1.0.0","platform":"android"}'
```

### Test Website Component

1. Run website locally: `cd website && npm run dev`
2. Visit http://localhost:3000
3. Check download section for VersionChecker
4. Verify it shows current version and download options

## Performance Considerations

- Component caches data for 1 hour
- Graceful fallback if API unavailable
- Minimal bundle size impact
- No external dependencies beyond React
- Mobile optimized with responsive design

## Future Enhancements

1. **Database Storage**: Move versions to MongoDB for persistence
2. **Admin Panel**: Create UI to manage versions without editing code
3. **Staged Rollout**: Release versions to percentage of users first
4. **Analytics**: Track which versions users have installed
5. **Notifications**: Send push notifications for critical updates
6. **Beta Testing**: Separate beta and stable release channels
7. **Automatic Builds**: GitHub Actions to auto-publish releases

## Troubleshooting

### Version not updating on website?

- Check if backend is running and accessible
- Verify API endpoint returns correct JSON
- Check browser console for errors
- Clear browser cache and reload

### Download links not working?

- Verify App Store and Google Play links are correct
- Ensure APK is hosted and accessible
- Check if links have trailing slashes or parameters

### API not responding?

- Make sure backend server is running
- Verify `/api/versions` route is registered in server.js
- Check for rate limiting issues
- Verify CORS is enabled for website domain

## Files Modified

- `backend/routes/versions.js` - NEW: API endpoints for version management
- `backend/server.js` - UPDATED: Added versions route
- `website/app/components/VersionChecker.tsx` - NEW: React component
- `website/app/page.tsx` - UPDATED: Integrated VersionChecker

## Support

For issues or questions:
- Email: cruzzerapps@gmail.com
- Discord: https://discord.gg/vGQweSv7j4
- GitHub: https://github.com/CruzInc/Cruzer-dev-build
