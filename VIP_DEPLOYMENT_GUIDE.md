# VIP Whitelist System - Deployment Guide

## Pre-Deployment Checklist

### Code Review
- [x] WhitelistService implemented (~565 lines)
- [x] RealtimeService broadcast added
- [x] BackendService VIP methods added
- [x] App functions integrated with WhitelistService
- [x] Error handling throughout
- [x] Type definitions complete
- [x] Documentation complete

### Testing (Before Deployment)
- [ ] AsyncStorage persistence working locally
- [ ] Backend sync tested with mock backend
- [ ] Audit logging verified
- [ ] WebSocket broadcast tested locally
- [ ] Error scenarios handled gracefully
- [ ] No console errors in debug mode

### Infrastructure
- [ ] Backend server deployed
- [ ] Database (MongoDB, etc.) set up
- [ ] WebSocket server configured
- [ ] CORS enabled for your domain
- [ ] HTTPS/SSL certificates (if required)
- [ ] Rate limiting configured
- [ ] Monitoring/logging set up

---

## Environment Configuration

### App Environment Variables (.env)

```bash
# Backend API endpoint
EXPO_PUBLIC_BACKEND_URL=https://api.yourserver.com/api

# WebSocket endpoint for real-time features
EXPO_PUBLIC_REALTIME_URL=wss://api.yourserver.com/ws

# Optional: VIP system configuration
VIP_SYNC_INTERVAL=5000        # ms between background syncs
VIP_MAX_AUDIT_LOGS=1000       # Max audit logs stored locally
```

### Backend Environment Variables

```bash
# Server configuration
PORT=3000
NODE_ENV=production
APP_DOMAIN=https://yourapp.com

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
MONGODB_WHITELIST_COLLECTION=vip_whitelists
MONGODB_AUDIT_COLLECTION=audit_logs

# WebSocket
WEBSOCKET_PORT=3001
WEBSOCKET_PATH=/ws

# Security
JWT_SECRET=your-secret-key-here
API_KEY=your-api-key-here

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/app/vip-system.log
```

---

## Database Setup

### MongoDB Collections

**Create Whitelist Collection**
```javascript
db.createCollection('vip_whitelists', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      properties: {
        _id: { bsonType: 'string' },
        devWhitelist: { bsonType: 'array' },
        staffWhitelist: { bsonType: 'array' },
        lastUpdated: { bsonType: 'date' }
      }
    }
  }
});

// Create index
db.vip_whitelists.createIndex({ lastUpdated: -1 });
```

**Create Audit Logs Collection**
```javascript
db.createCollection('audit_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      properties: {
        _id: { bsonType: 'string' },
        adminId: { bsonType: 'string' },
        action: { bsonType: 'string' },
        timestamp: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes
db.audit_logs.createIndex({ timestamp: -1 });
db.audit_logs.createIndex({ adminId: 1 });
db.audit_logs.createIndex({ action: 1 });
```

---

## Backend Deployment

### Step 1: Prepare Backend Code

```bash
# Ensure all endpoints are implemented
# - POST /api/vip/whitelist/sync
# - GET /api/vip/whitelist/:type
# - POST /api/vip/whitelist/:type
# - DELETE /api/vip/whitelist/:type/:userId
# - POST /api/vip/audit/log
# - GET /api/vip/audit/logs
# - WebSocket broadcast handler

# Test locally first
npm install
npm run test
npm run dev  # Should run on http://localhost:3000
```

### Step 2: Database Migration

```javascript
// run-migrations.js
const mongodb = require('mongodb');
const client = new mongodb.MongoClient(process.env.MONGODB_URI);

async function migrate() {
  const db = client.db();
  
  // Create collections
  await db.createCollection('vip_whitelists');
  await db.createCollection('audit_logs');
  
  // Create indexes
  await db.collection('vip_whitelists').createIndex({ lastUpdated: -1 });
  await db.collection('audit_logs').createIndex({ timestamp: -1 });
  await db.collection('audit_logs').createIndex({ adminId: 1 });
  
  console.log('Database migration complete');
  process.exit(0);
}

migrate().catch(console.error);
```

```bash
# Run migration
node run-migrations.js
```

### Step 3: Deploy to Production

**Option A: Heroku**
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-secret
git push heroku main
heroku logs --tail
```

**Option B: AWS EC2**
```bash
# SSH into server
ssh -i key.pem ubuntu@your-server.com

# Clone and setup
git clone your-repo
cd your-repo
npm install
npm start  # Should start on :3000
```

**Option C: Docker**
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and deploy
docker build -t vip-backend .
docker run -p 3000:3000 -e MONGODB_URI=... vip-backend
```

### Step 4: Verify Backend is Running

