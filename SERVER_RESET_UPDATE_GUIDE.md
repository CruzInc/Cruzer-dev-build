# Server Reset & Update System

## Overview
The Server Reset button in the Developer Panel now automatically checks for and applies new code updates before resetting the app for all users.

## How It Works

### Update Flow
1. **Developer triggers reset** → Clicks "🔄 Server Reset & Update" button
2. **System checks for updates** → Uses Expo Updates to check for new OTA updates
3. **Downloads update if available** → Fetches the latest code from your update server
4. **Applies update** → Installs the new code
5. **Reloads app** → All users get the new version
6. **Logs action** → Records the reset in audit logs

### Three Scenarios

#### Scenario 1: New Update Available ✅
```
1. Developer clicks "Server Reset & Update"
2. System checks Expo Updates server
3. New update found → Downloads it
4. Shows: "✅ Update Ready - New code update downloaded"
5. Developer clicks "Apply Update Now"
6. App reloads with new code for all users
7. Audit log: "Server reset with code update applied"
```

#### Scenario 2: No Updates Available ℹ️
```
1. Developer clicks "Server Reset & Update"
2. System checks Expo Updates server
3. No new updates found
4. Shows: "🔄 Server Reset Initiated - No updates available"
5. App closes for all users (must manually reopen)
6. Audit log: "Server reset - No updates available"
```

#### Scenario 3: Development Mode 🔧
```
1. Developer clicks "Server Reset & Update"
2. Detects running in Expo Go / development mode
3. Shows: "Development Mode - Updates only in production"
4. Proceeds with standard reset
5. Audit log: "Server reset - Dev mode (no OTA updates)"
```

## Button Location
**Developer Panel** → Scroll to bottom → "🔄 Server Reset & Update"

## Features

### ✅ Automatic Update Detection
- Uses Expo Updates API
- Checks your configured update server
- Only available in production builds (not Expo Go)

### ✅ Smart Error Handling
- If update check fails, offers to proceed anyway
- Logs all actions for audit trail
- Shows clear error messages

### ✅ User-Friendly Alerts
```
Before: "This will close the app for all users"
Now:    "This will:
         • Check for new code updates
         • Apply updates to all users
         • Close the app for everyone"
```

### ✅ Audit Logging
All reset actions are logged with:
- Admin who triggered it
- Timestamp
- Reason (update applied, no updates, error, etc.)
- User ID and email

## Technical Details

### Expo Updates Integration
```typescript
// Check for updates
const update = await Updates.checkForUpdateAsync();

if (update.isAvailable) {
  // Download the update
  await Updates.fetchUpdateAsync();
  
  // Apply it
  await Updates.reloadAsync();
}
```

### Update Sources
Updates are fetched from:
- **Production**: Your Expo Updates server
- **EAS Update**: If using EAS Update service
- **Development**: Not available (Expo Go limitation)

## Publishing Updates

To make new updates available for the reset button to fetch:

### Using EAS Update
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Publish a new update
eas update --branch production --message "Bug fixes and improvements"
```

### Using Classic Expo Publish
```bash
# Publish to default channel
expo publish

# Or publish to specific channel
expo publish --release-channel production
```

### App Configuration
Ensure `app.json` has updates configured:
```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 0,
      "checkAutomatically": "ON_ERROR_RECOVERY",
      "url": "https://u.expo.dev/your-project-id"
    }
  }
}
```

## Testing

### Test in Development
1. Run app in Expo Go
2. Try Server Reset button
3. Should show "Development Mode" message
4. No actual updates fetched (Expo Go limitation)

### Test in Production
1. Build standalone app (`eas build`)
2. Install on device
3. Publish an update (`eas update`)
4. Use Server Reset button
5. Should detect and apply the update

### Verify Update Applied
```typescript
// Check current update info
const update = await Updates.checkForUpdateAsync();
console.log('Current update ID:', update.manifest?.id);
```

## Best Practices

### ✅ DO
- Test updates in staging before production
- Use descriptive update messages
- Reset during low-traffic times
- Verify update deployed successfully
- Monitor audit logs after reset

### ❌ DON'T
- Reset during peak hours
- Skip testing updates first
- Use for non-critical changes
- Reset without checking update status
- Ignore error messages

## Troubleshooting

### "Updates not available in development"
**Cause**: Running in Expo Go or development mode  
**Solution**: Build standalone app for production

### "Update check failed"
**Cause**: Network error or invalid update URL  
**Solution**: Check internet connection and `app.json` configuration

### "No updates available"
**Cause**: No new updates published  
**Solution**: Publish update with `eas update` or `expo publish`

### Update not applying
**Cause**: Update not compatible or corrupted  
**Solution**: Check update manifest and republish

## Security

### Admin Only
- Only accessible through Developer Panel
- Requires developer PIN (if configured)
- All actions logged with admin ID

### Audit Trail
Every reset is logged:
```typescript
{
  adminId: "user123",
  adminEmail: "admin@example.com",
  action: "server_reset",
  reason: "Server reset with code update applied",
  timestamp: "2026-01-23T...",
  status: "success"
}
```

## Update Workflow Example

```
┌─────────────────────────────────────┐
│  1. Developer writes new code       │
│     - Fix bugs                      │
│     - Add features                  │
│     - Update UI                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Publish update to server        │
│     $ eas update --branch prod      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Developer opens app             │
│     → Developer Panel               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Click "Server Reset & Update"   │
│     System checks for updates       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Update found and downloaded     │
│     "✅ Update Ready"                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. Click "Apply Update Now"        │
│     App reloads with new code       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  7. All users get new version       │
│     ✅ Updates applied successfully  │
└─────────────────────────────────────┘
```

## Notes

- **OTA Updates**: Works with Over-The-Air updates (JavaScript/assets only)
- **Native Changes**: Requires new build for native code changes
- **Cache**: Users may need to force-quit for immediate effect
- **Rollback**: No automatic rollback - test thoroughly first

## Summary

The Server Reset button now provides a complete update deployment workflow:
1. ✅ Checks for new code automatically
2. ✅ Downloads and applies updates
3. ✅ Forces all users to reload
4. ✅ Logs everything for audit
5. ✅ Handles errors gracefully

This makes deploying updates as simple as clicking one button! 🚀
