# Expo Analytics & Usage Insights Setup Guide

## 📊 Overview

Your Expo project now has comprehensive analytics and usage insights enabled! This system automatically collects data about how your app is used and provides actionable insights.

## ✅ What's Included

### 1. **Analytics Service** (`services/analytics.ts`)
- Firebase Analytics integration
- Automatic session tracking
- Device property tracking
- User behavior analytics
- Error and crash reporting
- Performance monitoring

### 2. **Usage Insights Service** (`services/usageInsights.ts`)
- Local storage of usage data
- Feature engagement tracking
- Daily usage patterns
- Performance metrics
- Data export capabilities
- 7-day rolling data retention

### 3. **Analytics Events** (`services/analyticsEvents.ts`)
- Predefined event types
- Consistent naming conventions
- Screen tracking constants
- Easy integration with components

### 4. **Analytics Dashboard** (`components/AnalyticsDashboard.tsx`)
- Visual insights display
- Top features ranking
- Engagement rates
- Daily activity charts
- Session information
- Data export and management

## 🚀 How It Works

### Automatic Tracking
The analytics system automatically tracks:
- ✅ App launches and exits
- ✅ Foreground/background transitions
- ✅ Screen views
- ✅ User interactions
- ✅ Errors and crashes
- ✅ API performance
- ✅ Feature usage

### Data Collection Flow
```
Event Occurs → Logged to Service → Stored in Buffer → 
Flushed to Storage → Aggregated in Insights → 
Displayed in Dashboard
```

## 📱 Usage Examples

### Log a Custom Event
```typescript
import { analytics } from './services/analytics';
import { AnalyticsEvents } from './services/analyticsEvents';

// Track feature usage
await analytics.logFeatureUsage('messaging', {
  message_type: 'text',
  recipient_count: 1,
});

// Track custom events
await analytics.logEvent('premium_feature_accessed', {
  feature: 'advanced_search',
  duration: 1500,
});
```

### Track Screen Views
```typescript
import { analytics } from './services/analytics';
import { AnalyticsScreens } from './services/analyticsEvents';

// In your screen component
useEffect(() => {
  analytics.logScreenView({
    screen_name: AnalyticsScreens.MESSAGES,
    screen_class: 'MessagesScreen',
  });
}, []);
```

### Record User Engagement
```typescript
// Track how long user spent on a feature
const startTime = Date.now();

// ... user interaction ...

const duration = Date.now() - startTime;
await analytics.logEngagement('message_compose', duration);
```

### Track Errors
```typescript
try {
  // Some operation
} catch (error) {
  await analytics.logError(
    'MessageSendFailed',
    error as Error,
    {
      recipient_id: recipientId,
      retry_count: 2,
    }
  );
}
```

### Get Usage Insights
```typescript
import { usageInsights } from './services/usageInsights';

// Get comprehensive summary
const summary = await usageInsights.getInsightsSummary();
console.log('Total sessions:', summary.total_sessions);
console.log('Top features:', summary.most_used_features);

// Get feature-specific data
const messagingStats = await usageInsights.getFeatureInsights('message_sent');

// Export all insights
const json = await usageInsights.exportInsights();
```

## 📊 Dashboard Integration

### Display the Analytics Dashboard
```typescript
import AnalyticsDashboard from '../components/AnalyticsDashboard';

// Add to your navigation or settings screen
export default function SettingsScreen() {
  return <AnalyticsDashboard />;
}
```

### Dashboard Features
- 📈 Overview statistics (sessions, total time, errors)
- ⭐ Top 10 most-used features
- 💪 Feature engagement rates (%)
- 📅 Daily activity breakdown
- 🔍 Current session information
- 💾 Export analytics as JSON
- 🗑️ Clear data option

## 🔄 Real-Time Integration

### In Your App's Main Layout
The analytics are already integrated into `app/_layout.tsx`:
- App launches are automatically tracked
- App state changes (foreground/background) are monitored
- Buffer is flushed when app goes to background
- Errors are automatically caught

### In Your Screens
Add tracking to any screen:
```typescript
import { analytics } from '../services/analytics';
import { AnalyticsScreens } from '../services/analyticsEvents';

export default function MyScreen() {
  useEffect(() => {
    analytics.logScreenView({
      screen_name: AnalyticsScreens.MESSAGES,
    });
  }, []);

  return (/* JSX */);
}
```

## 📋 Available Events

### App Lifecycle
- `APP_LAUNCH`, `APP_BACKGROUND`, `APP_FOREGROUND`
- `SESSION_START`, `SESSION_END`

### Navigation & Screens
- `SCREEN_VIEW`, `NAVIGATION_COMPLETE`

