# VIP Whitelist System - Testing & Debugging Guide

## Quick Reference

### Enable Debug Logging

Add to app/index.tsx at the top:
```typescript
// Enable detailed whitelist logging
if (__DEV__) {
  require('./services/whitelist').enableDebugLogging = true;
}
```

### Console Log Levels

- **[Whitelist]**: Service operations
- **[Whitelist] ERROR**: Failed operations
- **[Realtime]**: WebSocket events
- **[Backend]**: API calls

---

## Test Scenarios

### Scenario 1: Basic Whitelist Persistence

**Objective**: Verify whitelist saves and loads from device storage

**Steps**:
1. Open developer panel
2. Enter user ID: `test_user_001`
3. Click "Add Developer"
4. Verify user appears in list
5. Check console for: `[Whitelist] Developer whitelist saved`
6. Force close the app (swipe up on iOS, back button on Android)
7. Reopen the app
8. Open developer panel again
9. **Expected**: User still appears in list

**Debug Output**:
```
[Whitelist] Initializing from storage...
[Whitelist] Loaded dev whitelist: ["test_user_001"]
[Whitelist] Loaded staff whitelist: []
[Whitelist] Loaded 0 audit logs
[Whitelist] Development whitelist updated
```

**If it fails**:
- Check device storage not full: Settings > Storage
- Check AsyncStorage is imported correctly
- Review logs for `[Whitelist] ERROR` messages

---

### Scenario 2: Backend Sync

**Objective**: Verify whitelist syncs to backend

**Setup**:
- Backend server running on `http://localhost:3000`
- Endpoint: `POST /api/vip/whitelist/sync`

**Steps**:
1. Open app developer panel
2. Add user: `sync_test_001`
3. Check backend logs for sync request
4. Query database: should see new entry
5. Check console for: `[Whitelist] Backend sync completed`

**Debug Output (Expected)**:
```
[Whitelist] Development whitelist updated
[Whitelist] Syncing to backend...
[Whitelist] Requesting POST /api/vip/whitelist/sync
[Whitelist] Backend sync completed
[Backend] POST /api/vip/whitelist/sync - 200 OK
```

**Verify Backend**:
```javascript
// Check if entry was saved
db.collection('whitelists').findOne({})
// Should see: { devWhitelist: ['sync_test_001'], ... }
```

**If it fails**:
- Check `EXPO_PUBLIC_BACKEND_URL` is set
- Verify backend `/api/vip/whitelist/sync` endpoint exists
- Check CORS headers are correct
- Look for `[Whitelist] ERROR` in console

---

### Scenario 3: Audit Logging

**Objective**: Verify all operations are logged

**Steps**:
1. Open developer panel
2. Add user: `audit_test_001` (note this action)
3. Remove user: `audit_test_001` (note this action)
4. Open browser DevTools console
5. Run: `whitelistService.getAuditLogs()` (prints to console)
6. **Expected**: Should see 2 entries:
   - `whitelist_add` with targetUserId: audit_test_001
   - `whitelist_remove` with targetUserId: audit_test_001

**Debug Output**:
```typescript
// In console, run:
console.log(whitelistService.getAuditLogs());

// Output:
[
  {
    id: "audit_1234567890",
    action: "whitelist_add",
    targetUserId: "audit_test_001",
    panelType: "developer",
    adminId: "current_user_id",
    adminEmail: "current@user.email",
    timestamp: "2026-01-22T10:30:00.000Z",
    status: "success"
  },
  {
    id: "audit_1234567891",
    action: "whitelist_remove",
    targetUserId: "audit_test_001",
    panelType: "developer",
    adminId: "current_user_id",
    adminEmail: "current@user.email",
    timestamp: "2026-01-22T10:31:00.000Z",
    status: "success"
  }
]
```

**If it fails**:
- Check admin is logged in (currentUser != null)
- Verify timestamp is valid format
- Check AsyncStorage has space

---

### Scenario 4: Server Reset Broadcast

**Objective**: Verify server reset reaches all clients via WebSocket

**Setup**:
- Open app on 2 devices/emulators
- Both connected to same backend
- WebSocket server running

**Steps**:
1. On Device 1: Open developer panel
2. Device 1: Click "Server Reset"
3. Check console: `[Whitelist] Server reset broadcast initiated`
4. On Device 2: Watch for alert popup
5. **Expected**: Device 2 shows alert: "Server is resetting for updates..."

**Debug Output**:
```
[Device 1 Console]:
[Whitelist] Server reset broadcast initiated
[Realtime] Broadcast event sent: server-reset

[Device 2 Console]:
[Realtime] Broadcast received: server-reset
[Realtime] Message: Server is resetting for updates...
```

