# Backend Integration & Data Persistence Guide

## 🔄 Why Data Wasn't Syncing

Your original analytics system was **local-only by design** (privacy-first). Now it includes:

✅ **Backend persistence** - User profiles & analytics saved to servers
✅ **Cross-user visibility** - See other users in your network
✅ **Developer insights** - Access analytics from your backend
✅ **Automatic sync** - Data syncs every 2 minutes (configurable)
✅ **Queue management** - Retry failed syncs automatically

---

## 📁 What Was Added

### New Services

1. **`services/backend.ts`** - Backend API communication
   - User authentication (login/register)
   - User profile management (save/get/search)
   - Analytics syncing
   - Status updates (online/offline)
   - Automatic sync queue

2. **`services/analyticsSync.ts`** - Analytics-to-backend bridge
   - Automatic periodic syncing
   - Event formatting
   - Device info collection
   - Sync status tracking

---

## 🚀 Setup (3 Steps)

### Step 1: Initialize Backend Service

```typescript
import { backend } from '../services/backend';

// In your app startup (_layout.tsx or root screen)
async function initializeApp() {
  // Replace with your actual backend URL
  await backend.initialize(
    'https://your-api-server.com', // Backend base URL
    'your_initial_auth_token_if_available'
  );

  // Test connection
  const connected = await backend.checkConnection();
  console.log('Backend connected:', connected);
}
```

### Step 2: Register/Authenticate User

```typescript
import { backend } from '../services/backend';

// Register new user
const newUser = await backend.register({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'secure_password', // Your backend should hash this!
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Hello, I am John!',
});

if (newUser) {
  console.log('User registered:', newUser.id);
  backend.setCurrentUser(newUser.id);
}

// OR login existing user
const user = await backend.authenticate('john@example.com', 'password');
if (user) {
  console.log('Logged in:', user.id);
  backend.setCurrentUser(user.id);
}
```

### Step 3: Enable Analytics Sync

```typescript
import { analyticsSync } from '../services/analyticsSync';

// Initialize sync service
await analyticsSync.initialize({
  syncInterval: 120000, // Sync every 2 minutes
  batchSize: 50,
  includeDeviceInfo: true,
});

// Analytics will now automatically sync to backend!
```

---

## 💾 User Profile Management

### Save User Profile

```typescript
import { backend } from '../services/backend';

// Update user profile (saved to backend)
await backend.saveUserProfile({
  username: 'new_username',
  bio: 'Updated bio',
  avatar: 'new_avatar_url',
  location: 'New York, NY',
  phone: '+1234567890',
});
```

### Get User Profile

```typescript
// Get any user's profile
const userProfile = await backend.getUserProfile('user_id_here');
console.log(userProfile);

// Profile is cached locally, so it works offline too
```

### Search Users

```typescript
// Find users to add as friends
const users = await backend.searchUsers('john');
console.log('Found users:', users);

// Get all users (with optional filters)
const allUsers = await backend.getAllUsers({
  limit: 20,
  skip: 0,
});
```

---

## 📊 Analytics Sync

### Automatic Sync

Analytics automatically sync every 2 minutes with:
- Total sessions
- Total app time
- Feature usage
- Engagement rates
- Error frequency
- Device information

### Force Immediate Sync

```typescript
import { analyticsSync } from '../services/analyticsSync';

// Manually trigger sync
await analyticsSync.forceSyncNow();
```

### Check Sync Status

```typescript
const status = analyticsSync.getStatus();
console.log('Last sync:', status.last_sync);
console.log('Backend status:', status.backend_status);
```

---

## 🔄 Data Flow

```
Local Analytics Collection (automatic)
        ↓
Analytics in Memory Buffer
        ↓
Stored in Local Storage (AsyncStorage)
        ↓
Sync Service Aggregates Data (every 2 min)
        ↓
Sends to Backend API
        ↓
Backend Stores & Persists
        ↓
Available to Developers & Other Users
```

---

## 📱 User Status & Presence

### Update User Status

```typescript
import { backend } from '../services/backend';

// Tell backend user is online
await backend.updateUserStatus('online');

// User goes to background
await backend.updateUserStatus('away');

// User logs out
await backend.updateUserStatus('offline');
```

### Automatic Status Updates

Add to your app lifecycle:

```typescript
import { AppState } from 'react-native';
import { backend } from '../services/backend';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      backend.updateUserStatus('online');
    } else if (state === 'background') {
      backend.updateUserStatus('away');
    }
  });

  return () => subscription.remove();
}, []);
```

---

## 🔐 Authentication

### Register New User

```typescript
const user = await backend.register({
  username: 'jane_doe',
  email: 'jane@example.com',
  password: 'secure_password',
  // Optional fields
  avatar: 'avatar_url',
  bio: 'My bio',
  location: 'San Francisco',
});

if (user) {
  console.log('Registered! User ID:', user.id);
}
```

### Login Existing User

```typescript
const user = await backend.authenticate('email@example.com', 'password');

if (user) {
  backend.setCurrentUser(user.id);
  console.log('Logged in!');
} else {
  console.log('Login failed');
}
```

### Logout

```typescript
await backend.logout();
// Clears auth token and user ID
```

---

## 🔄 Offline-First & Queue Management

### Automatic Retry Queue

