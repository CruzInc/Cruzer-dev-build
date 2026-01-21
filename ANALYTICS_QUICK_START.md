# Analytics Quick Integration Guide

## 🚀 Quick Start

Your Expo project now has **production-ready analytics**! Here's how to use it:

## 📍 Where Things Are

```
services/
  ├── analytics.ts              # Main analytics service
  ├── analyticsEvents.ts        # Predefined events & constants
  └── usageInsights.ts          # Local usage data & insights

components/
  └── AnalyticsDashboard.tsx    # Visual analytics dashboard

app/
  └── _layout.tsx               # Already integrated!
```

## 🎯 3-Minute Setup

### 1. View the Dashboard
```typescript
// In any screen (e.g., settings.tsx)
import AnalyticsDashboard from '../components/AnalyticsDashboard';

export default function SettingsScreen() {
  return <AnalyticsDashboard />;
}
```

### 2. Log Custom Events
```typescript
import { analytics } from '../services/analytics';
import { AnalyticsEvents } from '../services/analyticsEvents';

// In your feature/screen
await analytics.logEvent(AnalyticsEvents.MESSAGE_SENT, {
  recipient_id: userId,
  message_length: text.length,
});
```

### 3. Track Feature Usage
```typescript
import { usageInsights } from '../services/usageInsights';

// Record feature use
await usageInsights.recordEvent('video_call', durationMs, {
  call_type: 'group',
  participants: 5,
});
```

## 📊 What Gets Tracked Automatically

✅ App launches & closes
✅ Screen views
✅ App foreground/background
✅ Errors & crashes
✅ Device info
✅ Session duration
✅ Feature usage (when you log events)

## 📈 View Your Data

### In Code
```typescript
// Get comprehensive summary
const summary = await usageInsights.getInsightsSummary();
console.log(summary.most_used_features);
console.log(summary.total_app_time);

// Export as JSON
const json = await usageInsights.exportInsights();
```

### In Dashboard
Just render `<AnalyticsDashboard />` to see:
- 📊 Overview stats
- ⭐ Top features
- 💪 Engagement rates
- 📅 Daily activity

## 🎓 Common Patterns

### Track Screen Views
```typescript
useEffect(() => {
  analytics.logScreenView({
    screen_name: 'Messages',
    screen_class: 'MessageListScreen',
  });
}, []);
```

### Track Errors
```typescript
try {
  await fetchMessages();
} catch (error) {
  await analytics.logError('FetchMessagesFailed', error as Error, {
    user_id: currentUser.id,
  });
}
```

### Track Performance
```typescript
const start = Date.now();
const result = await expensiveOperation();
await analytics.logPerformance({
  feature_load_time: Date.now() - start,
});
```

### Track Engagement
```typescript
const handleFeatureUse = (featureName: string) => {
  const startTime = Date.now();
  
  // ... feature logic ...
  
  const duration = Date.now() - startTime;
  usageInsights.recordEvent(featureName, duration);
};
```

## 🔍 All Available Events

```typescript
// Auth
LOGIN_ATTEMPT, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, SIGNUP

// Messages
MESSAGE_SENT, MESSAGE_RECEIVED, MESSAGE_DELETED, SEARCH_MESSAGE

// Friends
FRIEND_ADDED, FRIEND_REMOVED, FRIEND_REQUEST_SENT, FRIEND_REQUEST_ACCEPTED

// Location
LOCATION_SHARED, LOCATION_REQUEST, LOCATION_PERMISSION_GRANTED, 
LOCATION_PERMISSION_DENIED

// Calls
CALL_INITIATED, CALL_CONNECTED, CALL_ENDED, CALL_MISSED,
CONFERENCE_CALL_STARTED

// Media
MUSIC_PLAYED, MUSIC_PAUSED, PHOTO_SHARED, VIDEO_SHARED

// And many more...
// See AnalyticsEvents in services/analyticsEvents.ts
```

## 💾 Data Management

```typescript
// Get insights
const summary = await usageInsights.getInsightsSummary();

// Get specific feature stats
const stats = await usageInsights.getFeatureInsights('message_sent');

// Get daily breakdown
const daily = await usageInsights.getDailyBreakdown();

// Export all data
const json = await usageInsights.exportInsights();

// Clear all data
await usageInsights.clearData();
```

## ⚙️ Configuration

### Change Buffer Size
In `services/usageInsights.ts`:
```typescript
private bufferSize = 50; // Flush every N events
```

### Manual Flush
```typescript
await usageInsights.flushBuffer(); // Force save to storage
```

### Disable Analytics
```typescript
// In your app
import * as Analytics from 'expo-firebase-analytics';
await Analytics.setAnalyticsCollectionEnabled(false);
```

## 🔐 Privacy

- ✅ All data stored locally
- ✅ 7-day automatic retention
- ✅ Users can export or delete
- ✅ No sensitive data collected
- ✅ No tracking IDs unless you add them

## 📱 Mobile Integration

### Add to Settings Screen
```tsx
import AnalyticsDashboard from '../components/AnalyticsDashboard';

export default function SettingsScreen() {
  return (
    <ScrollView>
      {/* Other settings */}
      <View>
        <Text style={styles.sectionTitle}>Analytics</Text>
        <AnalyticsDashboard />
      </View>
    </ScrollView>
  );
}
```

### Add to Developer Menu
```tsx
const isDeveloper = __DEV__; // Only in development

if (isDeveloper) {
  return <AnalyticsDashboard />;
}
```

## 🧪 Testing Analytics

```typescript
// Log some test events
import { analytics } from '../services/analytics';
import { usageInsights } from '../services/usageInsights';

// Test event logging
await analytics.logEvent('test_event', { test: true });

// Test insights
const summary = await usageInsights.getInsightsSummary();
console.log('Test analytics:', summary);

// Check logs - should see [Analytics] and [UsageInsights] prefixes
```

## 📊 Sample Dashboard Output

```json
{
  "total_sessions": 5,
  "total_app_time": 45000,
  "most_used_features": [
    {
      "feature": "message_sent",
      "count": 23,
      "avg_duration": 1200
    },
    {
      "feature": "location_shared",
      "count": 8,
      "avg_duration": 5000
    }
  ],
  "feature_engagement_rate": {
    "message_sent": 65.3,
    "location_shared": 22.8
  },
  "error_frequency": 2,
  "daily_usage_pattern": {
    "2024-01-21": 15,
    "2024-01-20": 10
  }
}
```

## 🐛 Debugging

Check console for:
```
[Analytics] Initialized successfully
[Analytics] Event: feature_name { ... }
[UsageInsights] Buffer flushed successfully
[UsageInsights] Loaded N usage records
```

Errors start with:
```
[Analytics] Error: ...
[UsageInsights] Error: ...
```

## 🚀 Next Steps

1. ✅ Analytics is already running
2. 📊 Add dashboard to your app
3. 🎯 Start logging key events
4. 📈 Review insights after 1-2 days
5. 🔍 Use data to improve features

---

**Need more?** See `ANALYTICS_SETUP_GUIDE.md` for complete documentation.