**Alert Flow**:
```
Device 1 clicks reset
  ↓
[Whitelist] whitelistService.logServerReset()
  ↓
[Whitelist] realtimeService.broadcast()
  ↓
WebSocket sends to all clients
  ↓
Device 2 receives in realtimeService listener
  ↓
Device 2 shows Alert.alert()
```

**If it fails**:
- Check WebSocket connection: `realtimeService.isConnected`
- Verify `realtimeService.broadcast()` is being called
- Check browser console for WebSocket errors
- Verify backend is broadcasting to all clients

---

## Common Issues & Solutions

### Issue 1: "Cannot read property 'addDeveloperWhitelist' of undefined"

**Problem**: whitelistService is not imported

**Solution**:
```typescript
// Add this import at top of app/index.tsx
import { whitelistService } from '../services/whitelist';
```

---

### Issue 2: Whitelist clears on app restart

**Problem**: AsyncStorage not being used

**Check**:
```typescript
// In app/index.tsx, check this exists:
useEffect(() => {
  whitelistService.initializeFromStorage();
}, []);
```

**Solution**: Add the useEffect above if missing

---

### Issue 3: Backend sync not happening

**Problem**: Could be several causes

**Debugging**:
```typescript
// Add to browser console:
// 1. Check if service exists
console.log(whitelistService);

// 2. Check if backend URL is set
console.log(process.env.EXPO_PUBLIC_BACKEND_URL);

// 3. Check last sync time
console.log(whitelistService.lastSyncTimestamp);

// 4. Manually trigger sync
await whitelistService.syncWithBackend();
```

**Solutions**:
- [ ] Set `EXPO_PUBLIC_BACKEND_URL` in `.env`
- [ ] Verify backend is running on that URL
- [ ] Check backend has `/api/vip/whitelist/sync` endpoint
- [ ] Check network requests in DevTools (Network tab)

---

### Issue 4: Audit logs not saving

**Problem**: AsyncStorage quota exceeded or error

**Check**:
```typescript
// In console:
await whitelistService.getAuditLogs();

// Should print array, not error
```

**Solutions**:
- [ ] Check device storage: Settings > Storage & cache
- [ ] Clear app cache: Settings > Apps > [App Name] > Clear Cache
- [ ] Check AsyncStorage is working:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('test', 'value');
```

---

### Issue 5: Server reset broadcast not reaching second device

**Problem**: WebSocket not connected or not broadcasting

**Check**:
```typescript
// On both devices:
console.log(realtimeService.isConnected);

// Should return: true
```

**Debug broadcast**:
```typescript
// Manually broadcast a test message:
realtimeService.broadcast({
  type: 'test-message',
  payload: { message: 'Hello from Device 1' }
});

// On Device 2, check console for broadcast received
```

**Solutions**:
- [ ] Verify WebSocket URL is correct
- [ ] Check backend is forwarding broadcasts
- [ ] Verify both devices are connecting to same WebSocket server
- [ ] Check firewall isn't blocking WebSocket

---

## Integration Test Checklist

Run these in order to verify everything works:

### ✓ Test 1: Imports
```javascript
// Open console and run:
console.log(whitelistService); // Should not be undefined
console.log(realtimeService);  // Should not be undefined
```
**Expected**: Both print objects with methods

### ✓ Test 2: AsyncStorage
```javascript
// In console:
await whitelistService.addDeveloperWhitelist('test123', 'admin', 'a@b.com', 'test');
// Restart app
console.log(whitelistService.isDeveloperWhitelisted('test123')); // Should be true
```
**Expected**: Returns true after restart

### ✓ Test 3: Backend Connection
```javascript
// Ensure backend is running
// In console:
await whitelistService.syncWithBackend();
// Check backend logs for incoming request
```
**Expected**: Backend receives POST /vip/whitelist/sync

### ✓ Test 4: Audit Log
```javascript
// In console:
const logs = whitelistService.getAuditLogs();
console.log(logs.length > 0); // Should be true
```
**Expected**: Returns true (at least 1 audit entry)

### ✓ Test 5: Broadcast
```javascript
// On Device 1:
realtimeService.broadcast({ type: 'test', payload: { msg: 'hi' } });

// On Device 2, watch console for message
// Should see broadcast received
```
**Expected**: Device 2 receives broadcast

---

## Performance Debugging

### Check Storage Usage

```typescript
// In console:
const keys = await AsyncStorage.getAllKeys();
console.log('Stored keys:', keys);

// Check size of each:
for (let key of keys) {
  const item = await AsyncStorage.getItem(key);
  console.log(`${key}: ${item.length} bytes`);
}
```

### Check Sync Frequency

```typescript
// In console, add to whitelist service:
const originalSync = whitelistService.syncWithBackend;
whitelistService.syncWithBackend = async function() {
  console.log('Sync requested at', new Date().toISOString());
  return originalSync.call(this);
};

// Then add/remove whitelisted users and watch console
// Should see max 1 sync per 5 seconds
```

### Monitor Memory Usage

```javascript
// In console (React Native):
console.log(performance.memory);

