# 📊 Analytics Quick Reference Card

## 📍 One-Page Cheat Sheet

### Imports
```typescript
import { analytics } from '../services/analytics';
import { usageInsights } from '../services/usageInsights';
import { AnalyticsEvents, AnalyticsScreens } from '../services/analyticsEvents';
```

### Initialize (auto on app launch)
```typescript
await analytics.initialize();
```

### Log Events
```typescript
// Simple event
await analytics.logEvent('event_name');

// With metadata
await analytics.logEvent('event_name', { key: 'value', count: 123 });

// Predefined events
await analytics.logEvent(AnalyticsEvents.MESSAGE_SENT, { recipient: 'john' });
```

### Screen Tracking
```typescript
useEffect(() => {
  analytics.logScreenView({
    screen_name: AnalyticsScreens.MESSAGES,
    screen_class: 'MessagesScreen',
  });
}, []);
```

### Feature Usage
```typescript
// Quick log
await analytics.logFeatureUsage('video_call', { duration: 120 });

// Track locally
await usageInsights.recordEvent('feature_name', durationMs, metadata);
```

### Engagement Tracking
```typescript
const duration = Date.now() - startTime;
await analytics.logEngagement('action_name', duration);
```

### Error Handling
```typescript
try {
  await operation();
} catch (error) {
  await analytics.logError('ErrorName', error as Error, { context: 'data' });
}
```

### Performance Tracking
```typescript
await analytics.logPerformance({
  startup_time: 1500,
  feature_load_time: 800,
  api_call_duration: 500,
});
```

### Get Insights
```typescript
// Full summary
const summary = await usageInsights.getInsightsSummary();
// Properties: total_sessions, total_app_time, most_used_features,
//             daily_usage_pattern, feature_engagement_rate, error_frequency

// Specific feature
const stats = await usageInsights.getFeatureInsights('message_sent');
// Properties: usage_count, total_duration, average_duration, 
//             last_used, usage_frequency_per_day

// Daily breakdown
const daily = await usageInsights.getDailyBreakdown();
// Returns: { 'YYYY-MM-DD': eventCount, ... }
```

### Data Management
```typescript
// Flush buffer to storage
await usageInsights.flushBuffer();

// Export as JSON
const json = await usageInsights.exportInsights();

// Clear all data
await usageInsights.clearData();

// Get current session
const session = analytics.getSessionInfo?.();
```

## 🎯 Common Tasks

### Add Analytics Dashboard
```tsx
import AnalyticsDashboard from '../components/AnalyticsDashboard';

return <AnalyticsDashboard />;
```

### Track Message Send
```typescript
const duration = Date.now() - startTime;
await analytics.logEvent(AnalyticsEvents.MESSAGE_SENT, {
  recipient_id: userId,
  message_length: text.length,
  duration,
});
await usageInsights.recordEvent(AnalyticsEvents.MESSAGE_SENT, duration);
```

### Track Location Share
```typescript
await analytics.logEvent(AnalyticsEvents.LOCATION_SHARED, {
  accuracy: coords.accuracy,
  method: 'realtime', // or 'snapshot'
});
```

### Track Call
```typescript
await analytics.logEvent(AnalyticsEvents.CALL_INITIATED, {
  call_type: 'direct', // or 'conference'
  participants: 2,
});

// When ended
await analytics.logEvent(AnalyticsEvents.CALL_ENDED, {
  duration: callDurationMs,
  ended_by: 'user', // or 'other_party'
});
```

### Handle API Errors
```typescript
try {
  const data = await fetchData();
} catch (error) {
  await analytics.logError('APIError', error as Error, {
    endpoint: '/api/messages',
    method: 'GET',
    retry_attempt: 1,
  });
}
```

### Check Top Features
```typescript
const summary = await usageInsights.getInsightsSummary();
summary.most_used_features.forEach(f => {
  console.log(`${f.feature}: ${f.count} uses`);
});
```

## 📊 Dashboard Sections

| Section | Shows | Data |
|---------|-------|------|
| Overview | Key metrics | Sessions, time, errors |
| Top Features | Usage ranking | Feature name, count, duration |
| Engagement | % distribution | Feature, percentage |
| Daily Activity | Time series | Date, event count |
| Session | Current info | Start time, duration |

## 🔄 Event Categories

| Category | Events |
|----------|--------|
| **Auth** | LOGIN_*, LOGOUT, SIGNUP |
| **Messaging** | MESSAGE_SENT/RECEIVED/DELETED, SEARCH_MESSAGE |
| **Social** | FRIEND_ADDED/REMOVED, FRIEND_REQUEST_* |
| **Location** | LOCATION_SHARED/REQUEST, LOCATION_PERMISSION_* |
| **Calls** | CALL_*, CONFERENCE_CALL_* |
| **Media** | MUSIC_*, PHOTO_SHARED, VIDEO_SHARED |
| **Errors** | CRASH, RUNTIME_ERROR, NETWORK_ERROR |
| **Performance** | *_LOAD_TIME, *_DURATION |

## ⚙️ Configuration

```typescript
// In usageInsights.ts
private bufferSize = 50;              // Events before auto-flush
const weekAgo = Date.now() - 7*...    // Data retention (7 days)

// Enable/disable analytics
await Analytics.setAnalyticsCollectionEnabled(true/false);
```

## 🔍 Debugging

```typescript
// Check logs
[Analytics] Event: name { props }
[UsageInsights] Buffer flushed
[UsageInsights] Loaded N records

// Manual test
const summary = await usageInsights.getInsightsSummary();
console.log(summary); // View all data
```

## 📱 Screen Constants
```typescript
AnalyticsScreens.HOME
AnalyticsScreens.MESSAGES
AnalyticsScreens.FRIENDS
AnalyticsScreens.SETTINGS
AnalyticsScreens.PROFILE
AnalyticsScreens.NOTIFICATIONS
AnalyticsScreens.LOCATION
AnalyticsScreens.CALLS
AnalyticsScreens.SEARCH
AnalyticsScreens.DEVICE_CHECKER
```

## 🔐 Privacy Notes
- ✅ Local storage only
- ✅ No passwords/tokens
- ✅ User can export/clear
- ✅ 7-day auto-retention

---

**Full docs:** `ANALYTICS_QUICK_START.md` | `ANALYTICS_SETUP_GUIDE.md`