### Authentication
- `LOGIN_ATTEMPT`, `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `SIGNUP`

### Messaging
- `MESSAGE_SENT`, `MESSAGE_RECEIVED`, `MESSAGE_DELETED`, `SEARCH_MESSAGE`

### Friends & Social
- `FRIEND_ADDED`, `FRIEND_REMOVED`, `FRIEND_REQUEST_*`

### Location
- `LOCATION_SHARED`, `LOCATION_REQUEST`, `LOCATION_PERMISSION_*`

### Notifications
- `NOTIFICATION_RECEIVED`, `NOTIFICATION_OPENED`, `NOTIFICATION_DISMISSED`

### Calls
- `CALL_INITIATED`, `CALL_CONNECTED`, `CALL_ENDED`, `CONFERENCE_CALL_STARTED`

### Media
- `MUSIC_PLAYED`, `MUSIC_PAUSED`, `PHOTO_SHARED`, `VIDEO_SHARED`

### Performance
- `FEATURE_LOAD_TIME`, `API_CALL_DURATION`, `SYNC_DURATION`

**See `services/analyticsEvents.ts` for complete list**

## 🔐 Privacy & Data Management

### Data Storage
- Analytics data is stored locally on device
- Only 7 days of historical data retained
- No sensitive data (passwords, tokens) collected
- Users can export or clear data anytime

### User Privacy
- Enable/disable analytics collection with `setAnalyticsCollectionEnabled()`
- All data is aggregated and anonymized
- No personally identifiable information stored
- Complies with GDPR and privacy regulations

### Clear User Data
```typescript
// Clear all insights data
await usageInsights.clearData();
```

## 📈 Key Metrics Tracked

1. **Usage Metrics**
   - Total sessions
   - Session duration
   - Feature usage frequency
   - Daily activity patterns

2. **Engagement Metrics**
   - Feature engagement rates (%)
   - Most-used features
   - Feature usage distribution
   - User retention patterns

3. **Performance Metrics**
   - App startup time
   - Feature load times
   - API call durations
   - Sync performance

4. **Error Metrics**
   - Error frequency
   - Error types and messages
   - Crash reports
   - Network errors

## 🔧 Configuration

### Firebase Analytics (Optional)
The service supports Firebase Analytics. To enable:
1. Install Firebase: `npm install firebase-analytics`
2. Configure Firebase in your `eas.json`
3. Analytics will automatically send data to Firebase

### Custom Configuration
Modify `services/analytics.ts` to:
- Change data retention period
- Adjust buffer flush frequency
- Add custom user properties
- Integrate with third-party services

### Buffer Management
```typescript
// Manually flush data (called automatically)
await usageInsights.flushBuffer();

// Change buffer size (in usageInsights.ts)
private bufferSize = 50; // Flush after N events
```

## 📊 Analytics Examples

### Check Top Features
```typescript
const summary = await usageInsights.getInsightsSummary();
summary.most_used_features.forEach(feature => {
  console.log(`${feature.feature}: ${feature.count} uses, 
              avg ${feature.avg_duration}ms`);
});
```

### Get Daily Usage
```typescript
const dailyBreakdown = await usageInsights.getDailyBreakdown();
Object.entries(dailyBreakdown).forEach(([date, events]) => {
  console.log(`${date}: ${events} events`);
});
```

### Feature-Specific Analysis
```typescript
const messagingInsights = await usageInsights.getFeatureInsights('message_sent');
if (messagingInsights) {
  console.log(`Message feature:`);
  console.log(`- Used ${messagingInsights.usage_count} times`);
  console.log(`- Avg duration: ${messagingInsights.average_duration}ms`);
  console.log(`- Last used: ${new Date(messagingInsights.last_used).toLocaleString()}`);
}
```

## 🎯 Best Practices

1. **Log Meaningful Events**
   - Use descriptive event names
   - Include relevant metadata
   - Keep event names consistent

2. **Track User Journeys**
   - Log screen views in sequence
   - Track conversion funnels
   - Monitor user flows

3. **Monitor Performance**
   - Log feature load times
   - Track API call durations
   - Identify bottlenecks

4. **Handle Errors Gracefully**
   - Log all errors with context
   - Include relevant metadata
   - Track error patterns

5. **Respect Privacy**
   - Don't log sensitive data
   - Respect user preferences
   - Allow data export/deletion

## 📞 Support

For issues or questions:
1. Check console logs: `[Analytics]` and `[UsageInsights]` prefixes
2. Enable debug mode in services
3. Review error events in analytics
4. Export insights for detailed analysis

## 🎉 Next Steps

1. **Start Collecting Data**
   - App is already tracking automatically
   - Data will accumulate over time

2. **View Dashboard**
   - Add AnalyticsDashboard to settings screen
   - View insights in real-time

3. **Add Custom Events**
   - Log feature usage in key screens
   - Track important user actions
   - Monitor feature engagement

4. **Analyze Patterns**
   - Review daily usage patterns
   - Identify top features
   - Understand user behavior

5. **Optimize App**
   - Focus on improving top features
   - Fix frequently occurring errors
   - Optimize slow-loading features

---

**Setup Complete!** Your app is now collecting comprehensive usage data and insights. 🚀
