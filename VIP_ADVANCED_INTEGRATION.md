# VIP Whitelist System - Complete Integration Guide

## Overview

The VIP whitelist system now includes four advanced features:
1. **AsyncStorage Persistence** - Whitelist data persists across app restarts
2. **Backend API Integration** - Whitelist synced with your backend database
3. **Audit Logging** - All admin actions tracked with timestamps and admin info
4. **Real-time WebSocket Broadcast** - Server reset alerts broadcast to all connected clients

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      App (app/index.tsx)                    │
│                                                               │
│  handleWhitelist() / confirmDevWhitelist() / etc.           │
│         ↓                                                    │
├─────────────────────────────────────────────────────────────┤
│                   Whitelist Service                          │
│                 (services/whitelist.ts)                      │
│                                                               │
│  • addDeveloperWhitelist()                                  │
│  • removeDeveloperWhitelist()                               │
│  • addStaffWhitelist()                                      │
│  • removeStaffWhitelist()                                   │
│  • logServerReset()                                         │
│  • logAuditAction()                                         │
│         ↓                                                    │
├──────────────────┬──────────────────┬──────────────────────┤
│ AsyncStorage     │ Backend Service  │ Realtime Service     │
│ (persistence)    │ (sync)           │ (broadcast)          │
│                  │                  │                      │
│ • DEV_WHITELIST  │ • POST /vip/*    │ • broadcast()        │
│ • STAFF_WHITELIST│ • GET /vip/*     │ • server-reset event │
│ • AUDIT_LOGS     │ • DELETE /vip/*  │                      │
└──────────────────┴──────────────────┴──────────────────────┘
```

## 1. AsyncStorage Persistence

### How It Works

When the app initializes, it loads whitelist data from device storage:

```typescript
// App startup
useEffect(() => {
  whitelistService.initializeFromStorage();
}, []);

// Whitelist data persists in:
// - vip:dev:whitelist (developer whitelist array)
// - vip:staff:whitelist (staff whitelist array)
// - vip:audit:logs (audit log entries)
```

### Implementation Details

**Storage Keys:**
```typescript
private readonly DEV_WHITELIST_KEY = 'vip:dev:whitelist';
private readonly STAFF_WHITELIST_KEY = 'vip:staff:whitelist';
private readonly AUDIT_LOGS_KEY = 'vip:audit:logs';
```

**Persistence Workflow:**
```
1. Admin grants whitelist via UI
   ↓
2. whitelistService.addDeveloperWhitelist() called
   ↓
3. User added to Set in memory
   ↓
4. saveDeveloperWhitelist() → AsyncStorage.setItem()
   ↓
5. Data persists on device
   ↓
6. App restart → initializeFromStorage() → data reloaded
```

**Example Usage:**
```typescript
// Whitelist persists across restarts
const whitelistService = WhitelistService.getInstance();

// Add whitelist (automatically saved)
await whitelistService.addDeveloperWhitelist(
  'user123',
  'admin456',
  'admin@app.com',
  'VIP access granted'
);

// App restarts...

// Whitelist still exists!
whitelistService.isDeveloperWhitelisted('user123'); // true
```

## 2. Backend API Integration

### Backend Endpoints Required

Your backend should implement these endpoints:

#### Sync Whitelist Data
```
POST /vip/whitelist/sync
{
  "devWhitelist": ["userId1", "userId2"],
  "staffWhitelist": ["userId3"],
  "timestamp": "2026-01-22T10:30:00.000Z"
}
Response: { "success": true }
```

#### Get Whitelist for Type
```
GET /vip/whitelist/developer
Response: { "userIds": ["userId1", "userId2"] }

GET /vip/whitelist/staff
Response: { "userIds": ["userId3"] }
```

#### Add User to Whitelist
```
POST /vip/whitelist/developer
{
  "userId": "user123",
  "adminId": "admin456",
  "timestamp": "2026-01-22T10:30:00.000Z"
}
Response: { "success": true }
```

#### Remove User from Whitelist
```
DELETE /vip/whitelist/developer/user123
Response: { "success": true }
```

#### Send Audit Log
```
POST /vip/audit/log
{
  "id": "audit_xxx",
  "adminId": "admin456",
  "adminEmail": "admin@app.com",
  "action": "whitelist_add",
  "targetUserId": "user123",
  "panelType": "developer",
  "timestamp": "2026-01-22T10:30:00.000Z",
  "status": "success"
}
Response: { "success": true }
```

#### Get Audit Logs
```
GET /vip/audit/logs?limit=100
Response: { "logs": [...] }
```

### Implementation in Your Backend

**Node.js/Express Example:**
```javascript
// routes/vip.js
router.post('/whitelist/sync', async (req, res) => {
  const { devWhitelist, staffWhitelist, timestamp } = req.body;
  
  // Store in database
  await WhitelistData.updateOne({}, {
    devWhitelist,
    staffWhitelist,
    lastUpdated: new Date(timestamp)
  }, { upsert: true });
  
  res.json({ success: true });
});

router.get('/whitelist/developer', async (req, res) => {
  const data = await WhitelistData.findOne();
  res.json({ userIds: data?.devWhitelist || [] });
});

router.post('/audit/log', async (req, res) => {
  const auditEntry = new AuditLog(req.body);
  await auditEntry.save();
  res.json({ success: true });
});
```

### Sync Throttling

The service automatically throttles syncs to prevent excessive backend calls:

```typescript
// Minimum 5 seconds between syncs
if (now - this.lastSyncTimestamp < 5000) {
  return; // Skip sync
}

this.lastSyncTimestamp = now;
// Proceed with sync
```

## 3. Audit Logging

### What Gets Logged

**Audit Log Entry Structure:**
```typescript
interface AuditLog {
  id: string;                    // Unique ID
  adminId: string;               // Admin who took action
  adminEmail: string;            // Admin email
  action: string;                // 'whitelist_add' | 'whitelist_remove' | 'server_reset'
  targetUserId?: string;         // User being whitelisted
  targetUserEmail?: string;      // Their email
  panelType?: string;            // 'developer' | 'staff'
  timestamp: Date;               // When it happened
  ipAddress?: string;            // Admin IP (optional)
  reason?: string;               // Why
  status: string;                // 'success' | 'failed'
  metadata?: Record<string, any>; // Extra info
}
```

### Logged Actions

**Developer Whitelist Added:**
```
{
  "action": "whitelist_add",
  "adminId": "admin123",
  "adminEmail": "admin@app.com",
  "targetUserId": "user456",
  "panelType": "developer",
  "timestamp": "2026-01-22T10:30:00.000Z",
  "reason": "Granted via developer panel",
  "status": "success"
}
```

**Developer Whitelist Removed:**
```
{
  "action": "whitelist_remove",
  "adminId": "admin123",
  "adminEmail": "admin@app.com",
  "targetUserId": "user456",
  "panelType": "developer",
  "timestamp": "2026-01-22T10:30:00.000Z",
  "status": "success"
}
```

**Server Reset:**
```
{
  "action": "server_reset",
  "adminId": "admin123",
  "adminEmail": "admin@app.com",
  "timestamp": "2026-01-22T10:30:00.000Z",
  "reason": "Emergency server update",
  "status": "success"
}
```

### Accessing Audit Logs

**In App:**
```typescript
// Get recent 50 audit logs
const logs = whitelistService.getAuditLogs(50);

// Get all audit logs
const allLogs = whitelistService.getAuditLogs();

// Logs stored locally up to 1000 entries
```

**From Backend:**
```javascript
// Get all audit logs
app.get('/admin/audit-logs', async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ timestamp: -1 })
    .limit(100);
  res.json({ logs });
});
```

### Audit Log Use Cases

1. **Compliance**: Track all admin changes for regulatory requirements
2. **Debugging**: Find who made what change and when
3. **Security**: Monitor for suspicious patterns
4. **Accountability**: Know who performed each action

## 4. Real-time WebSocket Broadcast

### How It Works

When admin triggers server reset:

```
Admin clicks "Server Reset" button
    ↓
whitelistService.logServerReset() called
    ↓
realtimeService.broadcast({ type: 'server-reset', payload: {...} })
    ↓
WebSocket sends message to all connected clients
    ↓
All users receive alert:
"Server is resetting for updates. Please close and reopen the app."
```

### Broadcasting Implementation

**In Whitelist Service:**
```typescript
private broadcastServerReset(adminId: string, adminEmail: string): void {
  if (realtimeService) {
    realtimeService.broadcast({
      type: 'server-reset',
      payload: {
        adminId,
        adminEmail,
        timestamp: new Date().toISOString(),
        message: 'Server is resetting for updates. Please close and reopen the app.',
      },
    });
  }
}
```

**In Realtime Service:**
```typescript
export const broadcast = (broadcastEvent: {
  type: string;
  payload: Record<string, any>;
}) => {
  const event = {
    type: 'broadcast',
    payload: {
      ...broadcastEvent,
      broadcastAt: new Date().toISOString(),
    },
  };

  sendEvent(event);
};
```

### Backend WebSocket Handling

**Node.js/Socket.io Example:**
```javascript
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('server-reset', (data) => {
    // Broadcast to all connected clients
    io.emit('server-reset', {
      type: 'server-reset',
      message: 'Server is resetting. Please close and reopen the app.',
      timestamp: new Date().toISOString()
    });
  });
});
```

### Server Reset Event Flow

```
Server receives admin request
    ↓
Validate admin credentials
    ↓
Broadcast via WebSocket:
{
  "type": "broadcast",
  "payload": {
    "type": "server-reset",
    "adminId": "admin123",
    "adminEmail": "admin@app.com",
    "message": "Server is resetting for updates...",
    "broadcastAt": "2026-01-22T10:30:00.000Z"
  }
}
    ↓
All connected clients receive
    ↓
App shows alert to user
    ↓
User closes/reopens app
    ↓
Gets latest version
```

## Integration Checklist

### Phase 1: AsyncStorage (✅ Complete)
- [x] Whitelist service created
- [x] AsyncStorage persistence implemented
- [x] Load on app startup
- [x] Save on each change

### Phase 2: Backend API Integration (⏳ In Progress)
- [ ] Create API endpoints in your backend
- [ ] Test whitelist sync endpoint
- [ ] Test audit log endpoint
- [ ] Set `EXPO_PUBLIC_BACKEND_URL` in env
- [ ] Verify backend connectivity

### Phase 3: Audit Logging (⏳ In Progress)
- [x] Audit log service integrated
- [ ] Display audit logs in admin panel
- [ ] Create audit log viewer UI
- [ ] Export audit logs feature
- [ ] Set audit log retention policy

### Phase 4: WebSocket Broadcast (⏳ In Progress)
- [x] Realtime broadcast support added
- [ ] Connect to WebSocket server
- [ ] Test server reset broadcast
- [ ] Add other broadcast events (optional)
- [ ] Monitor broadcast reliability

## Configuration

### Environment Variables

```bash
# Backend API
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000/api

# Realtime WebSocket
EXPO_PUBLIC_REALTIME_URL=ws://localhost:3000/ws

# Optional settings
VIP_SYNC_INTERVAL=5000  # ms between syncs
MAX_AUDIT_LOGS=1000     # local storage limit
```

### Initialize Services

```typescript
// app/index.tsx
useEffect(() => {
  // Initialize whitelist service (loads from storage)
  whitelistService.initializeFromStorage();
  
  // Connect to realtime for broadcasts
  realtimeService.connect();
  
  // Subscribe to whitelist changes
  const unsubscribe = whitelistService.subscribe((type) => {
    if (type === 'whitelist') {
      console.log('Whitelist updated');
      // Refresh UI
    } else if (type === 'audit') {
      console.log('Audit log recorded');
      // Refresh admin view
    }
  });
  
  return () => unsubscribe();
}, []);
```

## Testing Guide

### Test AsyncStorage Persistence

```
1. Open app
2. Grant whitelist to user A
3. Force close app
4. Reopen app
5. Verify: User A still whitelisted ✓
```

### Test Backend Sync

```
1. Ensure backend is running
2. Grant whitelist to user B
3. Check backend database
4. Verify: User B appears in dev_whitelist table ✓
5. Log contains timestamp and admin info ✓
```

### Test Audit Logging

```
1. Grant whitelist → check audit log
2. Remove whitelist → check audit log
3. Reset server → check audit log
4. Verify all logs have:
   - ID, timestamp, admin info ✓
   - Action type and target user ✓
   - Success status ✓
```

### Test WebSocket Broadcast

```
1. Open 2 instances of app
2. In instance 1: Click server reset
3. In instance 2: Check if alert appears
4. Verify: Alert says "Server resetting..." ✓
```

## Troubleshooting

### Issue: Whitelist lost after app restart
**Cause**: AsyncStorage not initialized
**Solution**: Check `whitelistService.initializeFromStorage()` is called in useEffect

### Issue: Backend sync failing
**Cause**: Backend URL not set or API endpoint missing
**Solution**: 
- Check `EXPO_PUBLIC_BACKEND_URL` is set
- Verify backend endpoints are implemented
- Check network connectivity in console logs

### Issue: Audit logs not saving
**Cause**: AsyncStorage quota exceeded
**Solution**: Logs trim to 1000 max entries, check device storage

### Issue: Server reset broadcast not reaching users
**Cause**: WebSocket not connected
**Solution**:
- Check `EXPO_PUBLIC_REALTIME_URL` is set
- Verify `realtimeService.connect()` is called
- Check browser console for connection errors

## Performance Considerations

**Storage Size:**
- ~100 user IDs: ~1KB
- 1000 audit logs: ~100KB
- Total: < 1MB typically

**Sync Frequency:**
- Throttled to 5 seconds minimum
- Only on whitelist changes (not continuous)
- ~1-2KB per sync request

**Memory Usage:**
- Sets for dev/staff whitelist: O(n)
- Audit logs array: max 1000 entries
- Typical: < 1MB RAM

## Security Recommendations

1. **HTTPS Only**: Ensure backend endpoints use HTTPS
2. **Auth Token**: Include in all API requests (handled automatically)
3. **Rate Limiting**: Limit whitelist changes per admin/hour
4. **Audit Retention**: Keep logs for compliance period
5. **Access Control**: Only admins can sync/audit endpoints

## Next Steps

1. Implement backend API endpoints (see specs above)
2. Test each integration point
3. Deploy to staging environment
4. Monitor audit logs in production
5. Consider UI for viewing audit logs
6. Set up automated audit log backups

---

**Status**: Integration Ready ✅
**Last Updated**: 2026-01-22
**Documentation**: Complete