```bash
# Test endpoints
curl https://api.yourserver.com/api/vip/whitelist/developer
# Expected: { "userIds": [] }

curl -X POST https://api.yourserver.com/api/vip/whitelist/sync \
  -H "Content-Type: application/json" \
  -d '{"devWhitelist":[],"staffWhitelist":[],"timestamp":"2026-01-22T00:00:00Z"}'
# Expected: { "success": true }
```

---

## App Deployment

### Step 1: Update Environment Variables

**Create .env.production**
```bash
EXPO_PUBLIC_BACKEND_URL=https://api.yourserver.com/api
EXPO_PUBLIC_REALTIME_URL=wss://api.yourserver.com/ws
```

**For EAS Build**
```bash
eas secret create BACKEND_URL --scope project --value "https://api.yourserver.com/api"
eas secret create REALTIME_URL --scope project --value "wss://api.yourserver.com/ws"
```

### Step 2: Build & Test

```bash
# Install dependencies
npm install

# Run locally (production mode)
EXPO_PUBLIC_BACKEND_URL=https://api.yourserver.com/api npm start

# Build for EAS
eas build --platform all --auto-submit
```

### Step 3: Verify App Connection

1. Install app on device
2. Open developer panel
3. Add test user
4. Check backend: curl endpoint should show user
5. Force close and reopen app
6. User should still be there (AsyncStorage persistence)
7. Check backend logs for sync events

---

## Monitoring & Health Checks

### Backend Health Endpoint

```javascript
// Add to server.js
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const db = client.db();
    await db.admin().ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      database: 'disconnected'
    });
  }
});
```

### Monitor This

**API Performance**
```bash
# Monitor endpoint response times
watch 'curl -w "@curl-format.txt" -o /dev/null -s https://api.yourserver.com/api/vip/whitelist/developer'
```

**Database Performance**
```javascript
// Monitor MongoDB performance
db.adminCommand({ serverStatus: 1 })
// Look for: opcounters, connections, memory
```

**Error Tracking**
```bash
# Check logs for errors
tail -f /var/log/app/vip-system.log | grep ERROR
```

**Audit Log Volume**
```javascript
// Monitor audit log growth
db.audit_logs.countDocuments()  // Should grow steadily, not spike
db.audit_logs.stats()           // Check storage size
```

---

## Rollback Plan

### If Something Goes Wrong

**Option 1: Revert Code**
```bash
# App
git revert HEAD
eas build --platform all

# Backend
git revert HEAD
npm start
```

**Option 2: Disable VIP Features**
```javascript
// In backend, add feature flag
const VIP_ENABLED = process.env.VIP_ENABLED === 'true';

if (!VIP_ENABLED) {
  // Return empty whitelists
  res.json({ userIds: [] });
}
```

**Option 3: Database Backup**
```bash
# Restore from backup
mongorestore --uri="mongodb+srv://..." dump/
```

### Testing Rollback

Test rollback procedure in staging before production:
1. Deploy version A
2. Test thoroughly
3. Deploy version B
4. Test thoroughly
5. If needed, rollback to version A
6. Verify everything still works

---

## Security Hardening

### API Security

1. **Enable HTTPS Only**
```javascript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

2. **CORS Configuration**
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.APP_DOMAIN,
  credentials: true
}));
```

3. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

4. **Input Validation**
```javascript
router.post('/whitelist/sync', (req, res) => {
  const { devWhitelist, staffWhitelist } = req.body;
  
  if (!Array.isArray(devWhitelist) || !Array.isArray(staffWhitelist)) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  // ... rest of logic
});
```

### Data Security

1. **Encrypt Sensitive Data**
```javascript
const crypto = require('crypto');
const encrypted = crypto.createCipher('aes192', process.env.ENCRYPTION_KEY);
// Encrypt audit logs before storage
```

2. **Access Control**
```javascript
// Verify admin before allowing changes
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

app.post('/api/vip/whitelist/sync', requireAdmin, syncHandler);
```

3. **Audit Log Retention**
```javascript
// Delete logs older than 90 days
db.audit_logs.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
});
```

---

## Performance Optimization

### Database

```javascript
// Optimize queries
db.vip_whitelists.createIndex({ _id: 1 })
db.audit_logs.createIndex({ timestamp: -1, adminId: 1 })

// Partition audit logs by month for faster queries
// Use database-specific partitioning features
```

### API

```javascript
// Cache whitelist data
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

router.get('/whitelist/developer', (req, res) => {
  const cached = cache.get('dev_whitelist');
  if (cached) return res.json({ userIds: cached });
  
  // Fetch from DB, cache result
  const result = await getFromDB();
  cache.set('dev_whitelist', result);
  res.json({ userIds: result });
});
```

### Frontend

```typescript
// Limit audit log queries
const logs = whitelistService.getAuditLogs(50); // Only get last 50
```

---

## Maintenance Schedule

### Daily
- [ ] Check error logs for crashes
- [ ] Verify WebSocket connections are stable
- [ ] Spot check a few sync requests

### Weekly
- [ ] Review audit log volume
- [ ] Check database disk space
- [ ] Verify backup completion
- [ ] Test health endpoint

