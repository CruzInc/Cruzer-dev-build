# MongoDB Backend Integration - Quick Start

## ✅ Backend Server Setup Complete!

The MongoDB backend server is **fully operational** and tested. Here's what's working:

### 🚀 Server Status
- ✅ MongoDB running in Docker (localhost:27017)
- ✅ Express.js API server running (localhost:3000)
- ✅ All API endpoints tested and working
- ✅ Data push/pull operations verified

### 📡 API Endpoints Available

**Base URL (Development):** `http://localhost:3000/api`

#### Users
- `GET /api/users/:userId` - Get user profile
- `POST /api/users` - Create/update user
- `PATCH /api/users/:userId/settings` - Update settings
- `DELETE /api/users/:userId` - Delete user

#### Messages
- `GET /api/messages/:userId` - Get messages (query: contactId, limit, skip)
- `POST /api/messages` - Create message
- `POST /api/messages/bulk` - Bulk create messages
- `PATCH /api/messages/:messageId` - Update message (read status, etc.)
- `DELETE /api/messages/:messageId` - Delete message

#### Contacts
- `GET /api/contacts/:userId` - Get all contacts
- `POST /api/contacts` - Create contact
- `POST /api/contacts/bulk` - Bulk upsert contacts (for sync)
- `PATCH /api/contacts/:contactId` - Update contact
- `DELETE /api/contacts/:contactId` - Delete contact

#### Calculations
- `GET /api/calculations/:userId` - Get calculation history
- `POST /api/calculations` - Save calculation
- `DELETE /api/calculations/:calculationId` - Delete calculation
- `DELETE /api/calculations/user/:userId` - Clear all

### 🧪 Verified Test Results

```bash
# Create user - ✅ Working
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","email":"test@cruzer.app","displayName":"Test User"}'
# Response: {"success":true,"data":{...}}

# Get user - ✅ Working
curl http://localhost:3000/api/users/test123
# Response: {"success":true,"data":{...}}

# Create message - ✅ Working
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","contactId":"contact456","content":"Hello!","isEncrypted":false}'
# Response: {"success":true,"data":{...}}

# Get messages - ✅ Working
curl "http://localhost:3000/api/messages/test123?contactId=contact456"
# Response: {"success":true,"data":[...],"count":1}
```

### 📱 Using in Cruzer App

The `services/backend.ts` has been updated with MongoDB methods:

```typescript
import { backend } from './services/backend';

// Initialize (already configured for localhost:3000)
// No additional setup needed in dev mode

// Sync messages (push local + pull from server)
const messages = await backend.syncMessages(userId, localMessages);

// Sync contacts (push local + pull from server)
const contacts = await backend.syncContacts(userId, localContacts);

// Individual operations
await backend.createMessage({
  userId: 'user123',
  contactId: 'contact456',
  content: 'Hello!',
  isEncrypted: false
});

const userMessages = await backend.getMessages('user123', 'contact456');

await backend.saveCalculation({
  userId: 'user123',
  expression: '2 + 2',
  result: '4'
});
```

### 🔧 Configuration

1. **Start MongoDB** (already running):
```bash
docker run -d -p 27017:27017 --name mongodb-cruzer mongo:latest
```

2. **Start Backend Server** (already running):
```bash
cd backend
npm start
```

3. **Add to your .env** file:
```bash
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000/api
```

For **production/physical devices**, you'll need:
```bash
# Replace with your actual server URL
EXPO_PUBLIC_BACKEND_URL=https://your-backend-domain.com/api
```

### 🔐 Security Features

- ✅ Helmet.js security headers
- ✅ CORS protection (configurable)
- ✅ Rate limiting (100 req/15min per IP)
- ✅ Request size limits (10MB)
- ✅ Environment-based error messages

### 📊 Database Models

All data is stored in MongoDB with these schemas:

**User**: userId, email, displayName, photoURL, settings, timestamps  
**Message**: userId, contactId, content, isEncrypted, timestamps, read/sent/delivered status  
**Contact**: userId, contactId, name, phone, email, isFavorite, isBlocked  
**Calculation**: userId, expression, result, timestamp

### 🚀 Next Steps

1. **For Development Testing:**
   - Server is already running at http://localhost:3000
   - Use the Cruzer app with Expo Go or simulator
   - Data will sync automatically

2. **For Production Deployment:**
   - Deploy backend to a cloud service (Heroku, Railway, AWS, etc.)
   - Update MongoDB connection to cloud MongoDB (MongoDB Atlas)
   - Set production URL in app's .env file
   - Configure CORS for production domain

3. **Integration Example:**
```typescript
// In your Cruzer app component
import { backend } from '../services/backend';

useEffect(() => {
  // Initialize on app start
  backend.setCurrentUser(userId);
  
  // Sync messages periodically
  const syncInterval = setInterval(async () => {
    try {
      const serverMessages = await backend.syncMessages(userId, localMessages);
      // Update local state with server messages
      setMessages(serverMessages);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, 60000); // Every 60 seconds
  
  return () => clearInterval(syncInterval);
}, [userId]);
```

### 📁 Backend Files Created

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js              # User schema
│   ├── Message.js           # Message schema
│   ├── Contact.js           # Contact schema
│   └── Calculation.js       # Calculation schema
├── routes/
│   ├── users.js             # User API routes
│   ├── messages.js          # Message API routes
│   ├── contacts.js          # Contact API routes
│   └── calculations.js      # Calculation API routes
├── server.js                # Main Express server
├── package.json             # Dependencies
├── .env                     # Configuration (not in git)
├── .env.example             # Configuration template
├── .gitignore               # Git ignore rules
└── README.md                # Full documentation
```

### ✨ Status: FULLY WORKING

- Backend server: **Running** ✅
- MongoDB: **Running** ✅
- API endpoints: **Tested & Working** ✅
- App integration: **Ready** ✅
- Push/Pull sync: **Verified** ✅

Your MongoDB backend is ready to use!