When the backend is unreachable:

1. Operations are queued locally
2. Automatically retried every 60 seconds
3. Max 100 items in queue
4. Processed in batches of 10

### Check Queue Status

```typescript
const status = backend.getSyncQueueStatus();
console.log('Queued items:', status.queue_size);
console.log('Is syncing:', status.is_syncing);
console.log('Pending:', status.pending_items);
```

---

## 🌐 Backend API Requirements

Your backend should implement these endpoints:

### Authentication
```
POST   /auth/register       - Register new user
POST   /auth/login          - Login user
```

### Users
```
GET    /users/:id           - Get user profile
PUT    /users/:id           - Update user profile
GET    /users               - List all users
GET    /users/search        - Search users
POST   /users/:id/status    - Update user status
```

### Analytics
```
POST   /analytics           - Receive analytics data
GET    /analytics/:userId   - Get user analytics (optional)
```

### Health
```
GET    /health              - Check if service is running
```

---

## 📊 Example Backend Response Format

### Get User Profile Response
```json
{
  "id": "user_123",
  "username": "john_doe",
  "email": "john@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Hello, I am John!",
  "phone": "+1234567890",
  "location": "New York, NY",
  "isOnline": true,
  "lastSeen": 1705856400000,
  "createdAt": 1705770000000,
  "updatedAt": 1705856400000
}
```

### Analytics Sync Payload
```json
{
  "userId": "user_123",
  "sessionId": "session_xxx",
  "events": [
    {
      "event": "feature_usage_message_sent",
      "timestamp": 1705856400000,
      "duration": 1200,
      "metadata": {
        "count": 23
      }
    }
  ],
  "deviceInfo": {
    "device_name": "iPhone 14",
    "device_brand": "Apple",
    "os": "ios",
    "app_version": "1.0.0"
  },
  "summary": {
    "total_sessions": 5,
    "total_app_time": 45000,
    "feature_engagement_rate": {
      "message_sent": 65.3
    },
    "error_frequency": 2
  },
  "syncedAt": "2024-01-21T10:00:00.000Z"
}
```

---

## 🛠️ Configuration Examples

### Using Firebase Realtime Database

```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_KEY,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT,
  // ... other config
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Initialize backend with Firebase endpoint
await backend.initialize('https://your-firebase-project.firebaseio.com');
```

### Using Supabase

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_KEY
);

// Initialize with Supabase API
await backend.initialize(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabase.auth.session?.access_token
);
```

### Using Custom Node.js/Express Server

```typescript
// Backend server running at https://api.myapp.com
await backend.initialize('https://api.myapp.com');

// Then authenticate
const user = await backend.authenticate('user@example.com', 'password');
```

---

## 📋 Complete Integration Example

```typescript
import { backend } from '../services/backend';
import { analyticsSync } from '../services/analyticsSync';
import { analytics } from '../services/analytics';

async function setupBackendIntegration() {
  try {
    // 1. Initialize backend connection
    await backend.initialize('https://your-api.com');

    // 2. Check if user is logged in
    const userId = await AsyncStorage.getItem('user_id');
    
    if (!userId) {
      // 3a. Register or login
      const user = await backend.authenticate(
        'user@example.com',
        'password'
      );
      
      if (user) {
        backend.setCurrentUser(user.id);
      }
    } else {
      // 3b. User already logged in
      backend.setCurrentUser(userId);
    }

    // 4. Initialize analytics sync
    await analyticsSync.initialize({
      syncInterval: 120000, // Every 2 minutes
      includeDeviceInfo: true,
    });

    // 5. Set user online
    await backend.updateUserStatus('online');

    console.log('✅ Backend integration complete!');
  } catch (error) {
    console.error('❌ Backend setup error:', error);
  }
}

// Call during app startup
useEffect(() => {
  setupBackendIntegration();
}, []);
```

---

## 🔍 Debugging

### Check Backend Status

```typescript
const sessionInfo = backend.getSessionInfo();
console.log('Backend Status:', {
  authenticated: !!sessionInfo.auth_token,
  user: sessionInfo.user_id,
  queue: sessionInfo.queue_size,
  url: sessionInfo.base_url,
});
```

### Monitor Sync

```typescript
const syncStatus = analyticsSync.getStatus();
console.log('Sync Status:', {
  initialized: syncStatus.initialized,
  lastSync: syncStatus.last_sync,
  interval: syncStatus.sync_interval,
});
```

### Check Network

```typescript
const connected = await backend.checkConnection();
console.log('Backend online:', connected);
```

---

## ✅ Checklist

- [ ] Backend server set up with required endpoints
- [ ] Backend URL configured in environment
- [ ] `backend.initialize()` called in app startup
- [ ] User authentication implemented
- [ ] `analyticsSync.initialize()` enabled
- [ ] User status tracking set up
- [ ] Offline queue tested
- [ ] Sync status monitored

---

## 🚀 Next Steps

1. **Set up backend server** with required endpoints
2. **Configure backend URL** in your app
3. **Test authentication** flow
4. **Verify data syncing** in real-time
5. **Monitor analytics** from your dashboard
6. **Add friend search** using `getAllUsers()`
7. **Implement presence** with status tracking

Now your app has **full backend persistence and cross-user visibility!** 🎉
