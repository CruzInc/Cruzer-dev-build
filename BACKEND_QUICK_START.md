# Backend Integration Quick Setup

## 🚀 5-Minute Setup

### Step 1: Initialize Backend in Your App

Add to `app/_layout.tsx` after analytics:

```typescript
import { backend } from '../services/backend';
import { analyticsSync } from '../services/analyticsSync';

async function initializeBackend() {
  try {
    // Replace with your actual backend URL
    const backendURL = process.env.EXPO_PUBLIC_API_URL || 'https://api.yourapp.com';
    
    await backend.initialize(backendURL);
    
    // Initialize analytics sync (syncs every 2 minutes)
    await analyticsSync.initialize({
      syncInterval: 120000,
      includeDeviceInfo: true,
    });
    
    console.log('✅ Backend initialized');
  } catch (error) {
    console.error('❌ Backend init error:', error);
  }
}

// Call in useEffect
useEffect(() => {
  initializeBackend();
}, []);
```

### Step 2: Save User Environment Variable

Add to `.env` or `env.example`:

```env
# Backend API
EXPO_PUBLIC_API_URL=https://your-api-server.com
```

### Step 3: Authenticate User on Login

```typescript
import { backend } from '../services/backend';

async function handleLogin(email: string, password: string) {
  const user = await backend.authenticate(email, password);
  
  if (user) {
    backend.setCurrentUser(user.id);
    console.log('✅ Logged in:', user.username);
    // Navigate to home screen
  } else {
    console.log('❌ Login failed');
  }
}
```

Done! Now:
- ✅ User profiles sync to backend
- ✅ Analytics send automatically
- ✅ Cross-user visibility enabled
- ✅ Offline sync queue handles disconnections

---

## 📊 Data Flow

```
User Action
    ↓
Logged Locally
    ↓
Backend Every 2 Min
    ↓
Server Persists
    ↓
Visible to Developers & Other Users
```

---

## 🔧 Configuration

### Change Sync Interval

```typescript
await analyticsSync.initialize({
  syncInterval: 30000, // Every 30 seconds
});
```

### Manual Sync

```typescript
// Force sync right now
await analyticsSync.forceSyncNow();
```

### Check Status

```typescript
const status = backend.getSessionInfo();
console.log(status); // See auth, user, queue info

const syncStatus = analyticsSync.getStatus();
console.log(syncStatus); // See last sync, interval info
```

---

## 🌐 Backend Endpoints Needed

Your backend needs these endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login user |
| GET | `/users/:id` | Get profile |
| PUT | `/users/:id` | Update profile |
| GET | `/users` | List users |
| GET | `/users/search` | Search users |
| POST | `/users/:id/status` | Update status |
| POST | `/analytics` | Receive analytics |
| GET | `/health` | Health check |

---

## 💾 Example Endpoints (Node.js/Express)

```javascript
// Simple Express backend example
const express = require('express');
const app = express();

// Endpoint to receive analytics
app.post('/analytics', authenticate, (req, res) => {
  const { userId, events, summary } = req.body;
  
  // Save to database
  analyticsCollection.insertOne({
    userId,
    events,
    summary,
    timestamp: new Date(),
  });
  
  res.json({ success: true });
});

// Endpoint for user profile
app.put('/users/:id', authenticate, (req, res) => {
  const updatedUser = {
    ...req.body,
    updatedAt: new Date(),
  };
  
  usersCollection.updateOne(
    { _id: req.params.id },
    { $set: updatedUser }
  );
  
  res.json(updatedUser);
});

// Search users
app.get('/users/search', (req, res) => {
  const { q } = req.query;
  
  const results = usersCollection.find({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
  });
  
  res.json(results);
});
```

---

## ✅ Verify Setup

Run these checks:

```typescript
// 1. Check backend connection
const connected = await backend.checkConnection();
console.log('Backend online:', connected); // Should be true

// 2. Check session info
const session = backend.getSessionInfo();
console.log('Session:', session);
// Should show { user_id, auth_token, base_url, queue_size }

// 3. Check sync status
const syncStatus = analyticsSync.getStatus();
console.log('Sync:', syncStatus);
// Should show { initialized: true, last_sync, sync_interval }

// 4. Force a sync
await analyticsSync.forceSyncNow();
// Should see console log: "[AnalyticsSync] Successfully synced to backend"
```

---

## 🔐 Security Tips

1. **Hash passwords** on backend, never send plaintext
2. **Use HTTPS** for all API calls
3. **Validate auth token** on every endpoint
4. **Rate limit** API endpoints
5. **Sanitize** user input
6. **Never expose** internal IDs in responses
7. **Log all** analytics changes

---

## 📱 Usage Examples

### Save User Profile

```typescript
import { backend } from '../services/backend';

// After user fills in profile form
await backend.saveUserProfile({
  username: 'john_doe',
  bio: 'Software Engineer',
  avatar: 'https://example.com/avatar.jpg',
  location: 'San Francisco',
});
```

### Get Another User

```typescript
// User tries to view friend's profile
const friendProfile = await backend.getUserProfile(friendId);
console.log(friendProfile.username);
console.log(friendProfile.bio);
console.log(friendProfile.isOnline);
```

### Search for Users

```typescript
// User searches for friends
const results = await backend.searchUsers('alice');
// Returns array of matching users with their profiles
```

### Update Status

```typescript
// User comes online
await backend.updateUserStatus('online');

// User closes app
await backend.updateUserStatus('offline');
```

---

## 🎯 What Syncs to Backend

Every 2 minutes, your backend receives:

```json
{
  "userId": "user_123",
  "sessionId": "session_xxx",
  "events": [...],
  "deviceInfo": {
    "device_name": "iPhone 14",
    "device_model": "A2846",
    "os": "ios",
    "app_version": "1.0.0"
  },
  "summary": {
    "total_sessions": 5,
    "total_app_time": 45000,
    "feature_engagement_rate": {...},
    "error_frequency": 2
  },
  "syncedAt": "2024-01-21T10:00:00Z"
}
```

---

## 🆘 Troubleshooting

### "Backend not initialized" error
→ Call `backend.initialize()` before using other methods

### Analytics not syncing
→ Check `analyticsSync.getStatus()` and backend logs

### User profile not saving
→ Verify user is authenticated: `backend.getSessionInfo().user_id`

### Queue growing too large
→ Check network connection and backend health

### Getting 401 Unauthorized
→ Token expired, need to re-authenticate: `backend.authenticate()`

---

## 📚 See Also

- [BACKEND_INTEGRATION_GUIDE.md](BACKEND_INTEGRATION_GUIDE.md) - Complete reference
- [ANALYTICS_SETUP_GUIDE.md](ANALYTICS_SETUP_GUIDE.md) - Local analytics docs
- [ANALYTICS_INDEX.md](ANALYTICS_INDEX.md) - Analytics navigation

---

Ready to connect your backend? Start with Step 1 above! 🚀