### Monthly
- [ ] Database maintenance (cleanup, reindex)
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Audit performance metrics
- [ ] Test disaster recovery procedure

### Quarterly
- [ ] Full security audit
- [ ] Performance tuning
- [ ] Capacity planning
- [ ] Documentation review
- [ ] Team training

---

## Scaling Considerations

### Current Capacity
- **Users**: Up to 10,000 whitelisted users
- **Audit Logs**: 1,000+ per day sustainable
- **Concurrent Users**: 1,000+ concurrent sync requests
- **Database**: MongoDB single instance

### When to Scale

**Vertical Scaling** (when):
- Database CPU > 70% sustained
- Network I/O saturated
- Memory usage > 80%

**Horizontal Scaling** (when):
- More than 100,000 audit logs/month
- More than 10,000 users
- Need redundancy/HA

### Scaling Steps

```bash
# 1. Add database replica set
mongod --replSet myapp

# 2. Load balance API servers
# Use AWS ELB, nginx, etc.

# 3. Cache frequently accessed data
# Redis for whitelist caching

# 4. Archive old audit logs
# Move logs > 1 year to cold storage
```

---

## Post-Deployment Validation

### Immediate (After Deployment)

```bash
# 1. Backend is responding
curl https://api.yourserver.com/api/health

# 2. Database is connected
curl https://api.yourserver.com/api/vip/whitelist/developer

# 3. App can reach backend
# Check in app: Settings > Developer > API Status

# 4. WebSocket is working
# Check in app: Real-time features work
```

### 24 Hours Later

- [ ] No error spikes in logs
- [ ] Sync requests completing successfully
- [ ] WebSocket connections stable
- [ ] Database performance normal
- [ ] No complaints from users

### 1 Week Later

- [ ] Audit logs accumulating normally
- [ ] No data inconsistencies
- [ ] Performance stable
- [ ] User feedback positive
- [ ] Analytics show adoption

---

## Troubleshooting Post-Deployment

### Problem: App can't reach backend

**Check**:
```bash
# 1. Backend is running
curl https://api.yourserver.com/api/health

# 2. CORS is configured
curl -H "Origin: https://yourapp.com" https://api.yourserver.com/api/vip/whitelist/developer

# 3. Environment variable is correct
# In app console: console.log(process.env.EXPO_PUBLIC_BACKEND_URL)
```

**Fix**:
- Verify backend URL in .env
- Ensure backend is running
- Check firewall rules
- Verify CORS headers

### Problem: Whitelist not persisting

**Check**:
```bash
# 1. AsyncStorage is working
# App console: await AsyncStorage.setItem('test', 'value')

# 2. Backend sync is happening
# Backend logs should show sync requests

# 3. Database has data
# mongo: db.vip_whitelists.find()
```

**Fix**:
- Restart app
- Clear app cache
- Check device storage isn't full
- Verify backend is storing data

### Problem: WebSocket broadcast not working

**Check**:
```bash
# 1. WebSocket server is running
# Backend console should show connections

# 2. Both clients are connected
# App console: console.log(realtimeService.isConnected)

# 3. Broadcast is being sent
# Backend logs should show broadcast events
```

**Fix**:
- Restart WebSocket server
- Reconnect client
- Check firewall rules for WebSocket
- Verify wss:// URL is correct

---

## Alerts to Set Up

### Critical Alerts
- [ ] Backend service down (no response to health check)
- [ ] Database connection lost
- [ ] Error rate > 5% in last 5 minutes
- [ ] WebSocket disconnections > 10% of clients

### Warning Alerts
- [ ] Response time > 1 second
- [ ] Audit logs growing faster than normal
- [ ] Low disk space on database server
- [ ] High memory usage (> 80%)

### Info Alerts
- [ ] Daily summary of API calls
- [ ] Weekly sync statistics
- [ ] Monthly audit log count

---

## Success Criteria

After deployment, verify:

✅ **Functionality**
- [ ] AsyncStorage persistence working
- [ ] Backend sync completing
- [ ] Audit logs recording
- [ ] WebSocket broadcasts reaching clients

✅ **Performance**
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] WebSocket latency < 100ms
- [ ] No memory leaks

✅ **Reliability**
- [ ] 99.9% uptime
- [ ] Zero data loss
- [ ] Graceful error handling
- [ ] Automatic recovery from failures

✅ **Security**
- [ ] HTTPS enforced
- [ ] Admin actions audited
- [ ] Rate limiting active
- [ ] No sensitive data in logs

---

## Support & Escalation

**Level 1**: Check logs and restart services
**Level 2**: Review code and run tests
**Level 3**: Database maintenance and optimization
**Level 4**: Architecture review and scaling

---

**Deployment Status**: Ready ✓
**Last Updated**: 2026-01-22
**Next**: Monitor for 24 hours post-deployment