// Look for:
// - usedJSHeapSize: Should stay relatively stable
// - jsHeapSizeLimit: Total available
```

---

## Network Debugging

### Monitor All API Calls

**In Expo:**
```javascript
// Add to app/index.tsx:
if (__DEV__) {
  const originalFetch = global.fetch;
  global.fetch = function(...args) {
    console.log('[API]', args[0]);
    return originalFetch.apply(this, args);
  };
}
```

### Check Backend Connectivity

```bash
# From your backend machine:
curl -X POST http://localhost:3000/api/vip/whitelist/sync \
  -H "Content-Type: application/json" \
  -d '{"devWhitelist":["test"],"staffWhitelist":[],"timestamp":"2026-01-22T10:30:00.000Z"}'

# Should get: { "success": true }
```

### WebSocket Connection Test

```javascript
// In console:
// Check if connected
realtimeService.isConnected; // true/false

// Check connection state
realtimeService.getConnectionState(); // may vary based on implementation

// Force reconnect if needed
realtimeService.reconnect();
```

---

## Backend Testing

### Test Whitelist Sync Endpoint

```bash
# Terminal:
curl -X POST http://localhost:3000/api/vip/whitelist/sync \
  -H "Content-Type: application/json" \
  -d '{
    "devWhitelist": ["user123", "user456"],
    "staffWhitelist": ["moderator789"],
    "timestamp": "2026-01-22T10:30:00.000Z"
  }'

# Expected response:
# { "success": true }
```

### Test Get Whitelist

```bash
curl http://localhost:3000/api/vip/whitelist/developer
# Expected: { "userIds": ["user123", "user456"] }

curl http://localhost:3000/api/vip/whitelist/staff
# Expected: { "userIds": ["moderator789"] }
```

### Test Audit Log

```bash
curl -X POST http://localhost:3000/api/vip/audit/log \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test123",
    "adminId": "admin456",
    "adminEmail": "admin@test.com",
    "action": "whitelist_add",
    "targetUserId": "user123",
    "timestamp": "2026-01-22T10:30:00.000Z",
    "status": "success"
  }'

# Expected: { "success": true }
```

---

## Success Criteria

### AsyncStorage ✓
- [ ] Whitelist persists after app restart
- [ ] Audit logs saved locally
- [ ] No errors in console about storage

### Backend Integration ✓
- [ ] Backend receives sync requests
- [ ] Data appears in database
- [ ] Timestamps are correct
- [ ] Multiple syncs don't create duplicates

### Audit Logging ✓
- [ ] All actions logged (add, remove, reset)
- [ ] Admin info captured correctly
- [ ] Logs persist locally
- [ ] Logs sent to backend

### WebSocket Broadcast ✓
- [ ] Server reset triggers broadcast
- [ ] All connected clients receive alert
- [ ] Broadcast happens immediately
- [ ] No errors in console

---

## Troubleshooting Flowchart

```
Problem: Whitelist not persisting
  ├─ Is AsyncStorage working?
  │  ├─ Test: await AsyncStorage.setItem('test', 'value')
  │  └─ If fails: Clear app data and retry
  └─ Is initializeFromStorage called?
     ├─ Add to useEffect in app/index.tsx
     └─ Restart app

Problem: Backend not receiving data
  ├─ Is EXPO_PUBLIC_BACKEND_URL set?
  │  └─ Check .env file
  ├─ Is backend running?
  │  └─ Test: curl http://localhost:3000
  └─ Does /api/vip/whitelist/sync exist?
     └─ Implement endpoint in backend

Problem: Broadcast not reaching users
  ├─ Is WebSocket connected?
  │  ├─ Check: realtimeService.isConnected
  │  └─ If false: Reconnect and retry
  ├─ Are both devices on same network?
  │  └─ Check: ping server from both
  └─ Is backend forwarding broadcasts?
     └─ Check server code for broadcast handler

Problem: Audit logs not saving
  ├─ Is device storage full?
  │  └─ Check: Settings > Storage
  ├─ Is current user logged in?
  │  └─ Check: currentUser != null
  └─ Is AsyncStorage working?
     └─ Test: getAuditLogs() returns array
```

---

## Getting Help

When opening an issue, include:

1. **Console logs** - Copy full output including `[Whitelist]` and `[Backend]` lines
2. **Steps to reproduce** - Exact steps that cause the problem
3. **Expected vs actual** - What should happen vs what actually happens
4. **Environment**:
   - Expo version: `expo --version`
   - React Native version: `npm list react-native`
   - Device: iOS/Android, emulator or physical
   - Backend URL being used

5. **Network requests** - Open DevTools, perform action, check Network tab, screenshot request/response

---

**Last Updated**: 2026-01-22
**Status**: Complete Testing Guide ✓
