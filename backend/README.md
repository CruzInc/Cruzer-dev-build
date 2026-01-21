# Cruzer Backend Server

MongoDB backend server for the Cruzer mobile app.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 3000)

3. Start MongoDB:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb
```

4. Run the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Users
- `GET /api/users/:userId` - Get user by ID
- `POST /api/users` - Create or update user
- `PATCH /api/users/:userId/settings` - Update user settings
- `DELETE /api/users/:userId` - Delete user

### Messages
- `GET /api/messages/:userId` - Get messages for user (query: `contactId`, `limit`, `skip`)
- `POST /api/messages` - Create new message
- `POST /api/messages/bulk` - Bulk create messages
- `PATCH /api/messages/:messageId` - Update message
- `DELETE /api/messages/:messageId` - Delete message

### Contacts
- `GET /api/contacts/:userId` - Get all contacts for user
- `POST /api/contacts` - Create new contact
- `POST /api/contacts/bulk` - Bulk upsert contacts
- `PATCH /api/contacts/:contactId` - Update contact
- `DELETE /api/contacts/:contactId` - Delete contact

### Calculations
- `GET /api/calculations/:userId` - Get calculation history
- `POST /api/calculations` - Save new calculation
- `DELETE /api/calculations/:calculationId` - Delete calculation
- `DELETE /api/calculations/user/:userId` - Clear all calculations for user

### Health Check
- `GET /health` - Server health status

## Database Models

### User
- userId (unique)
- email
- displayName
- photoURL
- settings (theme, notifications)
- timestamps

### Message
- userId
- contactId
- content
- isEncrypted
- timestamp
- isRead, isSent, isDelivered
- messageType (text, image, voice, video)
- mediaUrl

### Contact
- userId
- contactId
- name, phoneNumber, email
- photoURL
- isFavorite, isBlocked
- lastMessageAt
- timestamps

### Calculation
- userId
- expression
- result
- timestamp

## Security Features

- Helmet.js for security headers
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- Request body size limits (10mb)
- Environment-based error messages

## Deployment

For production:
1. Set `NODE_ENV=production` in `.env`
2. Update `MONGODB_URI` with production MongoDB URL
3. Set strong `JWT_SECRET`
4. Configure CORS origins in `server.js`
5. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js --name cruzer-backend
```
